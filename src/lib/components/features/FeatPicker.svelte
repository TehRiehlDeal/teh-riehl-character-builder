<script lang="ts">
	import type { Feat } from '$lib/data/types/app';
	import type { Character as ValidationCharacter, VariantRules, FeatSlotContext } from '$lib/validation';
	import { parsePrerequisites, validatePrerequisites } from '$lib/validation';
	import VirtualList from '../common/VirtualList.svelte';
	import Button from '../common/Button.svelte';
	import Modal from '../common/Modal.svelte';
	import RichDescription from '../common/RichDescription.svelte';
	import { getExcerpt } from '$lib/utils/descriptionParser';

	interface Props {
		/** Available feats to choose from */
		feats: Feat[];
		/** Currently selected feat ID */
		selectedFeatId?: string | null;
		/** Character level for prerequisite validation */
		characterLevel?: number;
		/** Character data for comprehensive prerequisite validation */
		characterData?: Partial<ValidationCharacter>;
		/** Variant rules that may affect validation */
		variantRules?: VariantRules;
		/** Callback when a feat is selected */
		// eslint-disable-next-line no-unused-vars
		onSelect?: (feat: Feat) => void;
		/** Optional filter by category */
		filterCategory?: string;
		/** Optional filter by level */
		filterLevel?: number;
		/** Optional filter by trait (e.g., 'archetype') */
		filterTrait?: string;
		/** Slot context for special validation rules (e.g., Free Archetype) */
		slotContext?: FeatSlotContext;
	}

	let {
		feats,
		selectedFeatId = null,
		characterLevel = 1,
		characterData,
		variantRules,
		onSelect,
		filterCategory,
		filterLevel,
		filterTrait,
		slotContext
	}: Props = $props();

	// State
	let searchQuery = $state('');
	let selectedCategory = $state(filterCategory || 'all');
	let selectedLevel = $state(filterLevel || 'all');
	let detailModalOpen = $state(false);
	let selectedFeat: Feat | null = $state(null);

	// Get unique categories and levels
	const categories = $derived.by(() => {
		const cats = new Set(feats.map((f) => f.category));
		return ['all', ...Array.from(cats).sort()];
	});

	const levels = $derived.by(() => {
		const lvls = new Set(feats.map((f) => f.level));
		return ['all', ...Array.from(lvls).sort((a, b) => a - b)];
	});

	// Filter feats
	const filteredFeats = $derived.by(() => {
		return feats.filter((feat) => {
			// Search query
			if (searchQuery && !feat.name.toLowerCase().includes(searchQuery.toLowerCase())) {
				return false;
			}

			// Category filter
			if (selectedCategory !== 'all' && feat.category !== selectedCategory) {
				return false;
			}

			// Level filter
			if (selectedLevel !== 'all' && feat.level !== selectedLevel) {
				return false;
			}

			// Trait filter
			if (filterTrait && !feat.traits.includes(filterTrait)) {
				return false;
			}

			return true;
		});
	});

	// Check if feat prerequisites are met using the validation system
	function checkPrerequisites(feat: Feat): { met: boolean; missing: string[] } {
		const missing: string[] = [];

		// Check level requirement
		if (feat.level > characterLevel) {
			missing.push(`Level ${feat.level} required`);
		}

		// If we have character data, use the validation system for comprehensive checking
		if (characterData && feat.prerequisites && feat.prerequisites.length > 0) {
			// Parse string prerequisites into structured format
			const structuredPrereqs = parsePrerequisites(feat.prerequisites);

			// Build full character object for validation
			const fullCharacter: ValidationCharacter = {
				level: characterLevel,
				abilityScores: characterData.abilityScores || {},
				skills: characterData.skills || { trained: [], expert: [], master: [], legendary: [] },
				feats: characterData.feats || [],
				class: characterData.class,
				ancestry: characterData.ancestry
			};

			// Validate prerequisites with slot context and feat traits for Free Archetype waiver
			const validationResult = validatePrerequisites(
				structuredPrereqs,
				fullCharacter,
				variantRules,
				slotContext,
				feat.traits
			);

			// Add validation errors to missing list
			validationResult.errors.forEach((error) => {
				missing.push(error.message);
			});
		} else if (feat.prerequisites && feat.prerequisites.length > 0) {
			// Fallback: if no character data, just list the prerequisites
			feat.prerequisites.forEach((prereq) => {
				missing.push(prereq);
			});
		}

		return {
			met: missing.length === 0,
			missing
		};
	}

	function handleSelectFeat(feat: Feat) {
		const prereqs = checkPrerequisites(feat);
		if (prereqs.met) {
			onSelect?.(feat);
		} else {
			// Show detail modal with prerequisites
			selectedFeat = feat;
			detailModalOpen = true;
		}
	}

	function viewDetails(feat: Feat) {
		selectedFeat = feat;
		detailModalOpen = true;
	}

	function clearFilters() {
		searchQuery = '';
		selectedCategory = 'all';
		selectedLevel = 'all';
	}
</script>

<div class="feat-picker">
	<!-- Filters -->
	<div class="picker-filters">
		<div class="filter-row">
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Search feats..."
				class="search-input"
				aria-label="Search feats"
			/>
		</div>

		<div class="filter-row">
			<label class="filter-label">
				Category:
				<select bind:value={selectedCategory} class="filter-select">
					{#each categories as category}
						<option value={category}>
							{category === 'all' ? 'All Categories' : category}
						</option>
					{/each}
				</select>
			</label>

			<label class="filter-label">
				Level:
				<select bind:value={selectedLevel} class="filter-select">
					{#each levels as level}
						<option value={level}>
							{level === 'all' ? 'All Levels' : `Level ${level}`}
						</option>
					{/each}
				</select>
			</label>

			<Button variant="ghost" size="sm" onclick={clearFilters}>Clear Filters</Button>
		</div>

		<div class="filter-info">
			Showing {filteredFeats.length} of {feats.length} feats
		</div>
	</div>

	<!-- Feat List -->
	<div class="picker-list">
		<VirtualList
			items={filteredFeats}
			itemHeight={140}
			height={700}
			getKey={(feat) => feat.id}
		>
			{#snippet renderItem(feat)}
				{@const prereqs = checkPrerequisites(feat)}
				{@const isSelected = feat.id === selectedFeatId}

				<div class="feat-item" class:selected={isSelected} class:unavailable={!prereqs.met}>
					<div class="feat-header">
						<h4 class="feat-name">{feat.name}</h4>
						<div class="feat-meta">
							<span class="feat-level">Level {feat.level}</span>
							{#if feat.category}
								<span class="feat-category">{feat.category}</span>
							{/if}
						</div>
					</div>

					<p class="feat-description">
						{getExcerpt(feat.description, 120)}
					</p>

					<div class="feat-footer">
						<div class="feat-actions">
							<Button
								variant="secondary"
								size="sm"
								onclick={(e) => {
									e.stopPropagation();
									viewDetails(feat);
								}}
							>
								Details
							</Button>

							<Button
								variant="primary"
								size="sm"
								disabled={!prereqs.met || isSelected}
								onclick={(e) => {
									e.stopPropagation();
									handleSelectFeat(feat);
								}}
							>
								{isSelected ? 'Selected' : 'Select'}
							</Button>
						</div>

						{#if feat.prerequisites && feat.prerequisites.length > 0}
							<div class="feat-prerequisites" class:met={prereqs.met} class:unmet={!prereqs.met}>
								<strong>Prerequisites:</strong>
								{#if prereqs.met}
									{feat.prerequisites.join(', ')}
								{:else}
									{prereqs.missing.join(', ')}
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/snippet}

			{#snippet emptyState()}
				<div class="empty-state">
					<p>No feats found matching your criteria.</p>
					<Button variant="ghost" onclick={clearFilters}>Clear Filters</Button>
				</div>
			{/snippet}
		</VirtualList>
	</div>
</div>

<!-- Detail Modal -->
{#if selectedFeat}
	<Modal bind:open={detailModalOpen} title={selectedFeat.name} size="lg">
		<div class="feat-detail">
			<div class="detail-header">
				<div class="detail-meta">
					<span class="meta-item"><strong>Level:</strong> {selectedFeat.level}</span>
					{#if selectedFeat.category}
						<span class="meta-item"><strong>Category:</strong> {selectedFeat.category}</span>
					{/if}
					{#if selectedFeat.actionType}
						<span class="meta-item"><strong>Action:</strong> {selectedFeat.actionType}</span>
					{/if}
				</div>
			</div>

			{#if selectedFeat.prerequisites && selectedFeat.prerequisites.length > 0}
				{@const prereqCheck = checkPrerequisites(selectedFeat)}
				<div class="detail-section">
					<h4>Prerequisites</h4>
					<ul class="prereq-list">
						{#each selectedFeat.prerequisites as prereq}
							<li>{prereq}</li>
						{/each}
					</ul>
					{#if !prereqCheck.met}
						<div class="prereq-errors">
							<strong>Missing:</strong>
							<ul>
								{#each prereqCheck.missing as error}
									<li>{error}</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			{/if}

			<div class="detail-section">
				<h4>Description</h4>
				<RichDescription content={selectedFeat.description} class="feat-description-full" />
			</div>

			{#if selectedFeat.traits && selectedFeat.traits.length > 0}
				<div class="detail-section">
					<h4>Traits</h4>
					<div class="trait-list">
						{#each selectedFeat.traits as trait}
							<span class="trait-badge">{trait}</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		{#snippet footer()}
			{@const prereqs = checkPrerequisites(selectedFeat!)}
			<Button variant="secondary" onclick={() => (detailModalOpen = false)}>Close</Button>
			<Button
				variant="primary"
				disabled={!prereqs.met || selectedFeat!.id === selectedFeatId}
				onclick={() => {
					handleSelectFeat(selectedFeat!);
					detailModalOpen = false;
				}}
			>
				{selectedFeat!.id === selectedFeatId ? 'Selected' : 'Select Feat'}
			</Button>
		{/snippet}
	</Modal>
{/if}

<style>
	.feat-picker {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Filters */
	.picker-filters {
		background-color: var(--surface-2, #f5f5f5);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.filter-row {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.search-input {
		flex: 1;
		min-width: 200px;
		padding: 0.5rem 0.75rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--focus-color, #5c7cfa);
	}

	.filter-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
	}

	.filter-select {
		padding: 0.5rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 4px;
		font-size: 0.875rem;
		font-family: inherit;
		background-color: var(--surface-1, #ffffff);
	}

	.filter-select:focus {
		outline: none;
		border-color: var(--focus-color, #5c7cfa);
	}

	.filter-info {
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		font-style: italic;
	}

	/* Feat List */
	.picker-list {
		border-radius: 6px;
		overflow: hidden;
		width: 100%;
	}

	.feat-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		height: 100%;
		width: 100%;
		border-bottom: 1px solid var(--border-color, #e0e0e0);
		border-left: 4px solid transparent;
		box-sizing: border-box;
		overflow: hidden;
	}

	.feat-item.selected {
		background-color: rgba(92, 124, 250, 0.1);
		border-left-color: var(--link-color, #5c7cfa);
	}

	.feat-item.unavailable {
		opacity: 0.6;
	}

	.feat-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.feat-name {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.feat-meta {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.feat-level,
	.feat-category {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		background-color: var(--surface-3, #e0e0e0);
		color: var(--text-secondary, #666666);
		white-space: nowrap;
	}

	.feat-description {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.4;
		color: var(--text-secondary, #666666);
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.feat-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-top: auto;
	}

	.feat-prerequisites {
		font-size: 0.8125rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		text-align: right;
		flex-shrink: 1;
		min-width: 0;
	}

	.feat-prerequisites.met {
		color: #2f9e44;
		background-color: rgba(47, 158, 68, 0.1);
	}

	.feat-prerequisites.unmet {
		color: #f03e3e;
		background-color: rgba(240, 62, 62, 0.1);
	}

	.feat-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.empty-state {
		padding: 3rem;
		text-align: center;
		color: var(--text-secondary, #666666);
	}

	/* Detail Modal */
	.feat-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.detail-header {
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-color, #e0e0e0);
	}

	.detail-meta {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.meta-item {
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
	}

	.detail-section h4 {
		margin: 0 0 0.75rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.prereq-list {
		margin: 0;
		padding-left: 1.5rem;
		color: var(--text-secondary, #666666);
	}

	.prereq-list li {
		margin-bottom: 0.25rem;
	}

	.prereq-errors {
		margin-top: 1rem;
		padding: 0.75rem;
		background-color: rgba(240, 62, 62, 0.1);
		border-left: 3px solid #f03e3e;
		border-radius: 4px;
		color: #f03e3e;
	}

	.prereq-errors ul {
		margin: 0.5rem 0 0 0;
		padding-left: 1.5rem;
	}

	.prereq-errors li {
		margin-bottom: 0.25rem;
	}

	.feat-description-full {
		color: var(--text-primary, #1a1a1a);
		line-height: 1.6;
	}

	.trait-list {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.trait-badge {
		padding: 0.25rem 0.75rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 4px;
		font-size: 0.8125rem;
		color: var(--text-secondary, #666666);
	}

	/* Mobile */
	@media (max-width: 640px) {
		.filter-row {
			flex-direction: column;
			align-items: stretch;
		}

		.filter-label {
			flex-direction: column;
			align-items: flex-start;
		}

		.filter-select {
			width: 100%;
		}
	}
</style>
