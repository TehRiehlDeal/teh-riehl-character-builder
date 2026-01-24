<script lang="ts">
	import type { Class } from '$lib/data/types/app';
	import Button from '../common/Button.svelte';
	import Modal from '../common/Modal.svelte';
	import RichDescription from '../common/RichDescription.svelte';
	import { getExcerpt } from '$lib/utils/descriptionParser';

	interface Props {
		/** Available classes */
		classes: Class[];
		/** Currently selected class */
		selectedClass?: Class | null;
		/** Callback when class is selected */
		// eslint-disable-next-line no-unused-vars
		onSelect?: (cls: Class) => void;
	}

	let { classes, selectedClass = null, onSelect }: Props = $props();

	let detailModalOpen = $state(false);
	let selectedForDetails: Class | null = $state(null);
	let searchQuery = $state('');

	// Filter classes by search
	const filteredClasses = $derived.by(() => {
		if (!searchQuery) return classes;
		return classes.filter((cls) => cls.name.toLowerCase().includes(searchQuery.toLowerCase()));
	});

	function handleSelect(cls: Class) {
		onSelect?.(cls);
	}

	function viewDetails(cls: Class) {
		selectedForDetails = cls;
		detailModalOpen = true;
	}

	function formatKeyAbility(abilities?: string[]): string {
		if (!abilities || abilities.length === 0) {
			return 'None';
		}
		if (abilities.length === 1) {
			return abilities[0];
		}
		return abilities.join(' or ');
	}

	function getProficiencyLabel(rank?: number): string {
		switch (rank) {
			case 0:
				return 'Untrained';
			case 1:
				return 'Trained';
			case 2:
				return 'Expert';
			case 3:
				return 'Master';
			case 4:
				return 'Legendary';
			default:
				return 'Untrained';
		}
	}
</script>

<div class="class-selector">
	<div class="selector-header">
		<h2 class="selector-title">Choose Your Class</h2>
		<p class="selector-description">
			Your class represents your profession and training. It determines your hit points, key
			ability, proficiencies, and special abilities.
		</p>
	</div>

	<!-- Search -->
	<div class="selector-search">
		<input
			type="search"
			bind:value={searchQuery}
			placeholder="Search classes..."
			class="search-input"
			aria-label="Search classes"
		/>
	</div>

	<!-- Class Grid -->
	<div class="grid-container">
		<div class="class-grid">
			{#each filteredClasses as cls}
				{@const isSelected = selectedClass?.name === cls.name}

				<div class="class-card" class:selected={isSelected}>
				<div class="card-header">
					<h3 class="card-title">{cls.name}</h3>
					{#if cls.rarity && cls.rarity !== 'common'}
						<div class="card-meta">
							<span class="meta-badge">{cls.rarity}</span>
						</div>
					{/if}
				</div>

				{#if cls.description}
					<p class="card-description">
						{getExcerpt(cls.description, 150)}
					</p>
				{/if}

				<div class="card-info">
					<div class="info-section">
						<strong>Hit Points:</strong>
						{cls.hp} + Constitution modifier
					</div>

					<div class="info-section">
						<strong>Key Ability:</strong>
						{formatKeyAbility(cls.keyAbility)}
					</div>

					{#if cls.proficiencies.perception !== undefined}
						<div class="info-section">
							<strong>Perception:</strong>
							{getProficiencyLabel(cls.proficiencies.perception)}
						</div>
					{/if}

					{#if cls.skills}
						<div class="info-section">
							<strong>Skill Proficiencies:</strong>
							{#if cls.skills.trained && cls.skills.trained.length > 0}
								{cls.skills.trained.join(', ')}
								{#if cls.skills.additional}
									+ {cls.skills.additional} of your choice
								{/if}
							{:else if cls.skills.additional}
								{cls.skills.additional} of your choice
							{/if}
						</div>
					{/if}
				</div>

				<div class="card-actions">
					<Button
						variant="secondary"
						size="sm"
						onclick={(e) => {
							e.stopPropagation();
							viewDetails(cls);
						}}
					>
						Details
					</Button>

					<Button
						variant={isSelected ? 'secondary' : 'primary'}
						size="sm"
						disabled={isSelected}
						onclick={(e) => {
							e.stopPropagation();
							handleSelect(cls);
						}}
					>
						{isSelected ? 'Selected' : 'Select'}
					</Button>
				</div>
				</div>
			{/each}
		</div>
	</div>

	{#if filteredClasses.length === 0}
		<div class="empty-state">
			<p>No classes found matching "{searchQuery}".</p>
		</div>
	{/if}
</div>

<!-- Detail Modal -->
{#if selectedForDetails}
	<Modal bind:open={detailModalOpen} title={selectedForDetails.name} size="lg">
		<div class="class-detail">
			{#if selectedForDetails.description}
				<div class="detail-section">
					<h4>Description</h4>
					<RichDescription content={selectedForDetails.description} class="detail-description" />
				</div>
			{/if}

			<div class="detail-section">
				<h4>Hit Points</h4>
				<p>{selectedForDetails.hp} + Constitution modifier per level</p>
			</div>

			<div class="detail-section">
				<h4>Key Ability</h4>
				<p>{formatKeyAbility(selectedForDetails.keyAbility)}</p>
				<p class="detail-note">
					At 1st level, your class gives you an ability boost to your key ability.
				</p>
			</div>

			{#if selectedForDetails.proficiencies.perception !== undefined || selectedForDetails.proficiencies.fortitude !== undefined || selectedForDetails.proficiencies.reflex !== undefined || selectedForDetails.proficiencies.will !== undefined}
				<div class="detail-section">
					<h4>Initial Proficiencies</h4>
					<ul class="proficiency-list">
						{#if selectedForDetails.proficiencies.perception !== undefined}
							<li>
								<strong>Perception:</strong>
								{getProficiencyLabel(selectedForDetails.proficiencies.perception)}
							</li>
						{/if}
						{#if selectedForDetails.proficiencies.fortitude !== undefined}
							<li>
								<strong>Fortitude:</strong>
								{getProficiencyLabel(selectedForDetails.proficiencies.fortitude)}
							</li>
						{/if}
						{#if selectedForDetails.proficiencies.reflex !== undefined}
							<li>
								<strong>Reflex:</strong>
								{getProficiencyLabel(selectedForDetails.proficiencies.reflex)}
							</li>
						{/if}
						{#if selectedForDetails.proficiencies.will !== undefined}
							<li><strong>Will:</strong> {getProficiencyLabel(selectedForDetails.proficiencies.will)}</li>
						{/if}
					</ul>
				</div>
			{/if}

			{#if selectedForDetails.skills}
				<div class="detail-section">
					<h4>Skill Proficiencies</h4>
					{#if selectedForDetails.skills.trained && selectedForDetails.skills.trained.length > 0}
						<p>Trained in: {selectedForDetails.skills.trained.join(', ')}</p>
					{/if}
					{#if selectedForDetails.skills.additional}
						<p>Plus {selectedForDetails.skills.additional} additional skills of your choice</p>
					{/if}
				</div>
			{/if}

			{#if selectedForDetails.traits && selectedForDetails.traits.length > 0}
				<div class="detail-section">
					<h4>Traits</h4>
					<div class="trait-list">
						{#each selectedForDetails.traits as trait}
							<span class="trait-badge">{trait}</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		{#snippet footer()}
			<Button variant="secondary" onclick={() => (detailModalOpen = false)}>Close</Button>
			<Button
				variant="primary"
				disabled={selectedClass?.name === selectedForDetails?.name}
				onclick={() => {
					if (selectedForDetails) {
						handleSelect(selectedForDetails);
						detailModalOpen = false;
					}
				}}
			>
				{selectedClass?.name === selectedForDetails?.name ? 'Selected' : 'Select Class'}
			</Button>
		{/snippet}
	</Modal>
{/if}

<style>
	.class-selector {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.selector-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.selector-title {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.selector-description {
		margin: 0;
		color: var(--text-secondary, #666666);
		line-height: 1.6;
	}

	/* Search */
	.selector-search {
		width: 100%;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		font-size: 1rem;
		font-family: inherit;
		background-color: var(--surface-1, #ffffff);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--focus-color, #5c7cfa);
	}

	/* Grid Container - Scrollable */
	.grid-container {
		max-height: 700px; /* Approximately 2 rows of cards */
		overflow-y: auto;
		overflow-x: hidden;
		padding-right: 0.5rem; /* Space for scrollbar */
		margin-right: -0.5rem;
	}

	/* Grid */
	.class-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.class-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 12px;
		transition: all var(--transition-fast);
	}

	.class-card:hover {
		border-color: var(--link-color, #5c7cfa);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.class-card.selected {
		background-color: rgba(92, 124, 250, 0.1);
		border-color: var(--link-color, #5c7cfa);
		border-width: 3px;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.card-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.card-meta {
		display: flex;
		gap: 0.5rem;
	}

	.meta-badge {
		padding: 0.25rem 0.5rem;
		background-color: var(--surface-3, #e0e0e0);
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary, #666666);
		text-transform: uppercase;
	}

	.card-description {
		margin: 0;
		color: var(--text-primary, #1a1a1a);
		line-height: 1.6;
		font-size: 0.9375rem;
	}

	.card-info {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background-color: var(--surface-1, #ffffff);
		border-radius: 8px;
		font-size: 0.875rem;
	}

	.info-section {
		line-height: 1.5;
		color: var(--text-primary, #1a1a1a);
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: auto;
	}

	.empty-state {
		padding: 3rem;
		text-align: center;
		color: var(--text-secondary, #666666);
	}

	/* Detail Modal */
	.class-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
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

	.detail-note {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		font-style: italic;
	}

	.proficiency-list {
		margin: 0;
		padding-left: 1.5rem;
		color: var(--text-primary, #1a1a1a);
	}

	.proficiency-list li {
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

	/* Mobile */
	@media (max-width: 640px) {
		.class-grid {
			grid-template-columns: 1fr;
		}

		.selector-title {
			font-size: 1.5rem;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.class-card {
			border-width: 3px;
		}

		.class-card.selected {
			border-width: 4px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.class-card {
			transition: none;
		}
	}
</style>
