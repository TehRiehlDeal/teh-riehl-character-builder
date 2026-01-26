<script lang="ts">
	import { untrack, onMount } from 'svelte';
	import { character } from '$lib/stores/character';
	import { getBuilderDataContext } from '$lib/contexts/builderDataContext.svelte';
	import type { Ancestry, Heritage, Background, Class, Feat, ClassFeature } from '$lib/data/types/app';
	import AncestrySelector from '$lib/components/wizard/AncestrySelector.svelte';
	import HeritageSelector from '$lib/components/wizard/HeritageSelector.svelte';
	import BackgroundSelector from '$lib/components/wizard/BackgroundSelector.svelte';
	import ClassSelector from '$lib/components/wizard/ClassSelector.svelte';
	import AbilityBoostSelector from '$lib/components/wizard/AbilityBoostSelector.svelte';
	import AbilityScoreManager from '$lib/components/wizard/AbilityScoreManager.svelte';
	import SkillSelector from '$lib/components/wizard/SkillSelector.svelte';
	import FeatPicker from '$lib/components/features/FeatPicker.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import RichDescription from '$lib/components/common/RichDescription.svelte';
	import { loadAllClassFeatures } from '$lib/data/repositories/classFeatureRepository';
	import { extractChoiceInfo, getCompleteChoiceInfo, type ClassFeatureChoiceInfo } from '$lib/utils/classFeatureChoices';
	import { getExcerpt } from '$lib/utils/descriptionParser';
	import { getClassArchetypesForClass } from '$lib/data/repositories/classArchetypeRepository';
	import type { ClassArchetype } from '$lib/data/types/app';
	import { extractGrantedItems, extractItemNameFromUUID, getImmediateClassFeatures, getDedicationFeat } from '$lib/utils/classArchetypeUtils';

	// Get shared data from context (loaded once in layout)
	const builderData = getBuilderDataContext();

	let selectedAncestry: Ancestry | null = $state(null);
	let selectedHeritage: Heritage | null = $state(null);
	let selectedBackground: Background | null = $state(null);
	let selectedClass: Class | null = $state(null);
	let ancestryAbilityBoosts: (string | null)[] = $state([]);
	let backgroundAbilityBoosts: (string | null)[] = $state([null, null]);
	let selectedKeyAbility: string | null = $state(null);
	let freeAbilityBoosts: (string | null)[] = $state([null, null, null, null]);
	let trainedSkills: string[] = $state([]);
	let heritageChoices: Record<string, string> = $state({}); // Key: flag name, Value: selected value
	let archetypeDescriptionExpanded = $state(false); // Track if archetype description is expanded
	let classFeatureChoiceSelections = $state<Record<string, string>>({}); // Maps choiceFlag to selected value
	let allClassFeatures = $state<ClassFeature[]>([]);
	let classFeatureChoiceInfo = $state<Record<string, ClassFeatureChoiceInfo>>({});
	let availableClassArchetypes = $state<ClassArchetype[]>([]);
	let selectedClassArchetype = $state<ClassArchetype | null>(null);
	let archetypeDetailModalOpen = $state(false);
	let archetypeForDetails = $state<ClassArchetype | null>(null);
	let hasRestoredData = $state(false);

	// State for class change confirmation modal
	let showClassChangeModal = $state(false);
	let pendingClassChange = $state<Class | null>(null);

	// Restore character selections reactively when data becomes available
	$effect(() => {
		// Wait for critical data to load
		if (builderData.criticalDataLoading || hasRestoredData) return;
		if (builderData.ancestries.length === 0) return;

		const currentChar = $character;

		// Restore Phase 1 selections (ancestries, backgrounds, classes)
		if (currentChar.ancestry.name && !selectedAncestry) {
			selectedAncestry = builderData.ancestries.find((a) => a.name === currentChar.ancestry.name) || null;
		}
		if (currentChar.background.name && !selectedBackground) {
			selectedBackground =
				builderData.backgrounds.find((b) => b.name === currentChar.background.name) || null;
		}
		if (currentChar.class.name && !selectedClass) {
			selectedClass = builderData.classes.find((c) => c.name === currentChar.class.name) || null;
		}
		if (currentChar.class.keyAbility && !selectedKeyAbility) {
			selectedKeyAbility = currentChar.class.keyAbility;
		}

		// Restore ancestry ability boosts
		if (currentChar.ruleSelections && selectedAncestry && ancestryAbilityBoosts.length === 0) {
			const freeBoosts = selectedAncestry.boosts.filter((b) => b.free || b.options.length > 1);
			const ancestryBoosts: (string | null)[] = new Array(freeBoosts.length).fill(null);
			for (let i = 0; i < freeBoosts.length; i++) {
				const saved = currentChar.ruleSelections[`ancestry-boost-${i}`];
				ancestryBoosts[i] = typeof saved === 'string' ? saved : null;
			}
			if (ancestryBoosts.some((b) => b !== null)) {
				ancestryAbilityBoosts = ancestryBoosts;
			}
		}

		// Restore background ability boosts
		if (currentChar.ruleSelections && selectedBackground) {
			const bgBoosts: (string | null)[] = [
				(typeof currentChar.ruleSelections['background-boost-0'] === 'string' ? currentChar.ruleSelections['background-boost-0'] : null),
				(typeof currentChar.ruleSelections['background-boost-1'] === 'string' ? currentChar.ruleSelections['background-boost-1'] : null)
			];
			if (bgBoosts.some((b) => b !== null)) {
				backgroundAbilityBoosts = bgBoosts;
			}
		}

		// Restore free ability boosts and trained skills
		if (currentChar.ruleSelections) {
			const boosts: (string | null)[] = [
				(typeof currentChar.ruleSelections['free-boost-0'] === 'string' ? currentChar.ruleSelections['free-boost-0'] : null),
				(typeof currentChar.ruleSelections['free-boost-1'] === 'string' ? currentChar.ruleSelections['free-boost-1'] : null),
				(typeof currentChar.ruleSelections['free-boost-2'] === 'string' ? currentChar.ruleSelections['free-boost-2'] : null),
				(typeof currentChar.ruleSelections['free-boost-3'] === 'string' ? currentChar.ruleSelections['free-boost-3'] : null)
			];
			if (boosts.some((b) => b !== null)) {
				freeAbilityBoosts = boosts;
			}

			// Restore trained skills
			if (currentChar.ruleSelections['trained-skills']) {
				const skills = currentChar.ruleSelections['trained-skills'];
				if (typeof skills === 'string') {
					trainedSkills = skills.split(',').filter(Boolean);
				} else if (Array.isArray(skills)) {
					trainedSkills = skills;
				}
			}
		}

		hasRestoredData = true;
	});

	// Re-apply class proficiencies if they're missing (migration for older characters)
	// This effect only runs for migration purposes - normal class selection applies profs directly
	$effect(() => {
		if (!selectedClass) return;

		const currentChar = $character;
		const classProfs = selectedClass.proficiencies;

		// Check if saves are all 0 (meaning they weren't set from class)
		const savesNotSet = currentChar.saves.fortitude === 0 &&
			currentChar.saves.reflex === 0 &&
			currentChar.saves.will === 0;

		// Check if saves need to be updated (different from class proficiencies)
		const savesNeedUpdate = savesNotSet && (
			currentChar.saves.fortitude !== classProfs.fortitude ||
			currentChar.saves.reflex !== classProfs.reflex ||
			currentChar.saves.will !== classProfs.will
		);

		// Check if armor proficiencies need to be updated (different from class proficiencies)
		const armorNeedsUpdate =
			currentChar.armorProficiency.unarmored !== classProfs.defenses.unarmored ||
			currentChar.armorProficiency.light !== classProfs.defenses.light ||
			currentChar.armorProficiency.medium !== classProfs.defenses.medium ||
			currentChar.armorProficiency.heavy !== classProfs.defenses.heavy;

		// Only update if values would actually change
		if (savesNeedUpdate || armorNeedsUpdate) {
			untrack(() => {
				character.update((char) => ({
					...char,
					saves: savesNeedUpdate ? {
						fortitude: classProfs.fortitude,
						reflex: classProfs.reflex,
						will: classProfs.will
					} : char.saves,
					perception: savesNeedUpdate ? classProfs.perception : char.perception,
					armorProficiency: armorNeedsUpdate ? {
						unarmored: classProfs.defenses.unarmored,
						light: classProfs.defenses.light,
						medium: classProfs.defenses.medium,
						heavy: classProfs.defenses.heavy
					} : char.armorProficiency
				}));
			});
		}
	});

	// Re-apply skill proficiencies from trained skills (migration for older characters)
	$effect(() => {
		if (trainedSkills.length === 0) return;

		const currentChar = $character;

		// Check if all skills are 0 (meaning they weren't set)
		const allSkillsUntrained = Object.values(currentChar.skills).every(rank => rank === 0);

		// If all skills are untrained but we have trained skills selected, apply them
		if (allSkillsUntrained) {
			untrack(() => {
				character.update((char) => {
					const updatedSkills = { ...char.skills };

					// Set selected skills to trained (rank 1)
					trainedSkills.forEach(skill => {
						const skillKey = skill.toLowerCase();
						if (updatedSkills.hasOwnProperty(skillKey)) {
							updatedSkills[skillKey] = 1;
						}
					});

					return {
						...char,
						skills: updatedSkills
					};
				});
			});
		}
	});

	// Update class features when character level or class changes
	$effect(() => {
		// Wait for classes to load
		if (builderData.criticalDataLoading || builderData.classes.length === 0) return;

		const currentChar = $character;
		const currentLevel = currentChar.level;

		// If character has a class, make sure class features are populated
		if (currentChar.class.name) {
			const charClass = builderData.classes.find((c) => c.name === currentChar.class.name);
			if (!charClass) return;

			// Filter class features for the character's current level
			const relevantClassFeatures = charClass.classFeatures
				.filter((cf) => cf.level <= currentLevel)
				.map((cf) => ({
					level: cf.level,
					name: cf.name,
					rules: []
				}));

			// Only update if the class features have actually changed
			const currentFeaturesCount = currentChar.classFeatures.length;
			const newFeaturesCount = relevantClassFeatures.length;

			if (currentFeaturesCount !== newFeaturesCount) {
				untrack(() => {
					character.update((char) => ({
						...char,
						classFeatures: relevantClassFeatures
					}));
				});
			}
		}
	});

	// Restore heritage selections when heritage data loads
	$effect(() => {
		if (builderData.heritagesLoading) return;
		if (builderData.heritages.length === 0) return;

		const currentChar = $character;

		// Restore heritage selection
		if (currentChar.ancestry.heritage && !selectedHeritage) {
			selectedHeritage =
				builderData.heritages.find((h) => h.name === currentChar.ancestry.heritage) || null;
		}

		// Restore heritage choices
		if (selectedHeritage && currentChar.ruleSelections && Object.keys(heritageChoices).length === 0) {
			const choices: Record<string, string> = {};
			for (const key in currentChar.ruleSelections) {
				if (key.startsWith('heritage-')) {
					const flag = key.replace('heritage-', '');
					const value = currentChar.ruleSelections[key];
					if (typeof value === 'string') {
						choices[flag] = value;
					}
				}
			}
			if (Object.keys(choices).length > 0) {
				heritageChoices = choices;
			}
		}
	});

	// Load class features and extract choice information on mount
	onMount(async () => {
		// Load all class features for resolving tag-based choices
		allClassFeatures = await loadAllClassFeatures();

		// Load class feature choice selections from character store
		const char = $character;
		if (char.ruleSelections) {
			// Extract all class feature choice selections
			Object.entries(char.ruleSelections).forEach(([key, value]) => {
				// Skip planning selections and other known prefixes
				if (!key.startsWith('plan-level-') &&
					!key.startsWith('heritage-') &&
					!key.startsWith('ancestry-boost-') &&
					!key.startsWith('background-boost-') &&
					!key.startsWith('free-boost-') &&
					key !== 'trained-skills' &&
					typeof value === 'string') {
					classFeatureChoiceSelections[key] = value;
				}
			});
		}

		// Process class features to build choice info map when class is selected
		if (selectedClass) {
			await loadClassFeatureChoices(selectedClass);
		}
	});

	// Function to load class feature choices for a given class
	async function loadClassFeatureChoices(cls: Class) {
		const newChoiceInfo: Record<string, ClassFeatureChoiceInfo> = {};

		// Get level 1 class features
		const level1Features = cls.classFeatures.filter(cf => cf.level === 1);

		for (const cf of level1Features) {
			// Find the full class feature data
			const fullClassFeature = allClassFeatures.find(acf => acf.name === cf.name);
			if (fullClassFeature) {
				const choiceInfo = await getCompleteChoiceInfo(fullClassFeature, allClassFeatures);
				if (choiceInfo.hasChoice && choiceInfo.choiceFlag) {
					newChoiceInfo[choiceInfo.choiceFlag] = choiceInfo;
				}
			}
		}

		classFeatureChoiceInfo = newChoiceInfo;
	}

	// Filter class feature choices based on archetype suppressions and add granted features
	const filteredClassFeatureChoiceInfo = $derived.by(() => {
		if (!selectedClassArchetype) {
			return classFeatureChoiceInfo;
		}

		const filtered: Record<string, ClassFeatureChoiceInfo> = {};

		// Get the flags of suppressed features by looking them up in allClassFeatures
		const suppressedFlags = new Set<string>();
		for (const suppressedUUID of selectedClassArchetype.suppressedFeatures) {
			const suppressedName = extractItemNameFromUUID(suppressedUUID);
			if (!suppressedName) continue;

			// Find the class feature with this name
			const suppressedFeature = allClassFeatures.find((cf) => cf.name === suppressedName);
			if (suppressedFeature) {
				// Extract the choice flag from this feature
				const choiceInfo = extractChoiceInfo(suppressedFeature);
				if (choiceInfo.choiceFlag) {
					suppressedFlags.add(choiceInfo.choiceFlag);
				}
			}
		}

		// Filter out suppressed choices and add granted features to their parent choices
		for (const [flag, info] of Object.entries(classFeatureChoiceInfo)) {
			if (!suppressedFlags.has(flag)) {
				// Clone the choice info to avoid mutating the original
				const modifiedInfo = { ...info, choices: [...info.choices] };

				// Add granted features that belong to this choice set
				const grantedFeatures = getImmediateClassFeatures(selectedClassArchetype);
				for (const granted of grantedFeatures) {
					const featureName = extractItemNameFromUUID(granted.uuid);
					if (!featureName) continue;

					const grantedFeature = allClassFeatures.find((cf) => cf.name === featureName);
					if (!grantedFeature) continue;

					// Check if this granted feature should be in this choice set
					const alreadyExists = modifiedInfo.choices.some((c) => c.value === grantedFeature.id);
					if (!alreadyExists) {
						// For tag-based choices, check if the ARCHETYPE has the filter tag
						// (indicating it grants features for this choice type)
						// or if the granted feature itself has the filter tag
						let shouldAdd = false;

						if (info.choiceType === 'tag-based' && info.filterTag) {
							// Check if the archetype itself has the filter tag
							// (e.g., Runelord has "wizard-arcane-school" tag)
							if (selectedClassArchetype.traits.includes(info.filterTag)) {
								shouldAdd = true;
							}
							// Or check if granted feature has the filter tag
							else if (grantedFeature.traits.includes(info.filterTag)) {
								shouldAdd = true;
							}
						}

						if (shouldAdd) {
							modifiedInfo.choices.push({
								value: grantedFeature.id,
								label: grantedFeature.name
							});
						}
					}
				}

				filtered[flag] = modifiedInfo;
			}
		}

		// Also check if any granted features have their OWN choices (e.g., School of Thassilonian Rune Magic has a sin choice)
		const grantedFeatures = getImmediateClassFeatures(selectedClassArchetype);
		for (const granted of grantedFeatures) {
			const featureName = extractItemNameFromUUID(granted.uuid);
			if (!featureName) continue;

			const grantedFeature = allClassFeatures.find((cf) => cf.name === featureName);
			if (!grantedFeature) continue;

			const grantedChoiceInfo = extractChoiceInfo(grantedFeature);
			if (grantedChoiceInfo.hasChoice && grantedChoiceInfo.choiceFlag) {
				// Only add if not already present and not suppressed
				if (!filtered[grantedChoiceInfo.choiceFlag] && !suppressedFlags.has(grantedChoiceInfo.choiceFlag)) {
					filtered[grantedChoiceInfo.choiceFlag] = grantedChoiceInfo;
				}
			}
		}

		return filtered;
	});

	// Check if a class feature choice is auto-granted by archetype (should be readonly)
	function isAutoGrantedFeature(choiceFlag: string): boolean {
		if (!selectedClassArchetype) return false;

		const grantedFeatures = getImmediateClassFeatures(selectedClassArchetype);
		return grantedFeatures.some((granted) => {
			const featureName = extractItemNameFromUUID(granted.uuid);
			if (!featureName) return false;

			// Find the granted feature in allClassFeatures
			const grantedClassFeature = allClassFeatures.find((cf) => cf.name === featureName);
			if (!grantedClassFeature) return false;

			// Check if this feature's parent has the choiceFlag
			// The granted feature is a specific option within a choice set
			// We need to find the parent feature that has the ChoiceSet rule
			// For example, "School of Thassilonian Rune Magic" is a choice within "Arcane School"
			// We can check if this feature has the tag that matches the choice filter
			const parentChoice = Object.entries(classFeatureChoiceInfo).find(([flag, info]) => {
				return info.choices.some((choice) => choice.value === grantedClassFeature.id);
			});

			return parentChoice?.[0] === choiceFlag;
		});
	}

	// Update class feature choices when selectedClass changes
	$effect(() => {
		if (selectedClass && allClassFeatures.length > 0) {
			loadClassFeatureChoices(selectedClass);
		}
	});

	// Load available class archetypes when class is selected
	$effect(() => {
		if (selectedClass) {
			loadAvailableClassArchetypes(selectedClass.name);
		} else {
			availableClassArchetypes = [];
		}
	});

	// Auto-select granted features when archetype is selected and filtered choices are ready
	$effect(() => {
		if (selectedClassArchetype && Object.keys(filteredClassFeatureChoiceInfo).length > 0) {
			const immediateFeatures = getImmediateClassFeatures(selectedClassArchetype);

			for (const grantedItem of immediateFeatures) {
				const featureName = extractItemNameFromUUID(grantedItem.uuid);
				if (!featureName) continue;

				const classFeature = allClassFeatures.find((cf) => cf.name === featureName);
				if (!classFeature) continue;

				// Find which choice set this feature belongs to in the filtered choices
				for (const [choiceFlag, choiceInfo] of Object.entries(filteredClassFeatureChoiceInfo)) {
					// Check if this granted feature is in this choice set
					const isInChoices = choiceInfo.choices.some((c) => c.value === classFeature.id);

					if (isInChoices && !classFeatureChoiceSelections[choiceFlag]) {
						// Auto-select this feature
						classFeatureChoiceSelections[choiceFlag] = classFeature.id;

						// Save to character store
						character.update((char) => ({
							...char,
							ruleSelections: {
								...char.ruleSelections,
								[choiceFlag]: classFeature.id
							}
						}));
					}
				}
			}
		}
	});

	// Restore selected class archetype from character store
	$effect(() => {
		const char = $character;
		if (char.class.classArchetype && !selectedClassArchetype && availableClassArchetypes.length > 0) {
			const archetype = availableClassArchetypes.find(a => a.id === char.class.classArchetype);
			if (archetype) {
				selectedClassArchetype = archetype;
			}
		}
	});

	async function loadAvailableClassArchetypes(className: string) {
		const archetypes = await getClassArchetypesForClass(className);
		availableClassArchetypes = archetypes;
	}

	// Filter heritages based on selected ancestry
	const availableHeritages = $derived.by(() => {
		if (!selectedAncestry) return [];
		const ancestry = selectedAncestry;
		return builderData.heritages.filter((h) => h.ancestry === ancestry.name);
	});

	// Filter ancestry feats based on selected ancestry
	// Uses pre-filtered ancestry feats from context for better performance
	const ancestryFeats = $derived.by(() => {
		if (!selectedAncestry) return [];
		const ancestrySlug = selectedAncestry.name.toLowerCase();
		const charLevel = $character.level;
		return builderData.getAncestryFeats().filter(
			(feat) =>
				feat.level <= charLevel &&
				feat.traits.includes(ancestrySlug)
		);
	});

	// Filter class feats based on selected class
	// Uses pre-filtered class feats from context for better performance
	const classFeats = $derived.by(() => {
		if (!selectedClass) return [];
		const classSlug = selectedClass.name.toLowerCase();
		const charLevel = $character.level;
		return builderData.getClassFeats().filter(
			(feat) =>
				feat.level <= charLevel &&
				feat.traits.includes(classSlug)
		);
	});

	function handleAncestrySelect(ancestry: Ancestry) {
		selectedAncestry = ancestry;
		selectedHeritage = null; // Reset heritage when ancestry changes

		// Initialize ancestry ability boosts array (for free/choice boosts)
		const freeBoosts = ancestry.boosts.filter((b) => b.free || b.options.length > 1);
		ancestryAbilityBoosts = new Array(freeBoosts.length).fill(null);

		// Update character store
		character.update((char) => ({
			...char,
			ancestry: {
				id: ancestry.id,
				name: ancestry.name,
				heritage: null
			},
			abilities: {
				...char.abilities
				// Ability boosts will be applied in the ability score section
			}
		}));
	}

	function handleAncestryAbilityBoost(index: number, ability: string) {
		// Create a new array to trigger reactivity
		const newBoosts = [...ancestryAbilityBoosts];
		newBoosts[index] = ability;
		ancestryAbilityBoosts = newBoosts;

		// Update character store with rule selections
		character.update((char) => ({
			...char,
			ruleSelections: {
				...char.ruleSelections,
				[`ancestry-boost-${index}`]: ability
			}
		}));
	}

	function handleHeritageSelect(heritage: Heritage) {
		selectedHeritage = heritage;

		// Reset heritage choices when changing heritage
		heritageChoices = {};

		// Update character store
		character.update((char) => ({
			...char,
			ancestry: {
				...char.ancestry,
				heritage: heritage.name
			}
		}));
	}

	function handleHeritageChoiceSelect(flag: string, value: string) {
		// Update local state with new array reference for reactivity
		heritageChoices = {
			...heritageChoices,
			[flag]: value
		};

		// Update character store
		character.update((char) => ({
			...char,
			ruleSelections: {
				...char.ruleSelections,
				[`heritage-${flag}`]: value
			}
		}));
	}

	function handleClassFeatureChoiceSelection(choiceFlag: string, value: string) {
		classFeatureChoiceSelections[choiceFlag] = value;

		// Save to character store
		character.update((char) => ({
			...char,
			ruleSelections: {
				...char.ruleSelections,
				[choiceFlag]: value
			}
		}));
	}

	function handleClassArchetypeSelect(archetype: ClassArchetype) {
		selectedClassArchetype = archetype;
		archetypeDescriptionExpanded = false; // Reset expansion state
		character.setClassArchetype(archetype.id);

		// Auto-apply granted class features
		applyArchetypeGrantedFeatures(archetype);
	}

	/**
	 * Apply auto-granted feats from archetype
	 * For example, Runelord grants Runelord Dedication at level 2
	 * Note: Auto-selection of class features is handled by an effect watching filteredClassFeatureChoiceInfo
	 */
	function applyArchetypeGrantedFeatures(archetype: ClassArchetype) {

		// Auto-grant dedication feat at level 2
		const dedicationFeat = getDedicationFeat(archetype);
		if (dedicationFeat) {
			const featName = extractItemNameFromUUID(dedicationFeat.uuid);
			if (featName) {
				// Find the feat in our data
				const feat = builderData.feats.find((f) => f.name === featName);
				if (feat) {
					// Remove any existing feat at level 2 class slot (in case user already selected one)
					character.update((char) => ({
						...char,
						feats: {
							...char.feats,
							class: char.feats.class.filter((f) => f.level !== 2)
						}
					}));

					// Add the dedication feat as auto-granted
					character.addFeat('class', 2, feat.id, feat.name, true);
				}
			}
		}
	}

	function handleClassArchetypeClear() {
		// Clear auto-granted features before removing archetype
		if (selectedClassArchetype) {
			clearArchetypeGrantedFeatures(selectedClassArchetype);
		}

		selectedClassArchetype = null;
		character.clearClassArchetype();
	}

	/**
	 * Clear auto-granted class features and feats from archetype
	 */
	function clearArchetypeGrantedFeatures(archetype: ClassArchetype) {
		const immediateFeatures = getImmediateClassFeatures(archetype);

		// Clear immediate class features
		for (const grantedItem of immediateFeatures) {
			const featureName = extractItemNameFromUUID(grantedItem.uuid);
			if (!featureName) continue;

			const classFeature = allClassFeatures.find((cf) => cf.name === featureName);
			if (!classFeature) continue;

			const choiceInfo = extractChoiceInfo(classFeature);
			if (choiceInfo.hasChoice && choiceInfo.choiceFlag) {
				const choiceFlag = choiceInfo.choiceFlag;

				// Clear the selection
				delete classFeatureChoiceSelections[choiceFlag];

				// Clear from character store
				character.update((char) => {
					const newSelections = { ...char.ruleSelections };
					delete newSelections[choiceFlag];
					return {
						...char,
						ruleSelections: newSelections
					};
				});
			}
		}

		// Remove auto-granted dedication feat at level 2
		const dedicationFeat = getDedicationFeat(archetype);
		if (dedicationFeat) {
			const featName = extractItemNameFromUUID(dedicationFeat.uuid);
			if (featName) {
				const feat = builderData.feats.find((f) => f.name === featName);
				if (feat) {
					// Remove the auto-granted dedication feat
					character.update((char) => ({
						...char,
						feats: {
							...char.feats,
							class: char.feats.class.filter((f) => !(f.level === 2 && f.autoGranted))
						}
					}));
				}
			}
		}
	}

	function viewArchetypeDetails(archetype: ClassArchetype) {
		archetypeForDetails = archetype;
		archetypeDetailModalOpen = true;
	}

	function closeArchetypeDetails() {
		archetypeDetailModalOpen = false;
	}

	/**
	 * Convert camelCase or kebab-case to Title Case
	 * Examples: "hybridStudy" -> "Hybrid Study", "arcane-school" -> "Arcane School"
	 */
	function formatChoiceLabel(choiceFlag: string): string {
		// First convert from camelCase to space-separated
		let formatted = choiceFlag.replace(/([A-Z])/g, ' $1');
		// Also handle kebab-case
		formatted = formatted.replace(/-/g, ' ');
		// Trim and capitalize first letter of each word
		return formatted
			.trim()
			.split(' ')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	}

	function handleAncestryFeatSelect(feat: Feat) {
		// Remove existing level 1 ancestry feat if any
		const existingFeat = $character.feats.ancestry.find((f) => f.level === 1);
		if (existingFeat) {
			character.removeFeat('ancestry', existingFeat.featId);
		}

		// Add new feat at level 1
		character.addFeat('ancestry', 1, feat.id, feat.name);
	}

	function handleClassFeatSelect(feat: Feat) {
		// Remove existing level 1 class feat if any
		const existingFeat = $character.feats.class.find((f) => f.level === 1);
		if (existingFeat) {
			character.removeFeat('class', existingFeat.featId);
		}

		// Add new feat at level 1
		character.addFeat('class', 1, feat.id, feat.name);
	}

	function handleBackgroundSelect(background: Background) {
		selectedBackground = background;
		backgroundAbilityBoosts = [null, null]; // Reset ability boosts

		// Update character store
		character.update((char) => ({
			...char,
			background: {
				id: background.id,
				name: background.name
			}
		}));
	}

	function handleBackgroundAbilityBoost(index: number, ability: string) {
		backgroundAbilityBoosts[index] = ability;

		// Update character store with rule selections
		character.update((char) => ({
			...char,
			ruleSelections: {
				...char.ruleSelections,
				[`background-boost-${index}`]: ability
			}
		}));
	}

	// Ability name mapping from short form to full name
	const abilityNameMap: Record<string, string> = {
		str: 'Strength',
		dex: 'Dexterity',
		con: 'Constitution',
		int: 'Intelligence',
		wis: 'Wisdom',
		cha: 'Charisma'
	};

	// Get available abilities for a background boost
	function getAvailableAbilities(boost: { index: number; options: string[]; free: boolean }): string[] {
		// If it's a free boost (all 6 options), return all abilities
		if (boost.free || boost.options.length === 6) {
			return ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
		}

		// Otherwise map the short form options to full names
		return boost.options.map((opt) => abilityNameMap[opt.toLowerCase()] || opt);
	}

	function handleClassSelect(cls: Class) {
		// If there's already a class selected and it's different, show confirmation
		if (selectedClass && selectedClass.name !== cls.name) {
			pendingClassChange = cls;
			showClassChangeModal = true;
			return;
		}

		// First time selection or same class - apply directly
		applyClassSelection(cls);
	}

	function applyClassSelection(cls: Class) {
		selectedClass = cls;
		selectedKeyAbility = null; // Reset key ability when class changes
		trainedSkills = []; // Reset trained skills for new class

		// Filter class features for the character's current level
		const relevantClassFeatures = cls.classFeatures
			.filter((cf) => cf.level <= $character.level)
			.map((cf) => ({
				level: cf.level,
				name: cf.name,
				rules: [] // We don't have rules in the class features yet, so empty array
			}));

		// Update character store with class information and proficiencies
		character.update((char) => ({
			...char,
			class: {
				id: cls.id,
				name: cls.name,
				subclass: null,
				keyAbility: null,
				classArchetype: null
			},
			// Apply class features for the character's current level
			classFeatures: relevantClassFeatures,
			// Apply class saving throw proficiencies
			saves: {
				fortitude: cls.proficiencies.fortitude,
				reflex: cls.proficiencies.reflex,
				will: cls.proficiencies.will
			},
			// Apply class perception proficiency
			perception: cls.proficiencies.perception,
			// Apply class armor proficiencies
			armorProficiency: {
				unarmored: cls.proficiencies.defenses.unarmored,
				light: cls.proficiencies.defenses.light,
				medium: cls.proficiencies.defenses.medium,
				heavy: cls.proficiencies.defenses.heavy
			},
			// Apply class HP per level
			hp: {
				...char.hp,
				max: cls.hp + Math.floor((char.abilities.constitution - 10) / 2)
			}
		}));
	}

	function handleConfirmClassChange() {
		if (pendingClassChange) {
			// Reset all class-related data first
			character.resetClassData();

			// Clear local state variables
			selectedClassArchetype = null;
			classFeatureChoiceSelections = {};
			availableClassArchetypes = [];

			// Then apply the new class
			applyClassSelection(pendingClassChange);
		}

		// Close modal and clear pending
		showClassChangeModal = false;
		pendingClassChange = null;
	}

	function handleCancelClassChange() {
		showClassChangeModal = false;
		pendingClassChange = null;
	}

	function handleKeyAbilitySelect(ability: string) {
		selectedKeyAbility = ability;

		// Update character store
		character.update((char) => ({
			...char,
			class: {
				...char.class,
				keyAbility: ability
			}
		}));
	}

	// Check if key ability needs to be selected
	const needsKeyAbilitySelection = $derived.by(() => {
		if (!selectedClass) return false;
		return selectedClass.keyAbility.length > 1;
	});

	// Check if class gets a feat at level 1
	const getsClassFeatAtLevel1 = $derived.by(() => {
		if (!selectedClass) return false;
		return selectedClass.featSlots.class.includes(1);
	});

	function handleFreeBoostsChange(boosts: (string | null)[]) {
		freeAbilityBoosts = boosts;

		// Update character store with free boost selections
		character.update((char) => ({
			...char,
			ruleSelections: {
				...char.ruleSelections,
				'free-boost-0': boosts[0] || '',
				'free-boost-1': boosts[1] || '',
				'free-boost-2': boosts[2] || '',
				'free-boost-3': boosts[3] || ''
			}
		}));
	}

	function handleTrainedSkillsChange(skills: string[]) {
		trainedSkills = skills;

		// Update character store with skill proficiencies
		character.update((char) => {
			// Create updated skills object with trained proficiencies
			const updatedSkills = { ...char.skills };

			// Reset all skills to untrained first
			Object.keys(updatedSkills).forEach(key => {
				updatedSkills[key] = 0;
			});

			// Set selected skills to trained (rank 1)
			skills.forEach(skill => {
				const skillKey = skill.toLowerCase();
				updatedSkills[skillKey] = 1;
			});

			return {
				...char,
				skills: updatedSkills,
				ruleSelections: {
					...char.ruleSelections,
					'trained-skills': skills.join(',')
				}
			};
		});
	}

	function handleResetAll() {
		// Confirm before resetting
		const confirmed = confirm(
			'Are you sure you want to reset all character creation choices? This action cannot be undone.'
		);

		if (!confirmed) return;

		// Reset all local state
		selectedAncestry = null;
		selectedHeritage = null;
		selectedBackground = null;
		selectedClass = null;
		ancestryAbilityBoosts = [];
		backgroundAbilityBoosts = [null, null];
		selectedKeyAbility = null;
		freeAbilityBoosts = [null, null, null, null];
		trainedSkills = [];
		heritageChoices = {};

		// Reset character store to default state
		character.update((char) => ({
			...char,
			name: '',
			level: 1,
			ancestry: {
				id: '',
				name: '',
				heritage: null
			},
			background: {
				id: '',
				name: ''
			},
			class: {
				id: '',
				name: '',
				subclass: null,
				keyAbility: null,
				classArchetype: null
			},
			ruleSelections: {},
			feats: {
				ancestry: [],
				class: [],
				general: [],
				skill: []
			}
		}));

		// Reset the hasRestoredData flag so restoration doesn't interfere
		hasRestoredData = false;
	}

	// Calculate final ability scores for skill modifier calculations
	const calculatedAbilityScores = $derived.by(() => {
		const BASE_SCORE = 10;
		const ABILITIES = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];

		const scores: Record<string, number> = {};

		for (const ability of ABILITIES) {
			let score = BASE_SCORE;

			// Apply ancestry boosts
			if (selectedAncestry && selectedAncestry.boosts) {
				// Apply fixed boosts (single option)
				for (const boost of selectedAncestry.boosts) {
					if (!boost.free && boost.options.length === 1) {
						// Fixed boost to a specific ability
						const boostAbility = boost.options[0].toLowerCase();
						const normalizedAbility = ability.toLowerCase();
						if (
							boostAbility === normalizedAbility ||
							boostAbility === normalizedAbility.substring(0, 3)
						) {
							score += 2;
						}
					}
				}

				// Apply selected free/choice boosts
				const ancestryBoosts = ancestryAbilityBoosts.filter((b) => b === ability).length;
				score += ancestryBoosts * 2;
			}

			// Apply ancestry flaws
			if (selectedAncestry && selectedAncestry.flaws) {
				for (const flaw of selectedAncestry.flaws) {
					// Flaws are typically fixed to one ability
					const flawAbility = flaw.options[0].toLowerCase();
					const normalizedAbility = ability.toLowerCase();
					if (
						flawAbility === normalizedAbility ||
						flawAbility === normalizedAbility.substring(0, 3)
					) {
						score -= 2;
					}
				}
			}

			// Apply background boosts
			const bgBoosts = backgroundAbilityBoosts.filter((b) => b === ability).length;
			score += bgBoosts * 2;

			// Apply class key ability boost
			if (selectedKeyAbility === ability) {
				score += 2;
			}

			// Apply free boosts
			const freeBoosts = freeAbilityBoosts.filter((b) => b === ability).length;
			score += freeBoosts * 2;

			scores[ability] = score;
		}

		return scores;
	});

	// Update character abilities whenever calculated scores change
	$effect(() => {
		const scores = calculatedAbilityScores;

		// Update the character store with calculated ability scores
		// Use untrack to prevent the store update from re-triggering this effect
		untrack(() => {
			character.update((char) => {
				// Check if abilities actually changed to avoid unnecessary updates
				const newStr = scores['Strength'] || 10;
				const newDex = scores['Dexterity'] || 10;
				const newCon = scores['Constitution'] || 10;
				const newInt = scores['Intelligence'] || 10;
				const newWis = scores['Wisdom'] || 10;
				const newCha = scores['Charisma'] || 10;

				if (
					char.abilities.strength === newStr &&
					char.abilities.dexterity === newDex &&
					char.abilities.constitution === newCon &&
					char.abilities.intelligence === newInt &&
					char.abilities.wisdom === newWis &&
					char.abilities.charisma === newCha
				) {
					return char; // No change needed
				}

				return {
					...char,
					abilities: {
						strength: newStr,
						dexterity: newDex,
						constitution: newCon,
						intelligence: newInt,
						wisdom: newWis,
						charisma: newCha
					}
				};
			});
		});
	});

	// Derive heritage skills from heritage choices
	const heritageSkills = $derived.by(() => {
		const skills: string[] = [];

		// Check if heritage has skill choices and if they're selected
		if (selectedHeritage && selectedHeritage.benefits.choices.length > 0) {
			for (const choice of selectedHeritage.benefits.choices) {
				if (choice.config === 'skills' && choice.flag) {
					const selectedSkill = heritageChoices[choice.flag];
					if (selectedSkill) {
						// Capitalize the skill name to match the expected format
						const capitalizedSkill = selectedSkill.charAt(0).toUpperCase() + selectedSkill.slice(1);
						skills.push(capitalizedSkill);
					}
				}
			}
		}

		return skills;
	});

	// Helper to get readable label from prompt (handles Foundry localization keys)
	function getChoicePromptLabel(prompt: string, config?: string, itemType?: string): string {
		// If it's a Foundry localization key (starts with PF2E.), provide fallback
		if (prompt && prompt.startsWith('PF2E.')) {
			if (config === 'skills') {
				return 'Choose a Skill';
			}
			if (itemType === 'feat') {
				return 'Choose a Feat';
			}
			// Add more config-specific fallbacks as needed
			return 'Make a Choice';
		}
		return prompt || 'Make a Choice';
	}

	// Filter feats based on heritage choice criteria
	// Optimized to use pre-filtered feat arrays from context
	function filterFeatsForChoice(filter: string[]): Feat[] {
		if (!filter || filter.length === 0) return builderData.feats;

		// Determine which pre-filtered array to start with based on category filter
		let baseFeats = builderData.feats;
		let categoryFilter: string | null = null;

		// Extract category filter first to use cached arrays
		for (const condition of filter) {
			if (condition.startsWith('item:category:')) {
				categoryFilter = condition.replace('item:category:', '');
				break;
			}
		}

		// Use pre-filtered arrays for better performance
		if (categoryFilter === 'general') {
			baseFeats = builderData.getGeneralFeats();
		} else if (categoryFilter === 'class') {
			baseFeats = builderData.getClassFeats();
		} else if (categoryFilter === 'ancestry') {
			baseFeats = builderData.getAncestryFeats();
		} else if (categoryFilter === 'skill') {
			baseFeats = builderData.getSkillFeats();
		}

		// Apply remaining filters
		return baseFeats.filter((feat) => {
			for (const condition of filter) {
				// Skip category filter as we already applied it
				if (condition.startsWith('item:category:')) continue;

				// Parse filter format: "item:property:value"
				if (condition.startsWith('item:trait:')) {
					const traitValue = condition.replace('item:trait:', '');
					if (!feat.traits.includes(traitValue)) return false;
				} else if (condition.startsWith('item:level:')) {
					const levelValue = parseInt(condition.replace('item:level:', ''), 10);
					if (feat.level > levelValue) return false;
				}
			}
			return true;
		});
	}
</script>

<svelte:head>
	<title>General - Character Builder</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<div class="header-content">
			<div class="header-text">
				<h1 class="page-title">General Information</h1>
				<p class="page-description">
					Set your character's name, ancestry, background, and class.
				</p>
			</div>
			<button
				type="button"
				class="reset-button"
				onclick={handleResetAll}
				aria-label="Reset all character creation choices"
				title="Reset all choices"
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M3 12C3 7.02944 7.02944 3 12 3C14.3887 3 16.5656 3.92064 18.2072 5.42551M21 12C21 16.9706 16.9706 21 12 21C9.61133 21 7.43436 20.0794 5.79282 18.5745"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
					<path
						d="M3 7V12H8M21 17V12H16"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<span class="reset-text">Reset All</span>
			</button>
		</div>
	</header>

	<div class="content-sections">
		<section class="content-section" aria-labelledby="character-basics">
			<h2 id="character-basics" class="section-title">Character Basics</h2>
			<div class="section-body">
				<div class="form-field">
					<label for="character-name" class="field-label">Character Name</label>
					<input
						id="character-name"
						type="text"
						bind:value={$character.name}
						placeholder="Enter character name"
						class="text-input"
					/>
				</div>

				<div class="form-field">
					<label for="character-level" class="field-label">Level</label>
					<input
						id="character-level"
						type="number"
						bind:value={$character.level}
						min="1"
						max="20"
						class="number-input"
					/>
				</div>
			</div>
		</section>

		<section class="content-section" aria-labelledby="ancestry-selection">
			<h2 id="ancestry-selection" class="section-title">Ancestry</h2>
			<div class="section-body">
				{#if builderData.criticalDataLoading}
					<p class="loading-text">Loading ancestries...</p>
				{:else if builderData.ancestries.length > 0}
					<AncestrySelector
						ancestries={builderData.ancestries}
						selectedAncestry={selectedAncestry}
						onSelect={handleAncestrySelect}
					/>

					{#if selectedAncestry}
						{@const freeBoosts = selectedAncestry.boosts.filter((b) => b.free || b.options.length > 1)}
						{#if freeBoosts.length > 0}
							<div class="subsection">
								<h3 class="subsection-title">Ability Boosts</h3>
								<p class="subsection-description">
									Choose your ability boosts from your ancestry. Some ancestries provide specific
									ability boosts, while others let you choose freely.
								</p>

								<div class="ability-boost-grid">
									{#each freeBoosts as boost, index}
									{@const availableAbilities = getAvailableAbilities({ ...boost, index })}
									{#if availableAbilities.length > 0}
										<AbilityBoostSelector
											label="Boost {index + 1}"
											description={availableAbilities.length === 1
												? 'This boost is predetermined by your ancestry'
												: 'Choose any ability score to boost'}
											{availableAbilities}
											selectedAbility={ancestryAbilityBoosts[index]}
											onSelect={(ability) => handleAncestryAbilityBoost(index, ability)}
											required={true}
										/>
									{/if}
									{/each}
								</div>
							</div>
						{/if}

						<div class="subsection">
							{#if builderData.heritagesLoading}
								<div class="loading-container">
									<p class="loading-text">Loading heritages...</p>
									<p class="loading-subtext">This will only take a moment</p>
								</div>
							{:else}
								<HeritageSelector
									heritages={availableHeritages}
									selectedHeritage={selectedHeritage}
									onSelect={handleHeritageSelect}
								/>
							{/if}
						</div>

						{#if selectedHeritage && selectedHeritage.benefits.choices.length > 0}
							<div class="subsection">
								<h3 class="subsection-title">Heritage Choices</h3>
								<p class="subsection-description">
									Your heritage grants you special choices. Make your selections below.
								</p>
								{#each selectedHeritage.benefits.choices as choice, index}
									{#if choice.config === 'skills' && choice.flag}
										<div class="heritage-choice">
											<label for="heritage-skill-{choice.flag}" class="choice-label">
												{getChoicePromptLabel(choice.prompt, choice.config)}:
											</label>
											<select
												id="heritage-skill-{choice.flag}"
												class="choice-select"
												value={heritageChoices[choice.flag] || ''}
												onchange={(e) => handleHeritageChoiceSelect(choice.flag!, e.currentTarget.value)}
											>
												<option value="">-- Select a skill --</option>
												{#each choice.choices as skillChoice}
													<option value={skillChoice.value}>
														{skillChoice.label}
													</option>
												{/each}
											</select>
										</div>
									{:else if choice.itemType === 'feat' && choice.flag}
										<div class="heritage-choice">
											<label for="heritage-feat-{choice.flag}" class="choice-label">
												{getChoicePromptLabel(choice.prompt, choice.config, choice.itemType)}:
											</label>
											{#if builderData.featsLoading}
												<select id="heritage-feat-{choice.flag}" class="choice-select" disabled>
													<option value="">Loading feats...</option>
												</select>
											{:else}
												{@const availableFeats = filterFeatsForChoice(choice.filter || [])}
												<select
													id="heritage-feat-{choice.flag}"
													class="choice-select"
													value={heritageChoices[choice.flag] || ''}
													onchange={(e) => handleHeritageChoiceSelect(choice.flag!, e.currentTarget.value)}
												>
													<option value="">-- Select a feat --</option>
													{#each availableFeats as feat}
														<option value="Compendium.pf2e.feats-srd.Item.{feat.id}">
															{feat.name}
															{#if feat.level > 0}(Level {feat.level}){/if}
														</option>
													{/each}
												</select>
											{/if}
										</div>
									{:else}
										<!-- Other choice types can be added here in the future -->
										<div class="heritage-choice">
											<label for="heritage-choice-{index}" class="choice-label">
												{getChoicePromptLabel(choice.prompt, choice.config, choice.itemType)}:
											</label>
											<select
												id="heritage-choice-{index}"
												class="choice-select"
												value={heritageChoices[choice.flag || `choice-${index}`] || ''}
												onchange={(e) => handleHeritageChoiceSelect(choice.flag || `choice-${index}`, e.currentTarget.value)}
											>
												<option value="">-- Select an option --</option>
												{#each choice.choices as optionChoice}
													<option value={optionChoice.value}>
														{optionChoice.label}
													</option>
												{/each}
											</select>
										</div>
									{/if}
								{/each}
							</div>
						{/if}

						{#if selectedHeritage}
							<div class="subsection">
								<h3 class="subsection-title">Ancestry Feat</h3>
								<p class="subsection-description">
									Choose an ancestry feat. This represents special training or abilities from your
									heritage.
								</p>
								{#if builderData.featsLoading}
									<div class="loading-container">
										<p class="loading-text">Loading feats...</p>
										<p class="loading-subtext">Ancestry and class feats are loading in the background</p>
									</div>
								{:else}
									<div class="feat-picker-container">
										<FeatPicker
											feats={ancestryFeats}
											selectedFeatId={$character.feats.ancestry[0]?.featId}
											characterLevel={$character.level}
											characterData={{
												abilityScores: $character.abilities,
												skills: {
													trained: Object.keys($character.skills).filter(k => $character.skills[k] >= 1),
													expert: Object.keys($character.skills).filter(k => $character.skills[k] >= 2),
													master: Object.keys($character.skills).filter(k => $character.skills[k] >= 3),
													legendary: Object.keys($character.skills).filter(k => $character.skills[k] >= 4)
												},
												feats: [
													...$character.feats.ancestry.map(f => f.name),
													...$character.feats.class.map(f => f.name),
													...$character.feats.skill.map(f => f.name),
													...$character.feats.general.map(f => f.name)
												],
												class: $character.class.name ? { name: $character.class.name } : undefined,
												ancestry: $character.ancestry.name ? { name: $character.ancestry.name } : undefined,
												classFeatures: $character.classFeatures
											}}
											filterCategory="ancestry"
											filterLevel={1}
											onSelect={handleAncestryFeatSelect}
										/>
									</div>
								{/if}
							</div>
						{/if}
					{/if}
				{:else}
					<p class="error-text">Failed to load ancestries. Please try again.</p>
				{/if}
			</div>
		</section>

		<section class="content-section" aria-labelledby="background-selection">
			<h2 id="background-selection" class="section-title">Background</h2>
			<div class="section-body">
				{#if builderData.criticalDataLoading}
					<p class="loading-text">Loading backgrounds...</p>
				{:else if builderData.backgrounds.length > 0}
					<BackgroundSelector
						backgrounds={builderData.backgrounds}
						{selectedBackground}
						onSelect={handleBackgroundSelect}
					/>

					{#if selectedBackground}
						<div class="subsection">
							<h3 class="subsection-title">Ability Boosts</h3>
							<p class="subsection-description">
								Choose your ability boosts from your background. Some backgrounds provide specific
								ability boosts, while others let you choose freely.
							</p>

							{#if selectedBackground.boosts && selectedBackground.boosts.length > 0}
								<div class="ability-boost-grid">
									{#each selectedBackground.boosts as boost, index}
									{@const availableAbilities = getAvailableAbilities(boost)}
									{#if availableAbilities.length > 0}
										<AbilityBoostSelector
											label="Boost {index + 1}"
											description={availableAbilities.length === 1
												? 'This boost is predetermined by your background'
												: 'Choose any ability score to boost'}
											{availableAbilities}
											selectedAbility={backgroundAbilityBoosts[index]}
											onSelect={(ability) => handleBackgroundAbilityBoost(index, ability)}
											required={true}
										/>
									{/if}
								{/each}
							</div>
						{/if}
						</div>
					{/if}
				{:else}
					<p class="error-text">Failed to load backgrounds. Please try again.</p>
				{/if}
			</div>
		</section>

		<section class="content-section" aria-labelledby="class-selection">
			<h2 id="class-selection" class="section-title">Class</h2>
			<div class="section-body">
				{#if builderData.criticalDataLoading}
					<p class="loading-text">Loading classes...</p>
				{:else if builderData.classes.length > 0}
					<ClassSelector classes={builderData.classes} {selectedClass} onSelect={handleClassSelect} />

					{#if selectedClass}
						<!-- Class Archetype Selector -->
						{#if availableClassArchetypes.length > 0}
							<div class="subsection class-archetype-section">
								<h3 class="subsection-title">Class Archetype (Optional)</h3>
								<p class="subsection-description">
									Class archetypes are special variants of your class that modify your features at level 1.
									They replace some base class features and grant unique abilities.
								</p>

								{#if selectedClassArchetype}
									<div class="selected-archetype">
										<div class="archetype-info">
											<h4 class="archetype-name">{selectedClassArchetype.name}</h4>
											<div class="archetype-description-card" class:expanded={archetypeDescriptionExpanded}>
												<div class="archetype-description-content">
													<RichDescription content={selectedClassArchetype.description} />
												</div>
												{#if !archetypeDescriptionExpanded}
													<button class="read-more-button" onclick={() => archetypeDescriptionExpanded = true}>
														Read more
													</button>
												{:else}
													<button class="read-more-button" onclick={() => archetypeDescriptionExpanded = false}>
														Show less
													</button>
												{/if}
											</div>
											{#if selectedClassArchetype.suppressedFeatures.length > 0}
												<div class="suppressed-features">
													<strong>Replaces:</strong>
													{selectedClassArchetype.suppressedFeatures.join(', ')}
												</div>
											{/if}
										</div>
										<Button variant="secondary" size="sm" onclick={handleClassArchetypeClear}>
											Remove Archetype
										</Button>
									</div>
								{:else}
									<div class="archetype-grid">
										{#each availableClassArchetypes as archetype}
											<div class="archetype-card">
												<h4 class="archetype-card-name">{archetype.name}</h4>
												{#if archetype.rarity && archetype.rarity !== 'common'}
													<span class="archetype-rarity rarity-{archetype.rarity}">{archetype.rarity}</span>
												{/if}
												<div class="archetype-card-description">
													{getExcerpt(archetype.description, 200)}
												</div>
												<div class="archetype-card-actions">
													<Button variant="secondary" size="sm" onclick={() => viewArchetypeDetails(archetype)}>
														Details
													</Button>
													<Button variant="primary" size="sm" onclick={() => handleClassArchetypeSelect(archetype)}>
														Select
													</Button>
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/if}

						<!-- Class Feature Choices (e.g., Barbarian Instinct, Alchemist Research Field) -->
						{#if Object.keys(filteredClassFeatureChoiceInfo).length > 0}
							<div class="subsection">
								<h3 class="subsection-title">Class Features</h3>
								<p class="subsection-description">
									Your class grants you special features that require choices.
								</p>
								{#each Object.entries(filteredClassFeatureChoiceInfo) as [choiceFlag, choiceInfo]}
									{@const isAutoGranted = isAutoGrantedFeature(choiceFlag)}
									<div class="class-feature-choice">
										<label for="class-choice-{choiceFlag}" class="choice-label">
											{choiceInfo.choices.length > 0 ? `Choose your ${formatChoiceLabel(choiceFlag)}` : 'Class Feature'}:
											{#if isAutoGranted}
												<span class="auto-granted-badge">Auto-selected by archetype</span>
											{/if}
										</label>
										<select
											id="class-choice-{choiceFlag}"
											class="choice-select"
											value={classFeatureChoiceSelections[choiceFlag] || ''}
											onchange={(e) => handleClassFeatureChoiceSelection(choiceFlag, e.currentTarget.value)}
											disabled={isAutoGranted}
										>
											<option value="">-- Select an option --</option>
											{#each choiceInfo.choices as choice}
												<option value={choice.value}>
													{choice.label}
												</option>
											{/each}
										</select>
									</div>
								{/each}
							</div>
						{/if}

						{#if needsKeyAbilitySelection}
							<div class="subsection">
								<h3 class="subsection-title">Key Ability</h3>
								<p class="subsection-description">
									Choose your key ability. At 1st level, your class gives you an ability boost to
									your chosen key ability.
								</p>

								<AbilityBoostSelector
									label="Select Key Ability"
									description="This determines which ability score receives your class boost"
									availableAbilities={selectedClass.keyAbility}
									selectedAbility={selectedKeyAbility}
									onSelect={handleKeyAbilitySelect}
									required={true}
								/>
							</div>
						{/if}

						{#if getsClassFeatAtLevel1 && (selectedKeyAbility || !needsKeyAbilitySelection)}
							<div class="subsection">
								<h3 class="subsection-title">Class Feat</h3>
								<p class="subsection-description">
									Choose a class feat. This represents specialized training in your class.
								</p>
								{#if builderData.featsLoading}
									<div class="loading-container">
										<p class="loading-text">Loading feats...</p>
										<p class="loading-subtext">Ancestry and class feats are loading in the background</p>
									</div>
								{:else}
									<div class="feat-picker-container">
										<FeatPicker
											feats={classFeats}
											selectedFeatId={$character.feats.class[0]?.featId}
											characterLevel={$character.level}
											characterData={{
												abilityScores: $character.abilities,
												skills: {
													trained: Object.keys($character.skills).filter(k => $character.skills[k] >= 1),
													expert: Object.keys($character.skills).filter(k => $character.skills[k] >= 2),
													master: Object.keys($character.skills).filter(k => $character.skills[k] >= 3),
													legendary: Object.keys($character.skills).filter(k => $character.skills[k] >= 4)
												},
												feats: [
													...$character.feats.ancestry.map(f => f.name),
													...$character.feats.class.map(f => f.name),
													...$character.feats.skill.map(f => f.name),
													...$character.feats.general.map(f => f.name)
												],
												class: $character.class.name ? { name: $character.class.name } : undefined,
												ancestry: $character.ancestry.name ? { name: $character.ancestry.name } : undefined,
												classFeatures: $character.classFeatures
											}}
											filterCategory="class"
											filterLevel={1}
											onSelect={handleClassFeatSelect}
										/>
									</div>
								{/if}
							</div>
						{/if}
					{/if}
				{:else}
					<p class="error-text">Failed to load classes. Please try again.</p>
				{/if}
			</div>
		</section>

		<section class="content-section" aria-labelledby="ability-scores">
			<h2 id="ability-scores" class="section-title">Ability Scores</h2>
			<div class="section-body">
				<AbilityScoreManager
					ancestry={selectedAncestry}
					background={selectedBackground}
					selectedClass={selectedClass}
					keyAbility={selectedKeyAbility}
					ancestryBoosts={ancestryAbilityBoosts}
					backgroundBoosts={backgroundAbilityBoosts}
					freeBoosts={freeAbilityBoosts}
					onFreeBoostsChange={handleFreeBoostsChange}
				/>
			</div>
		</section>

		<section class="content-section" aria-labelledby="skills">
			<h2 id="skills" class="section-title">Skills</h2>
			<div class="section-body">
				<SkillSelector
					background={selectedBackground}
					selectedClass={selectedClass}
					level={$character.level}
					abilityScores={calculatedAbilityScores}
					{trainedSkills}
					{heritageSkills}
					onTrainedSkillsChange={handleTrainedSkillsChange}
				/>
			</div>
		</section>
	</div>
</div>

<!-- Class Change Confirmation Modal -->
<Modal open={showClassChangeModal} onClose={handleCancelClassChange} title="⚠️ Change Class?">
	<div class="class-change-modal-content">
		<p class="warning-text">
			Changing your class from <strong>{selectedClass?.name}</strong> to <strong>{pendingClassChange?.name}</strong> will <strong>permanently reset</strong> the following to baseline:
		</p>
		<ul class="reset-list">
			<li><strong>Class archetype</strong> (if selected)</li>
			<li><strong>Subclass</strong> and <strong>key ability</strong></li>
			<li><strong>All class feats</strong> (level 1+)</li>
			<li><strong>All class features</strong> (e.g., Hybrid Study, Arcane School, Barbarian Instinct, etc.)</li>
			<li><strong>All spellcasting data</strong> (known spells, prepared spells, cantrips, spell slots, focus points)</li>
			<li><strong>All trained skill selections</strong></li>
		</ul>
		<p class="preserve-text">
			<strong>Will NOT be reset:</strong> Ancestry, Background, Heritage, Ancestry/Skill/General Feats, Equipment, Wealth
		</p>
		<p class="confirm-text">
			<strong>This cannot be undone.</strong> Are you sure you want to continue?
		</p>
	</div>

	{#snippet footer()}
		<div class="modal-actions">
			<Button variant="secondary" onclick={handleCancelClassChange}>Cancel</Button>
			<Button variant="primary" onclick={handleConfirmClassChange}>Change Class</Button>
		</div>
	{/snippet}
</Modal>

<!-- Class Archetype Details Modal -->
{#if archetypeForDetails}
	<Modal bind:open={archetypeDetailModalOpen} onClose={closeArchetypeDetails} title={archetypeForDetails.name} size="lg">
		<div class="archetype-detail">
			<!-- Rarity Badge -->
			{#if archetypeForDetails.rarity && archetypeForDetails.rarity !== 'common'}
				<div class="archetype-detail-header">
					<span class="archetype-rarity rarity-{archetypeForDetails.rarity}">{archetypeForDetails.rarity}</span>
					{#if archetypeForDetails.isUniversal}
						<span class="universal-badge">Universal (Any Spellcaster)</span>
					{:else if archetypeForDetails.baseClass}
						<span class="base-class-badge">{archetypeForDetails.baseClass} Archetype</span>
					{/if}
				</div>
			{/if}

			<!-- Description -->
			<div class="detail-section">
				<h4>Description</h4>
				<RichDescription content={archetypeForDetails.description} />
			</div>

			<!-- Suppressed Features -->
			{#if archetypeForDetails.suppressedFeatures.length > 0}
				<div class="detail-section">
					<h4>Replaces Base Class Features</h4>
					<div class="suppressed-features-detail">
						<p class="warning-note">This archetype replaces the following base class features:</p>
						<ul class="suppressed-list">
							{#each archetypeForDetails.suppressedFeatures as feature}
								<li>{feature}</li>
							{/each}
						</ul>
					</div>
				</div>
			{/if}

			<!-- Traits -->
			{#if archetypeForDetails.traits && archetypeForDetails.traits.length > 0}
				<div class="detail-section">
					<h4>Traits</h4>
					<div class="trait-list">
						{#each archetypeForDetails.traits as trait}
							<span class="trait-badge">{trait}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Source -->
			<div class="detail-section">
				<h4>Source</h4>
				<p>
					{archetypeForDetails.source.title}
					{#if archetypeForDetails.source.remaster}
						<span class="remaster-badge">Remaster</span>
					{/if}
				</p>
			</div>
		</div>

		{#snippet footer()}
			<Button variant="secondary" onclick={closeArchetypeDetails}>Close</Button>
			{#if !selectedClassArchetype && archetypeForDetails}
				<Button variant="primary" onclick={() => {
					if (archetypeForDetails) {
						handleClassArchetypeSelect(archetypeForDetails);
						closeArchetypeDetails();
					}
				}}>
					Select {archetypeForDetails.name}
				</Button>
			{/if}
		{/snippet}
	</Modal>
{/if}

<style>
	.page-content {
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.header-content {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1.5rem;
	}

	.header-text {
		flex: 1;
	}

	.page-title {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		color: var(--text-primary, #1a1a1a);
	}

	.page-description {
		font-size: 1.125rem;
		margin: 0;
		color: var(--text-secondary, #666666);
	}

	.reset-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		cursor: pointer;
		transition: all var(--transition-fast);
		white-space: nowrap;
	}

	.reset-button:hover {
		background-color: #f03e3e;
		border-color: #f03e3e;
		color: white;
	}

	.reset-button:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	.reset-button:active {
		transform: scale(0.98);
	}

	.reset-button svg {
		flex-shrink: 0;
	}

	.content-sections {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.content-section {
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		color: var(--text-primary, #1a1a1a);
	}

	.section-body {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Form fields */
	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.field-label {
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		font-size: 0.9375rem;
	}

	.text-input,
	.number-input {
		padding: 0.75rem 1rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-size: 1rem;
		font-family: inherit;
		background-color: var(--surface-1, #ffffff);
		color: var(--text-primary, #1a1a1a);
	}

	.text-input:focus,
	.number-input:focus {
		outline: none;
		border-color: var(--focus-color, #5c7cfa);
	}

	.number-input {
		width: 120px;
	}

	/* Subsections */
	.subsection {
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}

	.subsection-title {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.subsection-description {
		margin: 0 0 1rem 0;
		color: var(--text-secondary, #666666);
		line-height: 1.6;
	}

	.feat-picker-container {
		background-color: var(--surface-1, #ffffff);
		border-radius: 8px;
		padding: 1rem;
	}

	.ability-boost-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.heritage-choice,
	.class-feature-choice {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.auto-granted-badge {
		display: inline-block;
		margin-left: 0.5rem;
		padding: 0.25rem 0.5rem;
		background-color: rgba(92, 124, 250, 0.1);
		color: var(--link-color, #5c7cfa);
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.choice-select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background-color: var(--surface-2, #f5f5f5);
	}

	.choice-label {
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		font-size: 0.9375rem;
	}

	.choice-select {
		padding: 0.75rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		background-color: var(--surface-1, #ffffff);
		color: var(--text-primary, #1a1a1a);
		font-size: 1rem;
		font-family: inherit;
		cursor: pointer;
		transition: border-color var(--transition-fast);
	}

	.choice-select:hover {
		border-color: var(--link-color, #5c7cfa);
	}

	.choice-select:focus {
		outline: none;
		border-color: var(--link-color, #5c7cfa);
		box-shadow: 0 0 0 3px rgba(92, 124, 250, 0.1);
	}

	.choice-select:disabled {
		background-color: var(--surface-2, #f5f5f5);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.loading-container {
		background-color: var(--surface-1, #ffffff);
		border-radius: 8px;
		padding: 2rem;
		text-align: center;
		position: relative;
	}

	.loading-container::before {
		content: '';
		display: inline-block;
		width: 24px;
		height: 24px;
		margin-bottom: 1rem;
		border: 3px solid var(--border-color, #e0e0e0);
		border-top-color: var(--link-color, #5c7cfa);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* States */
	.loading-text,
	.error-text {
		margin: 0;
		padding: 2rem;
		text-align: center;
		font-style: italic;
	}

	.loading-text {
		color: var(--text-secondary, #666666);
	}

	.loading-subtext {
		margin: 0.5rem 0 0 0;
		padding: 0;
		color: var(--text-tertiary, #999999);
		font-size: 0.875rem;
		font-style: normal;
	}

	.error-text {
		color: #f03e3e;
	}

	@media (max-width: 768px) {
		.page-title {
			font-size: 1.75rem;
		}

		.page-description {
			font-size: 1rem;
		}

		.section-title {
			font-size: 1.25rem;
		}

		.content-section {
			padding: 1.25rem;
		}

		.header-content {
			flex-direction: column;
			align-items: stretch;
		}

		.reset-button {
			justify-content: center;
		}

		.reset-text {
			display: inline;
		}
	}

	@media (max-width: 480px) {
		.reset-text {
			display: none;
		}

		.reset-button {
			width: 48px;
			padding: 0.75rem;
			justify-content: center;
			align-self: flex-end;
		}

		.header-content {
			flex-direction: row;
			align-items: flex-start;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.reset-button {
			transition: none;
		}

		.reset-button:active {
			transform: none;
		}
	}

	/* Class Change Modal */
	.class-change-modal-content {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.warning-text {
		margin: 0;
		padding: 1rem;
		background-color: rgba(250, 82, 82, 0.1);
		border-left: 4px solid var(--danger-color, #fa5252);
		border-radius: 4px;
		color: var(--text-primary, #1a1a1a);
		line-height: 1.6;
		font-size: 1rem;
	}

	.reset-list {
		margin: 0;
		padding-left: 1.5rem;
		color: var(--text-primary, #1a1a1a);
		background-color: var(--surface-2, #f8f9fa);
		padding: 1rem 1.5rem;
		border-radius: 4px;
	}

	.reset-list li {
		margin-bottom: 0.5rem;
		line-height: 1.5;
	}

	.preserve-text {
		margin: 0;
		padding: 0.75rem;
		background-color: rgba(55, 178, 77, 0.1);
		border-left: 4px solid var(--success-color, #37b24d);
		border-radius: 4px;
		color: var(--text-primary, #1a1a1a);
		line-height: 1.6;
		font-size: 0.9375rem;
	}

	.confirm-text {
		margin: 0;
		padding: 0.75rem;
		font-weight: 600;
		color: var(--danger-color, #fa5252);
		background-color: rgba(250, 82, 82, 0.05);
		border-radius: 4px;
		text-align: center;
		font-size: 1rem;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	/* Class Archetype Styles */
	.class-archetype-section {
		padding: 1.5rem;
		background-color: rgba(92, 124, 250, 0.05);
		border-left: 4px solid var(--link-color, #5c7cfa);
		border-radius: 8px;
	}

	.selected-archetype {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background-color: var(--surface-1, #ffffff);
		border: 2px solid var(--link-color, #5c7cfa);
		border-radius: 8px;
	}

	.archetype-info {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.archetype-name {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--link-color, #5c7cfa);
	}

	.archetype-description-card {
		position: relative;
		margin: 0.75rem 0;
		padding: 1rem;
		background-color: var(--surface-1, #ffffff);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
	}

	.archetype-description-content {
		max-height: 4.8em; /* ~3 lines at 1.6 line-height */
		overflow: hidden;
		line-height: 1.6;
		color: var(--text-primary, #1a1a1a);
		position: relative;
		transition: max-height var(--transition-normal);
	}

	.archetype-description-card:not(.expanded) .archetype-description-content::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2em;
		background: linear-gradient(to bottom, transparent, var(--surface-1, #ffffff));
	}

	.archetype-description-card.expanded .archetype-description-content {
		max-height: none;
	}

	.read-more-button {
		display: block;
		width: 100%;
		margin-top: 0.75rem;
		padding: 0.5rem;
		background: none;
		border: none;
		color: var(--link-color, #5c7cfa);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		text-align: center;
		transition: all var(--transition-fast);
	}

	.read-more-button:hover {
		color: var(--link-hover-color, #4c6ef5);
		text-decoration: underline;
	}

	.read-more-button:focus {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
		border-radius: 4px;
	}

	.suppressed-features {
		padding: 0.75rem;
		background-color: rgba(255, 193, 7, 0.1);
		border-left: 3px solid var(--warning-color, #ffc107);
		border-radius: 4px;
		font-size: 0.9375rem;
		color: var(--text-primary, #1a1a1a);
	}

	.archetype-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.archetype-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background-color: var(--surface-1, #ffffff);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		transition: all var(--transition-fast);
	}

	.archetype-card:hover {
		border-color: var(--link-color, #5c7cfa);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.archetype-card-name {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.archetype-rarity {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.rarity-uncommon {
		background-color: rgba(40, 167, 69, 0.2);
		color: var(--success-color, #28a745);
	}

	.rarity-rare {
		background-color: rgba(0, 123, 255, 0.2);
		color: #007bff;
	}

	.archetype-card-description {
		flex-grow: 1;
		font-size: 0.875rem;
		line-height: 1.6;
		color: var(--text-secondary, #666666);
	}

	.archetype-card-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: auto;
	}

	/* Archetype Detail Modal */
	.archetype-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.archetype-detail-header {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.universal-badge {
		padding: 0.375rem 0.75rem;
		background-color: rgba(92, 124, 250, 0.1);
		color: var(--link-color, #5c7cfa);
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.base-class-badge {
		padding: 0.375rem 0.75rem;
		background-color: var(--surface-2, #f5f5f5);
		color: var(--text-secondary, #666666);
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: capitalize;
	}

	.detail-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.detail-section h4 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		padding-bottom: 0.5rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.suppressed-features-detail {
		padding: 1rem;
		background-color: rgba(255, 193, 7, 0.1);
		border-left: 4px solid var(--warning-color, #ffc107);
		border-radius: 4px;
	}

	.warning-note {
		margin: 0 0 0.75rem 0;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.suppressed-list {
		margin: 0;
		padding-left: 1.5rem;
		color: var(--text-primary, #1a1a1a);
	}

	.suppressed-list li {
		margin-bottom: 0.25rem;
	}

	.trait-list {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.trait-badge {
		padding: 0.375rem 0.75rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
	}

	.remaster-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		background-color: var(--link-color, #5c7cfa);
		color: white;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		margin-left: 0.5rem;
	}

	/* Mobile Adjustments */
	@media (max-width: 768px) {
		.archetype-grid {
			grid-template-columns: 1fr;
		}

		.archetype-card-actions {
			flex-direction: column;
		}
	}
</style>
