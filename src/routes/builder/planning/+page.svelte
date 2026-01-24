<script lang="ts">
	/**
	 * Planning Tab - Performance Optimizations
	 *
	 * This page renders 20 level components with multiple feat dropdowns.
	 * To ensure fast tab switching and smooth interaction:
	 *
	 * 1. Memoized feat filtering: Pre-compute filtered feat lists for each level
	 *    instead of filtering 1500+ feats on every dropdown render
	 *
	 * 2. Lazy rendering: Only render level content when expanded (collapsed
	 *    levels don't render their dropdowns at all)
	 *
	 * 3. Minimal initial expansion: Start with only current level expanded
	 *    instead of current + 2 more levels
	 *
	 * Result: Fast initial load and instant level expansion
	 */

	import { character } from '$lib/stores/character';
	import { settings } from '$lib/stores/settings';
	import { getBuilderDataContext } from '$lib/contexts/builderDataContext.svelte';
	import type { Class, Feat } from '$lib/data/types/app';
	import { getLevelProgression, type LevelProgression } from '$lib/utils/featSlots';
	import { onMount } from 'svelte';
	import Accordion from '$lib/components/common/Accordion.svelte';
	import PlanningFeatSelector from '$lib/components/planning/PlanningFeatSelector.svelte';
	import RichDescription from '$lib/components/common/RichDescription.svelte';
	import { loadAllClassFeatures } from '$lib/data/repositories/classFeatureRepository';
	import { extractChoiceInfo, getCompleteChoiceInfo, type ClassFeatureChoiceInfo, resolveSpecializedClassFeature } from '$lib/utils/classFeatureChoices';
	import type { ClassFeature } from '$lib/data/types/app';

	// Get shared data from context (loaded once in layout)
	const builderData = getBuilderDataContext();

	// Character data from store
	let currentChar = $state($character);
	let currentSettings = $state($settings);

	// Subscribe to character and settings changes
	character.subscribe((char) => {
		currentChar = char;
	});

	settings.subscribe((value) => {
		currentSettings = value;
	});

	// Derived values from character
	const currentLevel = $derived(currentChar.level);
	const selectedClass = $derived.by(() => {
		if (currentChar.class && currentChar.class.id) {
			// Get the full class data from builderData
			return builderData.classes.find(c => c.id === currentChar.class.id) || null;
		}
		return null;
	});

	// Generate level progression dynamically based on variant rules
	const levelProgression = $derived.by(() => {
		const progression: LevelProgression[] = [];
		const classFeatures = selectedClass?.classFeatures || [];
		for (let level = 1; level <= 20; level++) {
			progression.push(getLevelProgression(level, currentSettings.variantRules, classFeatures));
		}
		return progression;
	});

	// Planning selections - stored per level
	let featSelections = $state<Record<number, { classFeat?: string; freeArchetypeFeat?: string; ancestryFeat?: string; skillFeat?: string; generalFeat?: string }>>({});
	let abilityBoostSelections = $state<Record<number, string[]>>({});
	let skillIncreaseSelections = $state<Record<number, string>>({});
	let classFeatureChoiceSelections = $state<Record<string, string>>({});  // Maps choiceFlag to selected value

	// All class features (for resolving tag-based choices)
	let allClassFeatures = $state<ClassFeature[]>([]);
	let classFeatureChoiceInfo = $state<Record<string, ClassFeatureChoiceInfo>>({});

	// Skills list - matches character store structure
	const SKILLS = [
		'Acrobatics', 'Arcana', 'Athletics', 'Crafting', 'Deception', 'Diplomacy',
		'Intimidation', 'Medicine', 'Nature', 'Occultism', 'Performance',
		'Religion', 'Society', 'Stealth', 'Survival', 'Thievery'
	];

	// Abilities list
	const ABILITIES = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];

	// Derived feat arrays from builderData (reactive to data loading)
	const classFeats = $derived(builderData.getClassFeats());
	const ancestryFeats = $derived(builderData.getAncestryFeats());
	const skillFeats = $derived(builderData.getSkillFeats());
	const generalFeats = $derived(builderData.getGeneralFeats());
	const archetypeFeats = $derived(builderData.getArchetypeFeats());

	// PERFORMANCE: Memoize filtered feat lists by level to avoid filtering 1500+ feats on every render
	// This pre-computes feat lists for each level once, instead of filtering on every dropdown render
	const featsByLevel = $derived.by(() => {
		const cache: Record<number, {
			class: typeof classFeats;
			ancestry: typeof ancestryFeats;
			skill: typeof skillFeats;
			general: typeof generalFeats;
			archetype: typeof archetypeFeats;
		}> = {};

		// Get the selected class's name as a lowercase trait for filtering
		const classTraitName = selectedClass?.name?.toLowerCase() || '';

		for (let level = 1; level <= 20; level++) {
			cache[level] = {
				// Filter class feats by BOTH level AND class trait
				// Class feats have the class name (e.g., 'fighter', 'wizard') as a trait
				class: classFeats.filter(f =>
					f.level <= level &&
					(classTraitName === '' || f.traits.some(t => t.toLowerCase() === classTraitName))
				),
				ancestry: ancestryFeats.filter(f => f.level <= level),
				skill: skillFeats.filter(f => f.level <= level),
				general: generalFeats.filter(f => f.level <= level),
				archetype: archetypeFeats.filter(f => f.level <= level)
			};
		}

		return cache;
	});

	// Load saved planning selections from character store on mount
	onMount(async () => {
		const char = $character;

		// Load all class features for resolving tag-based choices
		allClassFeatures = await loadAllClassFeatures();

		// Pre-populate with ACTUAL selected feats from character.feats
		// This shows what the user has already selected in the Feats tab
		if (char.feats) {
			// Load ancestry feats
			char.feats.ancestry.forEach((feat) => {
				if (!featSelections[feat.level]) {
					featSelections[feat.level] = {};
				}
				featSelections[feat.level].ancestryFeat = feat.featId;
			});

			// Load class feats
			char.feats.class.forEach((feat) => {
				if (!featSelections[feat.level]) {
					featSelections[feat.level] = {};
				}
				featSelections[feat.level].classFeat = feat.featId;
			});

			// Load skill feats
			char.feats.skill.forEach((feat) => {
				if (!featSelections[feat.level]) {
					featSelections[feat.level] = {};
				}
				featSelections[feat.level].skillFeat = feat.featId;
			});

			// Load general feats
			char.feats.general.forEach((feat) => {
				if (!featSelections[feat.level]) {
					featSelections[feat.level] = {};
				}
				featSelections[feat.level].generalFeat = feat.featId;
			});
		}

		// Also load saved PLANNING selections from ruleSelections (for future levels)
		if (char.ruleSelections) {
			// Parse feat selections
			for (let level = 1; level <= 20; level++) {
				const classFeat = char.ruleSelections[`plan-level-${level}-class-feat`];
				const ancestryFeat = char.ruleSelections[`plan-level-${level}-ancestry-feat`];
				const skillFeat = char.ruleSelections[`plan-level-${level}-skill-feat`];
				const generalFeat = char.ruleSelections[`plan-level-${level}-general-feat`];
				const freeArchetypeFeat = char.ruleSelections[`plan-level-${level}-free-archetype-feat`];

				// Only set from ruleSelections if not already set from actual feats
				if (!featSelections[level]) {
					featSelections[level] = {};
				}

				if (typeof classFeat === 'string' && !featSelections[level].classFeat) {
					featSelections[level].classFeat = classFeat;
				}
				if (typeof ancestryFeat === 'string' && !featSelections[level].ancestryFeat) {
					featSelections[level].ancestryFeat = ancestryFeat;
				}
				if (typeof skillFeat === 'string' && !featSelections[level].skillFeat) {
					featSelections[level].skillFeat = skillFeat;
				}
				if (typeof generalFeat === 'string' && !featSelections[level].generalFeat) {
					featSelections[level].generalFeat = generalFeat;
				}
				if (typeof freeArchetypeFeat === 'string') {
					featSelections[level].freeArchetypeFeat = freeArchetypeFeat;
				}

				// Parse ability boosts
				const boosts = char.ruleSelections[`plan-level-${level}-ability-boosts`];
				if (typeof boosts === 'string') {
					abilityBoostSelections[level] = boosts.split(',');
				}

				// Parse skill increases
				const skillIncrease = char.ruleSelections[`plan-level-${level}-skill-increase`];
				if (typeof skillIncrease === 'string') {
					skillIncreaseSelections[level] = skillIncrease;
				}
			}
		}

		// Load class feature choice selections
		if (char.ruleSelections) {
			// Extract all class feature choice selections
			// They are stored with the choiceFlag as the key
			Object.entries(char.ruleSelections).forEach(([key, value]) => {
				// Skip our planning selections
				if (!key.startsWith('plan-level-') && typeof value === 'string') {
					classFeatureChoiceSelections[key] = value;
				}
			});
		}

		// Process class features to build choice info map
		if (selectedClass) {
			for (const cf of selectedClass.classFeatures) {
				// Find the full class feature data
				const fullClassFeature = allClassFeatures.find(acf => acf.name === cf.name);
				if (fullClassFeature) {
					const choiceInfo = await getCompleteChoiceInfo(fullClassFeature, allClassFeatures);
					if (choiceInfo.hasChoice && choiceInfo.choiceFlag) {
						classFeatureChoiceInfo[choiceInfo.choiceFlag] = choiceInfo;
					}
				}
			}
		}
	});

	function handleFeatSelection(level: number, featType: 'classFeat' | 'freeArchetypeFeat' | 'ancestryFeat' | 'skillFeat' | 'generalFeat', featName: string) {
		if (!featSelections[level]) {
			featSelections[level] = {};
		}
		featSelections[level][featType] = featName;

		// Save to character store
		character.update((char) => ({
			...char,
			ruleSelections: {
				...char.ruleSelections,
				[`plan-level-${level}-${featType.replace(/([A-Z])/g, '-$1').toLowerCase()}`]: featName
			}
		}));
	}

	function handleAbilityBoostSelection(level: number, index: number, ability: string) {
		if (!abilityBoostSelections[level]) {
			abilityBoostSelections[level] = [];
		}
		abilityBoostSelections[level][index] = ability;

		// Save to character store
		character.update((char) => ({
			...char,
			ruleSelections: {
				...char.ruleSelections,
				[`plan-level-${level}-ability-boosts`]: abilityBoostSelections[level].join(',')
			}
		}));
	}

	function handleSkillIncreaseSelection(level: number, skill: string) {
		skillIncreaseSelections[level] = skill;

		// Save to character store
		character.update((char) => ({
			...char,
			ruleSelections: {
				...char.ruleSelections,
				[`plan-level-${level}-skill-increase`]: skill
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

	function getLevelStatus(level: number): 'past' | 'current' | 'future' {
		if (level < currentLevel) return 'past';
		if (level === currentLevel) return 'current';
		return 'future';
	}

	// Track which levels are expanded
	// PERFORMANCE: Start with only current level expanded for faster initial render
	const defaultExpandedLevels = $derived(
		new Set([currentLevel].filter(l => l <= 20))
	);

	let expandedLevels = $state<Set<number>>(new Set());

	// Initialize expandedLevels on mount
	$effect(() => {
		// Only set if expandedLevels is empty (first time)
		if (expandedLevels.size === 0) {
			expandedLevels = new Set(defaultExpandedLevels);
		}
	});

	function toggleLevel(level: number) {
		const newSet = new Set(expandedLevels);
		if (newSet.has(level)) {
			newSet.delete(level);
		} else {
			newSet.add(level);
		}
		expandedLevels = newSet;
	}
</script>

<svelte:head>
	<title>Planning - Character Builder</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<h1 class="page-title">Level Progression Planning</h1>
		<p class="page-description">
			Plan your character's advancement from level 1 to 20. Make feat selections, plan ability
			boosts, and choose skill increases for future levels.
		</p>
	</header>

	{#if builderData.featsLoading}
		<div class="loading-notice">
			<div class="loading-spinner"></div>
			<span>Loading feat data...</span>
		</div>
	{/if}

	<div class="current-level-info">
		<span class="info-label">Current Level:</span>
		<span class="info-value">{currentLevel}</span>
		{#if selectedClass}
			<span class="info-separator">|</span>
			<span class="info-label">Class:</span>
			<span class="info-value">{selectedClass.name}</span>
		{/if}
	</div>

	<div class="level-timeline">
		{#each levelProgression as levelPlan}
			{@const status = getLevelStatus(levelPlan.level)}
			{@const selections = featSelections[levelPlan.level] || {}}
			{@const boosts = abilityBoostSelections[levelPlan.level] || []}
			{@const skillIncrease = skillIncreaseSelections[levelPlan.level]}
			{@const isExpanded = expandedLevels.has(levelPlan.level)}

			<div class="level-block" class:past={status === 'past'} class:current={status === 'current'} class:future={status === 'future'} class:collapsed={!isExpanded}>
				<button class="level-header" onclick={() => toggleLevel(levelPlan.level)} type="button">
					<div class="level-header-left">
						<div class="level-number">Level {levelPlan.level}</div>
						<span class="expand-icon" class:expanded={isExpanded}>
							{isExpanded ? '▼' : '▶'}
						</span>
					</div>
					{#if status === 'current'}
						<span class="level-badge current-badge">Current</span>
					{/if}
				</button>

				{#if isExpanded}
					<div class="level-content">
						<!-- Class Features Section -->
						{#if levelPlan.classFeatures && levelPlan.classFeatures.length > 0}
							<div class="class-features-section">
								<div class="features-label">Class Features:</div>
								<ul class="class-features-list">
									{#each levelPlan.classFeatures as classFeature}
										{@const resolvedFeature = resolveSpecializedClassFeature(classFeature, classFeatureChoiceSelections, allClassFeatures)}
										{@const fullClassFeature = allClassFeatures.find(acf => acf.name === resolvedFeature.name)}
										{@const choiceInfo = fullClassFeature ? extractChoiceInfo(fullClassFeature) : null}
										<li class="class-feature-item">
											<span class="class-feature-name">
												<RichDescription
													content={`@UUID[${resolvedFeature.uuid}]{${resolvedFeature.name}}`}
												/>
											</span>

											<!-- Class Feature Choice Selector -->
											{#if choiceInfo && choiceInfo.hasChoice && choiceInfo.choiceFlag}
												{@const choices = classFeatureChoiceInfo[choiceInfo.choiceFlag]?.choices || choiceInfo.choices}
												{@const selectedChoice = classFeatureChoiceSelections[choiceInfo.choiceFlag]}
												<div class="class-feature-choice">
													<select
														class="choice-selector"
														value={selectedChoice || ''}
														onchange={(e) => handleClassFeatureChoiceSelection(choiceInfo.choiceFlag!, e.currentTarget.value)}
													>
														<option value="">Select {resolvedFeature.name}...</option>
														{#each choices as choice}
															<option value={choice.value}>{choice.label}</option>
														{/each}
													</select>
													{#if selectedChoice && choiceInfo.choiceType === 'tag-based'}
														{@const selectedFeature = choices.find(c => c.value === selectedChoice)}
														{#if selectedFeature && selectedFeature.description}
															<div class="choice-description">
																<RichDescription
																	content={selectedFeature.description}
																/>
															</div>
														{/if}
													{/if}
												</div>
											{/if}
										</li>
									{/each}
								</ul>
							</div>
						{/if}

						<!-- General Features List -->
						{#if levelPlan.features && levelPlan.features.length > 0}
							<div class="level-features">
								<div class="features-label">Progression:</div>
								<ul class="features-list">
									{#each levelPlan.features as feature}
										<li>{feature}</li>
									{/each}
								</ul>
							</div>
						{/if}

						<div class="level-selections">
					<!-- Class Feat -->
					{#if levelPlan.featSlots.classFeat}
						<PlanningFeatSelector
							label="Class Feat"
							availableFeats={featsByLevel[levelPlan.level].class}
							selectedFeatId={selections.classFeat}
							onSelect={(featId) => handleFeatSelection(levelPlan.level, 'classFeat', featId)}
							loading={builderData.featsLoading}
						/>
					{/if}

					<!-- Free Archetype Feat (Variant Rule) -->
					{#if levelPlan.featSlots.freeArchetypeFeat}
						<PlanningFeatSelector
							label="Free Archetype Feat"
							availableFeats={featsByLevel[levelPlan.level].archetype}
							selectedFeatId={selections.freeArchetypeFeat}
							onSelect={(featId) => handleFeatSelection(levelPlan.level, 'freeArchetypeFeat', featId)}
							loading={builderData.featsLoading}
							variant="variant-rule"
						/>
					{/if}

					<!-- Ancestry Feat -->
					{#if levelPlan.featSlots.ancestryFeat}
						<PlanningFeatSelector
							label="Ancestry Feat"
							availableFeats={featsByLevel[levelPlan.level].ancestry}
							selectedFeatId={selections.ancestryFeat}
							onSelect={(featId) => handleFeatSelection(levelPlan.level, 'ancestryFeat', featId)}
							loading={builderData.featsLoading}
						/>
					{/if}

					<!-- Skill Feat -->
					{#if levelPlan.featSlots.skillFeat}
						<PlanningFeatSelector
							label="Skill Feat"
							availableFeats={featsByLevel[levelPlan.level].skill}
							selectedFeatId={selections.skillFeat}
							onSelect={(featId) => handleFeatSelection(levelPlan.level, 'skillFeat', featId)}
							loading={builderData.featsLoading}
						/>
					{/if}

					<!-- General Feat -->
					{#if levelPlan.featSlots.generalFeat}
						<PlanningFeatSelector
							label="General Feat"
							availableFeats={featsByLevel[levelPlan.level].general}
							selectedFeatId={selections.generalFeat}
							onSelect={(featId) => handleFeatSelection(levelPlan.level, 'generalFeat', featId)}
							loading={builderData.featsLoading}
						/>
					{/if}

					<!-- Ability Boosts -->
					{#if levelPlan.abilityBoosts > 0}
						<div class="selection-group">
							<div class="selection-label">Ability Boosts ({levelPlan.abilityBoosts}):</div>
							<div class="ability-boost-grid">
								{#each Array.from({ length: levelPlan.abilityBoosts }, (_, i) => i) as index}
									<select
										class="selection-input"
										value={boosts[index] || ''}
										onchange={(e) => handleAbilityBoostSelection(levelPlan.level, index, e.currentTarget.value)}
									>
										<option value="">Boost {index + 1}...</option>
										{#each ABILITIES as ability}
											<option value={ability}>{ability}</option>
										{/each}
									</select>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Skill Increase -->
					{#if levelPlan.skillIncrease}
						<div class="selection-group">
							<label class="selection-label" for="skill-increase-{levelPlan.level}">
								Skill Increase:
							</label>
							<select
								id="skill-increase-{levelPlan.level}"
								class="selection-input"
								value={skillIncrease || ''}
								onchange={(e) => handleSkillIncreaseSelection(levelPlan.level, e.currentTarget.value)}
							>
								<option value="">Select skill...</option>
								{#each SKILLS as skill}
									<option value={skill}>{skill}</option>
								{/each}
							</select>
						</div>
					{/if}
					</div>
				</div>
				{/if}
			</div>
		{/each}
	</div>

	<div class="planning-tips">
		<h2 class="tips-title">Planning Tips</h2>
		<ul class="tips-list">
			<li><strong>Feat Chains:</strong> Some powerful feats require prerequisites. Plan ahead to ensure you can take them when you want.</li>
			<li><strong>Ability Boosts:</strong> You get 4 ability boosts at levels 5, 10, 15, and 20. Each ability can only be boosted once per level.</li>
			<li><strong>Skill Increases:</strong> At odd levels (3, 5, 7, etc.), you can increase a skill's proficiency rank by one step.</li>
			<li><strong>Archetype Dedications:</strong> If you plan to take an archetype, you'll need to dedicate at least 2 class feats to it before taking other archetypes.</li>
			<li><strong>Flexibility:</strong> This plan is for reference only. You can change your mind when you actually reach each level.</li>
		</ul>
	</div>
</div>

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

	.loading-notice {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		background-color: rgba(92, 124, 250, 0.1);
		border: 2px solid rgba(92, 124, 250, 0.3);
		border-radius: 8px;
		margin-bottom: 1.5rem;
		color: var(--text-primary, #1a1a1a);
		font-weight: 500;
	}

	.loading-spinner {
		width: 20px;
		height: 20px;
		border: 3px solid rgba(92, 124, 250, 0.3);
		border-top-color: var(--link-color, #5c7cfa);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
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
		line-height: 1.6;
	}

	.current-level-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
		margin-bottom: 2rem;
		border: 2px solid var(--border-color, #e0e0e0);
	}

	.info-label {
		font-weight: 600;
		color: var(--text-secondary, #666666);
	}

	.info-value {
		font-weight: 700;
		font-size: 1.125rem;
		color: var(--text-primary, #1a1a1a);
	}

	.info-separator {
		color: var(--border-color, #e0e0e0);
	}

	.level-timeline {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.level-block {
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 10px;
		transition: all var(--transition-fast);
	}

	.level-block.collapsed {
		padding: 0;
	}

	.level-block.current {
		background-color: rgba(92, 124, 250, 0.1);
		border-color: var(--link-color, #5c7cfa);
		border-width: 3px;
	}

	.level-block.past {
		background-color: var(--surface-1, #ffffff);
	}

	.level-block.future {
		background-color: rgba(55, 178, 77, 0.05);
		border-color: #d3d3d3;
	}

	.level-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 1rem 1.5rem;
		background: none;
		border: none;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
		font-family: inherit;
		text-align: left;
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.level-block.collapsed .level-header {
		border-bottom: none;
	}

	.level-header:hover {
		background-color: rgba(0, 0, 0, 0.02);
	}

	.level-header:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: -2px;
	}

	.level-header-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.level-content {
		padding: 0 1.5rem 1.5rem 1.5rem;
	}

	.expand-icon {
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		transition: transform var(--transition-fast);
	}

	.level-number {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.level-badge {
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
		font-size: 0.8125rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.current-badge {
		background-color: var(--link-color, #5c7cfa);
		color: white;
	}

	.level-features {
		margin-bottom: 1rem;
	}

	.features-label {
		font-weight: 600;
		color: var(--text-secondary, #666666);
		margin-bottom: 0.5rem;
		font-size: 0.9375rem;
	}

	.features-list {
		margin: 0;
		padding-left: 1.5rem;
		color: var(--text-primary, #1a1a1a);
	}

	.features-list li {
		margin-bottom: 0.25rem;
		font-size: 0.9375rem;
	}

	/* Class Features Section */
	.class-features-section {
		margin-bottom: 1rem;
		padding: 0.75rem;
		background-color: rgba(92, 124, 250, 0.05);
		border-left: 3px solid var(--link-color, #5c7cfa);
		border-radius: 4px;
	}

	.class-features-list {
		margin: 0;
		padding-left: 1.5rem;
		color: var(--text-primary, #1a1a1a);
	}

	.class-feature-item {
		margin-bottom: 0.5rem;
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	.class-feature-name {
		font-weight: 500;
	}

	.class-feature-choice {
		margin-top: 0.5rem;
		padding-left: 1rem;
	}

	.choice-selector {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-size: 0.9375rem;
		font-family: inherit;
		background-color: var(--surface-1, #ffffff);
		color: var(--text-primary, #1a1a1a);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.choice-selector:hover {
		border-color: var(--link-color, #5c7cfa);
	}

	.choice-selector:focus {
		outline: none;
		border-color: var(--link-color, #5c7cfa);
		box-shadow: 0 0 0 3px rgba(92, 124, 250, 0.1);
	}

	.choice-description {
		margin-top: 0.75rem;
		padding: 0.75rem;
		background-color: rgba(92, 124, 250, 0.03);
		border-left: 2px solid var(--link-color, #5c7cfa);
		border-radius: 4px;
		font-size: 0.875rem;
		line-height: 1.6;
	}

	.level-selections {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}

	/* Center odd items on their own row */
	.level-selections > :nth-child(odd):last-child {
		grid-column: 1 / -1;
		width: 50%;
		margin: 0 auto;
	}

	/* Mobile: Full width, single column */
	@media (max-width: 768px) {
		.level-selections {
			grid-template-columns: 1fr;
		}

		.level-selections > :nth-child(odd):last-child {
			max-width: 100%;
		}
	}

	.selection-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.selection-label {
		font-weight: 600;
		font-size: 0.9375rem;
		color: var(--text-primary, #1a1a1a);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.selection-input {
		padding: 0.9375rem 1.25rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		font-size: 0.9375rem;
		font-family: inherit;
		background-color: var(--surface-1, #ffffff);
		color: var(--text-primary, #1a1a1a);
		cursor: pointer;
		transition: all var(--transition-fast);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
		position: relative;
	}

	.selection-input:hover {
		border-color: var(--link-color, #5c7cfa);
		box-shadow: 0 2px 8px rgba(92, 124, 250, 0.15);
	}

	.selection-input:focus {
		outline: none;
		border-color: var(--focus-color, #5c7cfa);
		box-shadow: 0 0 0 3px rgba(92, 124, 250, 0.1);
	}

	.ability-boost-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 0.75rem;
	}

	.planning-tips {
		margin-top: 2rem;
		padding: 1.5rem;
		background-color: rgba(92, 124, 250, 0.1);
		border-left: 4px solid var(--link-color, #5c7cfa);
		border-radius: 8px;
	}

	.tips-title {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.tips-list {
		margin: 0;
		padding-left: 1.5rem;
		color: var(--text-primary, #1a1a1a);
	}

	.tips-list li {
		margin-bottom: 0.75rem;
		line-height: 1.6;
	}

	/* Mobile */
	@media (max-width: 768px) {
		.page-title {
			font-size: 1.75rem;
		}

		.page-description {
			font-size: 1rem;
		}

		.current-level-info {
			flex-wrap: wrap;
		}

		.level-block {
			padding: 1.25rem;
		}

		.level-number {
			font-size: 1.25rem;
		}

		.ability-boost-grid {
			grid-template-columns: 1fr;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.level-block,
		.selection-input {
			transition: none;
		}
	}
</style>
