<script lang="ts">
	import type { Action } from '$lib/data/types/app';
	import type { Character } from '$lib/stores/character';
	import ActionCard from './ActionCard.svelte';
	import VirtualList from '$lib/components/common/VirtualList.svelte';
	import { validateActionAvailability } from '$lib/validation/actionValidation';
	import { isBasicAction, isSkillAction, getAllSkills, getActionSkills } from '$lib/data/mappings/actionSkillMappings';

	interface Props {
		actions: Action[];
		character: Character;
		onActionClick?: (action: Action) => void;
	}

	let { actions, character, onActionClick }: Props = $props();

	// Filter state
	let searchQuery = $state('');
	let categoryFilter = $state<'all' | 'basic' | 'skill'>('all');
	let skillFilter = $state<string>('all');
	let traitFilter = $state<string>('all');
	let rarityFilter = $state<'all' | 'common' | 'uncommon' | 'rare' | 'unique'>('all');

	// Convert character skills to validation format
	const validationCharacter = $derived.by(() => {
		const skillData = {
			trained: [] as string[],
			expert: [] as string[],
			master: [] as string[],
			legendary: [] as string[]
		};

		// Convert skill proficiency numbers to arrays
		for (const [skill, rank] of Object.entries(character.skills)) {
			if (rank >= 1) skillData.trained.push(skill);
			if (rank >= 2) skillData.expert.push(skill);
			if (rank >= 3) skillData.master.push(skill);
			if (rank >= 4) skillData.legendary.push(skill);
		}

		return {
			level: character.level,
			abilityScores: character.abilities,
			skills: skillData,
			feats: [
				...character.feats.ancestry.map((f) => f.name),
				...character.feats.class.map((f) => f.name),
				...character.feats.skill.map((f) => f.name),
				...character.feats.general.map((f) => f.name)
			],
			class: character.class.name ? { name: character.class.name } : undefined,
			ancestry: character.ancestry.name ? { name: character.ancestry.name } : undefined,
			classFeatures: character.classFeatures
		};
	});

	// Get all unique traits from actions
	const allTraits = $derived.by(() => {
		const traits = new Set<string>();
		actions.forEach((action) => {
			action.traits.forEach((trait) => traits.add(trait));
		});
		return Array.from(traits).sort();
	});

	// Get all skills for filter
	const allSkills = $derived(getAllSkills());

	// Filter actions
	const filteredActions = $derived.by(() => {
		return actions.filter((action) => {
			// Search query
			if (searchQuery && !action.name.toLowerCase().includes(searchQuery.toLowerCase())) {
				return false;
			}

			// Category filter
			if (categoryFilter === 'basic' && !isBasicAction(action.name)) {
				return false;
			}
			if (categoryFilter === 'skill' && !isSkillAction(action.name)) {
				return false;
			}

			// Skill filter (only active when category is 'skill' or 'all')
			if (skillFilter !== 'all') {
				if (!isSkillAction(action.name)) return false;
				// Check if action uses the selected skill
				const skills = getActionSkills(action.name);
				if (!skills.includes(skillFilter)) return false;
			}

			// Trait filter
			if (traitFilter !== 'all' && !action.traits.includes(traitFilter)) {
				return false;
			}

			// Rarity filter
			if (rarityFilter !== 'all' && action.rarity !== rarityFilter) {
				return false;
			}

			return true;
		});
	});

	// Calculate availability for filtered actions
	const actionsWithAvailability = $derived.by(() => {
		return filteredActions.map((action) => ({
			action,
			availability: validateActionAvailability(action, validationCharacter)
		}));
	});

	// Handle clear filters
	function clearFilters() {
		searchQuery = '';
		categoryFilter = 'all';
		skillFilter = 'all';
		traitFilter = 'all';
		rarityFilter = 'all';
	}

	// Check if any filters are active
	const hasActiveFilters = $derived(
		searchQuery !== '' ||
			categoryFilter !== 'all' ||
			skillFilter !== 'all' ||
			traitFilter !== 'all' ||
			rarityFilter !== 'all'
	);
</script>

<div class="action-list">
	<!-- Filters -->
	<div class="filters">
		<div class="filter-row">
			<!-- Search -->
			<div class="filter-group search-group">
				<label for="action-search" class="sr-only">Search actions</label>
				<input
					id="action-search"
					type="text"
					bind:value={searchQuery}
					placeholder="Search actions..."
					class="search-input"
				/>
			</div>

			<!-- Category filter -->
			<div class="filter-group">
				<label for="category-filter">Category</label>
				<select id="category-filter" bind:value={categoryFilter} data-testid="category-filter">
					<option value="all">All Actions</option>
					<option value="basic">Basic Actions</option>
					<option value="skill">Skill Actions</option>
				</select>
			</div>

			<!-- Skill filter (show when viewing Skill Actions or All) -->
			{#if categoryFilter !== 'basic'}
				<div class="filter-group">
					<label for="skill-filter">Skill</label>
					<select id="skill-filter" bind:value={skillFilter} data-testid="skill-filter">
						<option value="all">All Skills</option>
						{#each allSkills as skill}
							<option value={skill}>{skill.charAt(0).toUpperCase() + skill.slice(1)}</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- Trait filter -->
			<div class="filter-group">
				<label for="trait-filter">Trait</label>
				<select id="trait-filter" bind:value={traitFilter}>
					<option value="all">All Traits</option>
					{#each allTraits as trait}
						<option value={trait}>{trait}</option>
					{/each}
				</select>
			</div>

			<!-- Rarity filter -->
			<div class="filter-group">
				<label for="rarity-filter">Rarity</label>
				<select id="rarity-filter" bind:value={rarityFilter}>
					<option value="all">All</option>
					<option value="common">Common</option>
					<option value="uncommon">Uncommon</option>
					<option value="rare">Rare</option>
					<option value="unique">Unique</option>
				</select>
			</div>
		</div>

		<!-- Clear filters button -->
		{#if hasActiveFilters}
			<button class="clear-filters" onclick={clearFilters} type="button">Clear Filters</button>
		{/if}
	</div>

	<!-- Results count -->
	<div class="results-info" aria-live="polite" aria-atomic="true">
		Showing {actionsWithAvailability.length} of {actions.length} actions
	</div>

	<!-- Action list -->
	<div class="action-list-container">
		{#if actionsWithAvailability.length === 0}
			<div class="empty-state">
				<p>No actions found matching your filters.</p>
				{#if hasActiveFilters}
					<button class="clear-filters-link" onclick={clearFilters} type="button">
						Clear filters
					</button>
				{/if}
			</div>
		{:else}
			<div class="virtual-list-wrapper">
				<VirtualList
					items={actionsWithAvailability}
					itemHeight={134}
					height={600}
					getKey={(item) => item.action.id}
				>
					{#snippet renderItem(item)}
						<ActionCard
							action={item.action}
							availability={item.availability}
							onclick={() => onActionClick?.(item.action)}
						/>
					{/snippet}
				</VirtualList>
			</div>
		{/if}
	</div>
</div>

<style>
	.action-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.filters {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
	}

	.filter-row {
		display: grid;
		grid-template-columns: 2fr repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		align-items: end;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-group label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	.search-group {
		grid-column: 1;
	}

	.search-input,
	select {
		padding: 0.625rem 0.75rem;
		font-size: 0.9375rem;
		font-family: inherit;
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		background-color: var(--surface-1, #ffffff);
		color: var(--text-primary, #1a1a1a);
		transition: border-color var(--transition-fast);
	}

	.search-input:focus,
	select:focus {
		outline: none;
		border-color: var(--link-color, #5c7cfa);
		box-shadow: 0 0 0 3px rgba(92, 124, 250, 0.1);
	}

	.clear-filters {
		align-self: flex-start;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--link-color, #5c7cfa);
		background: none;
		border: 1px solid var(--link-color, #5c7cfa);
		border-radius: 6px;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.clear-filters:hover {
		background-color: var(--link-color, #5c7cfa);
		color: white;
	}

	.clear-filters:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	.results-info {
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		font-weight: 500;
	}

	.action-list-container {
		position: relative;
	}

	.virtual-list-wrapper {
		padding: 0.5rem 0;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 3rem 1rem;
		text-align: center;
		color: var(--text-secondary, #666666);
	}

	.empty-state p {
		margin: 0;
		font-size: 1rem;
	}

	.clear-filters-link {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--link-color, #5c7cfa);
		background: none;
		border: 1px solid var(--link-color, #5c7cfa);
		border-radius: 6px;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.clear-filters-link:hover {
		background-color: var(--link-color, #5c7cfa);
		color: white;
	}

	/* Override VirtualList item styles to work with ActionCard */
	.virtual-list-wrapper :global(.virtual-list-item) {
		padding: 0;
		cursor: default;
		border-bottom: none;
		background: transparent;
	}

	.virtual-list-wrapper :global(.virtual-list-item:hover) {
		background: transparent;
	}

	.virtual-list-wrapper :global(.virtual-list-item:focus) {
		background: transparent;
		box-shadow: none;
		outline: none;
	}

	@media (max-width: 768px) {
		.filter-row {
			grid-template-columns: 1fr;
		}

		.search-group {
			grid-column: auto;
		}
	}
</style>
