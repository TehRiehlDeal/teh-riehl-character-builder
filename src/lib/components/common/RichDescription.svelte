<script lang="ts">
	import { processDescription } from '$lib/utils/descriptionParser';
	import { character } from '$lib/stores/character';
	import {
		featLoader,
		spellLoader,
		ancestryLoader,
		classLoader,
		heritageLoader,
		backgroundLoader,
		equipmentLoader,
		actionLoader,
		conditionLoader,
		effectLoader,
		journalLoader
	} from '$lib/data/loaders';
	import type {
		Feat,
		Spell,
		Ancestry,
		Class,
		Heritage,
		Background,
		Equipment,
		Action,
		Condition,
		Effect,
		JournalPage
	} from '$lib/data/types/app';
	import FeatDetailModal from './FeatDetailModal.svelte';
	import SpellDetailModal from './SpellDetailModal.svelte';
	import AncestryDetailModal from './AncestryDetailModal.svelte';
	import ClassDetailModal from './ClassDetailModal.svelte';
	import HeritageDetailModal from './HeritageDetailModal.svelte';
	import BackgroundDetailModal from './BackgroundDetailModal.svelte';
	import EquipmentDetailModal from './EquipmentDetailModal.svelte';
	import ActionDetailModal from './ActionDetailModal.svelte';
	import ConditionDetailModal from './ConditionDetailModal.svelte';
	import EffectDetailModal from './EffectDetailModal.svelte';
	import JournalDetailModal from './JournalDetailModal.svelte';

	interface Props {
		/** Raw HTML description from Foundry data */
		content: string;
		/** Optional CSS class for styling */
		class?: string;
	}

	let { content, class: className = '' }: Props = $props();

	// Get character level for spell damage calculation
	const characterLevel = $derived($character.level);

	// Process the description to handle UUID links and other Foundry syntax
	const processedContent = $derived(processDescription(content));

	// Modal state for viewing linked content
	let featModalOpen = $state(false);
	let spellModalOpen = $state(false);
	let ancestryModalOpen = $state(false);
	let classModalOpen = $state(false);
	let heritageModalOpen = $state(false);
	let backgroundModalOpen = $state(false);
	let equipmentModalOpen = $state(false);
	let actionModalOpen = $state(false);
	let conditionModalOpen = $state(false);
	let effectModalOpen = $state(false);
	let journalModalOpen = $state(false);
	let selectedFeat: Feat | null = $state(null);
	let selectedSpell: Spell | null = $state(null);
	let selectedAncestry: Ancestry | null = $state(null);
	let selectedClass: Class | null = $state(null);
	let selectedHeritage: Heritage | null = $state(null);
	let selectedBackground: Background | null = $state(null);
	let selectedEquipment: Equipment | null = $state(null);
	let selectedAction: Action | null = $state(null);
	let selectedCondition: Condition | null = $state(null);
	let selectedEffect: Effect | null = $state(null);
	let selectedJournalPage: JournalPage | null = $state(null);
	let loadingContent = $state(false);

	// Reference to the description container
	let descriptionRef: HTMLDivElement | undefined = $state();

	// Handle clicks on UUID links
	async function handleLinkClick(event: MouseEvent) {
		const target = event.target as HTMLElement;

		// Check if the clicked element is a journal link
		if (target.classList.contains('journal-link')) {
			event.preventDefault();

			const pageId = target.getAttribute('data-page-id');
			if (!pageId) return;

			await loadAndShowJournalPage(pageId);
			return;
		}

		// Check if the clicked element is a UUID link
		if (target.classList.contains('uuid-link')) {
			event.preventDefault();

			const uuidData = target.getAttribute('data-uuid');
			if (!uuidData) return;

			// Parse the UUID to extract type and ID
			// Format: @UUID[Compendium.pf2e.{type}.Item.{id}]
			const match = uuidData.match(/@UUID\[Compendium\.pf2e\.([^.]+)\.Item\.([^\]]+)\]/);
			if (!match) return;

			const [, compendiumType, itemId] = match;

			// Handle different compendium types
			if (compendiumType === 'feats-srd') {
				await loadAndShowFeat(itemId);
			} else if (compendiumType === 'classfeatures') {
				await loadAndShowClassFeature(itemId);
			} else if (compendiumType === 'spells-srd') {
				await loadAndShowSpell(itemId);
			} else if (compendiumType === 'ancestries') {
				await loadAndShowAncestry(itemId);
			} else if (compendiumType === 'classes') {
				await loadAndShowClass(itemId);
			} else if (compendiumType === 'heritages') {
				await loadAndShowHeritage(itemId);
			} else if (compendiumType === 'backgrounds') {
				await loadAndShowBackground(itemId);
			} else if (compendiumType === 'equipment' || compendiumType === 'equipment-srd') {
				await loadAndShowEquipment(itemId);
			} else if (compendiumType === 'actions' || compendiumType === 'actionspf2e') {
				await loadAndShowAction(itemId);
			} else if (compendiumType === 'conditionitems') {
				await loadAndShowCondition(itemId);
			} else if (compendiumType === 'feat-effects') {
				await loadAndShowEffect(itemId);
			}
		}
	}

	// Load feat data and show modal
	async function loadAndShowFeat(featId: string) {
		loadingContent = true;
		try {
			// Try to find feat by name (since itemId is often the name with spaces replaced)
			const allFeats = await featLoader.loadAll();

			// Convert the slug back to a searchable form
			const searchName = featId.split('.').pop()?.replace(/-/g, ' ') || featId;

			const feat = allFeats.find(f =>
				f.name.toLowerCase() === searchName.toLowerCase() ||
				f.id === featId
			);

			if (feat) {
				selectedFeat = feat;
				featModalOpen = true;
			} else {
				console.warn(`Feat not found: ${featId}`);
			}
		} catch (error) {
			console.error('Failed to load feat:', error);
		} finally {
			loadingContent = false;
		}
	}

	// Load class feature data and show modal (class features are feats with category 'classfeature')
	async function loadAndShowClassFeature(classFeatureId: string) {
		loadingContent = true;
		try {
			// Import classfeature repository
			const { loadAllClassFeatures } = await import('$lib/data/repositories/classFeatureRepository');
			const allClassFeatures = await loadAllClassFeatures();

			// Convert the slug back to a searchable form
			const searchName = classFeatureId.split('.').pop()?.replace(/-/g, ' ') || classFeatureId;

			const classFeature = allClassFeatures.find(cf =>
				cf.name.toLowerCase() === searchName.toLowerCase() ||
				cf.id === classFeatureId
			);

			if (classFeature) {
				// Class features are feats with category 'classfeature', so we can use the feat modal
				selectedFeat = classFeature;
				featModalOpen = true;
			} else {
				console.warn(`Class feature not found: ${classFeatureId}`);
			}
		} catch (error) {
			console.error('Failed to load class feature:', error);
		} finally {
			loadingContent = false;
		}
	}

	// Load spell data and show modal
	async function loadAndShowSpell(spellId: string) {
		loadingContent = true;
		try {
			// Try to find spell by name (since itemId is often the name with spaces replaced)
			const allSpells = await spellLoader.loadAll();

			// Convert the slug back to a searchable form
			const searchName = spellId.split('.').pop()?.replace(/-/g, ' ') || spellId;

			const spell = allSpells.find(s =>
				s.name.toLowerCase() === searchName.toLowerCase() ||
				s.id === spellId
			);

			if (spell) {
				selectedSpell = spell;
				spellModalOpen = true;
			} else {
				console.warn(`Spell not found: ${spellId}`);
			}
		} catch (error) {
			console.error('Failed to load spell:', error);
		} finally {
			loadingContent = false;
		}
	}

	// Load ancestry data and show modal
	async function loadAndShowAncestry(ancestryId: string) {
		loadingContent = true;
		try {
			const allAncestries = await ancestryLoader.loadAll();
			const searchName = ancestryId.split('.').pop()?.replace(/-/g, ' ') || ancestryId;
			const ancestry = allAncestries.find(a =>
				a.name.toLowerCase() === searchName.toLowerCase() ||
				a.id === ancestryId
			);

			if (ancestry) {
				selectedAncestry = ancestry;
				ancestryModalOpen = true;
			} else {
				console.warn(`Ancestry not found: ${ancestryId}`);
			}
		} catch (error) {
			console.error('Failed to load ancestry:', error);
		} finally {
			loadingContent = false;
		}
	}

	// Load class data and show modal
	async function loadAndShowClass(classId: string) {
		loadingContent = true;
		try {
			const allClasses = await classLoader.loadAll();
			const searchName = classId.split('.').pop()?.replace(/-/g, ' ') || classId;
			const classData = allClasses.find(c =>
				c.name.toLowerCase() === searchName.toLowerCase() ||
				c.id === classId
			);

			if (classData) {
				selectedClass = classData;
				classModalOpen = true;
			} else {
				console.warn(`Class not found: ${classId}`);
			}
		} catch (error) {
			console.error('Failed to load class:', error);
		} finally {
			loadingContent = false;
		}
	}

	// Load heritage data and show modal
	async function loadAndShowHeritage(heritageId: string) {
		loadingContent = true;
		try {
			const allHeritages = await heritageLoader.loadAll();
			const searchName = heritageId.split('.').pop()?.replace(/-/g, ' ') || heritageId;
			const heritage = allHeritages.find(h =>
				h.name.toLowerCase() === searchName.toLowerCase() ||
				h.id === heritageId
			);

			if (heritage) {
				selectedHeritage = heritage;
				heritageModalOpen = true;
			} else {
				console.warn(`Heritage not found: ${heritageId}`);
			}
		} catch (error) {
			console.error('Failed to load heritage:', error);
		} finally {
			loadingContent = false;
		}
	}

	// Load background data and show modal
	async function loadAndShowBackground(backgroundId: string) {
		loadingContent = true;
		try {
			const allBackgrounds = await backgroundLoader.loadAll();
			const searchName = backgroundId.split('.').pop()?.replace(/-/g, ' ') || backgroundId;
			const background = allBackgrounds.find(b =>
				b.name.toLowerCase() === searchName.toLowerCase() ||
				b.id === backgroundId
			);

			if (background) {
				selectedBackground = background;
				backgroundModalOpen = true;
			} else {
				console.warn(`Background not found: ${backgroundId}`);
			}
		} catch (error) {
			console.error('Failed to load background:', error);
		} finally {
			loadingContent = false;
		}
	}

	// Load equipment data and show modal
	async function loadAndShowEquipment(equipmentId: string) {
		loadingContent = true;
		try {
			const allEquipment = await equipmentLoader.loadAll();
			const searchName = equipmentId.split('.').pop()?.replace(/-/g, ' ') || equipmentId;
			const equipment = allEquipment.find(e =>
				e.name.toLowerCase() === searchName.toLowerCase() ||
				e.id === equipmentId
			);

			if (equipment) {
				selectedEquipment = equipment;
				equipmentModalOpen = true;
			} else {
				console.warn(`Equipment not found: ${equipmentId}`);
			}
		} catch (error) {
			console.error('Failed to load equipment:', error);
		} finally {
			loadingContent = false;
		}
	}

	// Load action data and show modal
	async function loadAndShowAction(actionId: string) {
		loadingContent = true;
		try {
			const allActions = await actionLoader.loadAll();
			const searchName = actionId.split('.').pop()?.replace(/-/g, ' ') || actionId;
			const action = allActions.find(a =>
				a.name.toLowerCase() === searchName.toLowerCase() ||
				a.id === actionId
			);

			if (action) {
				selectedAction = action;
				actionModalOpen = true;
			} else {
				console.warn(`Action not found: ${actionId}`);
			}
		} catch (error) {
			console.error('Failed to load action:', error);
		} finally {
			loadingContent = false;
		}
	}

	// Load condition data and show modal
	async function loadAndShowCondition(conditionId: string) {
		loadingContent = true;
		try {
			const allConditions = await conditionLoader.loadAll();
			const searchName = conditionId.split('.').pop()?.replace(/-/g, ' ') || conditionId;
			const condition = allConditions.find(c =>
				c.name.toLowerCase() === searchName.toLowerCase() ||
				c.id === conditionId
			);

			if (condition) {
				selectedCondition = condition;
				conditionModalOpen = true;
			} else {
				console.warn(`Condition not found: ${conditionId}`);
			}
		} catch (error) {
			console.error('Failed to load condition:', error);
		} finally {
			loadingContent = false;
		}
	}

	// Load effect data and show modal
	async function loadAndShowEffect(effectId: string) {
		loadingContent = true;
		try {
			const allEffects = await effectLoader.loadAll();
			const searchName = effectId.split('.').pop()?.replace(/-/g, ' ') || effectId;
			const effect = allEffects.find(e =>
				e.name.toLowerCase() === searchName.toLowerCase() ||
				e.id === effectId
			);

			if (effect) {
				selectedEffect = effect;
				effectModalOpen = true;
			} else {
				console.warn(`Effect not found: ${effectId}`);
			}
		} catch (error) {
			console.error('Failed to load effect:', error);
		} finally {
			loadingContent = false;
		}
	}

	// Load journal page data and show modal
	async function loadAndShowJournalPage(pageId: string) {
		loadingContent = true;
		try {
			const page = await journalLoader.getPageById(pageId);

			if (page) {
				selectedJournalPage = page;
				journalModalOpen = true;
			} else {
				console.warn(`Journal page not found: ${pageId}`);
			}
		} catch (error) {
			console.error('Failed to load journal page:', error);
		} finally {
			loadingContent = false;
		}
	}

	// Attach click handler when component mounts
	$effect(() => {
		if (descriptionRef) {
			descriptionRef.addEventListener('click', handleLinkClick);

			return () => {
				descriptionRef?.removeEventListener('click', handleLinkClick);
			};
		}
	});
</script>

<div class="rich-description {className}" role="region" aria-label="Description" bind:this={descriptionRef}>
	{@html processedContent}
</div>

<!-- Loading indicator for when fetching linked content -->
{#if loadingContent}
	<div class="loading-overlay" role="status" aria-live="polite">
		<div class="loading-spinner"></div>
		<span class="loading-text">Loading details...</span>
	</div>
{/if}

<!-- Modal for displaying linked feat details -->
<FeatDetailModal bind:open={featModalOpen} feat={selectedFeat} />

<!-- Modal for displaying linked spell details -->
<SpellDetailModal bind:open={spellModalOpen} spell={selectedSpell} {characterLevel} />

<!-- Modal for displaying linked ancestry details -->
<AncestryDetailModal bind:open={ancestryModalOpen} ancestry={selectedAncestry} />

<!-- Modal for displaying linked class details -->
<ClassDetailModal bind:open={classModalOpen} classData={selectedClass} />

<!-- Modal for displaying linked heritage details -->
<HeritageDetailModal bind:open={heritageModalOpen} heritage={selectedHeritage} />

<!-- Modal for displaying linked background details -->
<BackgroundDetailModal bind:open={backgroundModalOpen} background={selectedBackground} />

<!-- Modal for displaying linked equipment details -->
<EquipmentDetailModal bind:open={equipmentModalOpen} equipment={selectedEquipment} />

<!-- Modal for displaying linked action details -->
<ActionDetailModal bind:open={actionModalOpen} action={selectedAction} />

<!-- Modal for displaying linked condition details -->
<ConditionDetailModal bind:open={conditionModalOpen} condition={selectedCondition} />

<!-- Modal for displaying linked effect details -->
<EffectDetailModal bind:open={effectModalOpen} effect={selectedEffect} />

<!-- Modal for displaying linked journal page details -->
<JournalDetailModal bind:open={journalModalOpen} page={selectedJournalPage} />

<style>
	.rich-description {
		color: var(--text-primary, #1a1a1a);
		line-height: 1.6;
	}

	/* Style for parsed UUID links */
	.rich-description :global(.uuid-link) {
		color: var(--link-color, #5c7cfa);
		text-decoration: none;
		font-weight: 500;
		border-bottom: 1px dotted var(--link-color, #5c7cfa);
		transition: all var(--transition-fast);
		cursor: pointer;
	}

	.rich-description :global(.uuid-link:hover) {
		color: var(--link-hover-color, #4c6ef5);
		border-bottom-style: solid;
	}

	.rich-description :global(.uuid-link:focus) {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
		border-radius: 2px;
	}

	/* Style for journal links */
	.rich-description :global(.journal-link) {
		color: var(--link-color, #5c7cfa);
		text-decoration: none;
		font-weight: 500;
		font-style: italic;
		border-bottom: 1px dotted var(--link-color, #5c7cfa);
		transition: all var(--transition-fast);
		cursor: pointer;
	}

	.rich-description :global(.journal-link:hover) {
		color: var(--link-hover-color, #4c6ef5);
		border-bottom-style: solid;
	}

	.rich-description :global(.journal-link:focus) {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
		border-radius: 2px;
	}

	/* Style for inline rolls */
	.rich-description :global(.inline-roll) {
		display: inline-block;
		padding: 0.125rem 0.375rem;
		background-color: rgba(92, 124, 250, 0.1);
		border: 1px solid rgba(92, 124, 250, 0.3);
		border-radius: 3px;
		font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
		font-size: 0.875em;
		color: var(--link-color, #5c7cfa);
	}

	/* Style for inline checks */
	.rich-description :global(.inline-check) {
		display: inline-block;
		padding: 0.125rem 0.375rem;
		background-color: rgba(250, 176, 5, 0.1);
		border: 1px solid rgba(250, 176, 5, 0.3);
		border-radius: 3px;
		font-size: 0.875em;
		font-weight: 600;
		color: #c77700;
	}

	/* Style for damage */
	.rich-description :global(.damage) {
		display: inline-block;
		padding: 0.125rem 0.375rem;
		background-color: rgba(240, 62, 62, 0.1);
		border: 1px solid rgba(240, 62, 62, 0.3);
		border-radius: 3px;
		font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
		font-size: 0.875em;
		font-weight: 600;
		color: #e03131;
	}

	/* Style for template references */
	.rich-description :global(.template-ref) {
		display: inline-block;
		padding: 0.125rem 0.375rem;
		background-color: rgba(55, 178, 77, 0.1);
		border: 1px solid rgba(55, 178, 77, 0.3);
		border-radius: 3px;
		font-size: 0.875em;
		font-weight: 600;
		color: #2f9e44;
	}

	/* Preserve existing HTML formatting */
	.rich-description :global(p) {
		margin: 0 0 0.75rem 0;
	}

	.rich-description :global(p:last-child) {
		margin-bottom: 0;
	}

	.rich-description :global(ul),
	.rich-description :global(ol) {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	.rich-description :global(li) {
		margin-bottom: 0.25rem;
	}

	.rich-description :global(strong) {
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.rich-description :global(em) {
		font-style: italic;
	}

	.rich-description :global(h1),
	.rich-description :global(h2),
	.rich-description :global(h3),
	.rich-description :global(h4) {
		margin: 1rem 0 0.5rem 0;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.rich-description :global(h1) {
		font-size: 1.5rem;
	}

	.rich-description :global(h2) {
		font-size: 1.25rem;
	}

	.rich-description :global(h3) {
		font-size: 1.125rem;
	}

	.rich-description :global(h4) {
		font-size: 1rem;
	}

	.rich-description :global(hr) {
		margin: 1rem 0;
		border: none;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}

	.rich-description :global(table) {
		width: 100%;
		margin: 1rem 0;
		border-collapse: collapse;
	}

	.rich-description :global(th),
	.rich-description :global(td) {
		padding: 0.5rem;
		border: 1px solid var(--border-color, #e0e0e0);
		text-align: left;
	}

	.rich-description :global(th) {
		background-color: var(--surface-2, #f5f5f5);
		font-weight: 600;
	}

	/* Loading overlay */
	.loading-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		z-index: 9999;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-text {
		color: #fff;
		font-size: 1rem;
		font-weight: 500;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.rich-description :global(.uuid-link) {
			transition: none;
		}

		.loading-spinner {
			animation: none;
			border-top-color: rgba(255, 255, 255, 0.3);
		}
	}
</style>
