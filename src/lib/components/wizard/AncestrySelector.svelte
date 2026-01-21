<script lang="ts">
	import type { Ancestry, AbilityBoost, AbilityFlaw } from '$lib/data/types/app';
	import Button from '../common/Button.svelte';
	import Modal from '../common/Modal.svelte';
	import RichDescription from '../common/RichDescription.svelte';

	interface Props {
		/** Available ancestries */
		ancestries: Ancestry[];
		/** Currently selected ancestry */
		selectedAncestry?: Ancestry | null;
		/** Callback when ancestry is selected */
		// eslint-disable-next-line no-unused-vars
		onSelect?: (ancestry: Ancestry) => void;
	}

	let { ancestries, selectedAncestry = null, onSelect }: Props = $props();

	let detailModalOpen = $state(false);
	let selectedForDetails: Ancestry | null = $state(null);
	let searchQuery = $state('');

	// Filter ancestries by search
	const filteredAncestries = $derived.by(() => {
		if (!searchQuery) return ancestries;
		return ancestries.filter((ancestry) =>
			ancestry.name.toLowerCase().includes(searchQuery.toLowerCase())
		);
	});

	function handleSelect(ancestry: Ancestry) {
		onSelect?.(ancestry);
	}

	function viewDetails(ancestry: Ancestry) {
		selectedForDetails = ancestry;
		detailModalOpen = true;
	}

	// Ability name mapping from short form to full name
	const abilityNames: Record<string, string> = {
		str: 'Strength',
		dex: 'Dexterity',
		con: 'Constitution',
		int: 'Intelligence',
		wis: 'Wisdom',
		cha: 'Charisma'
	};

	function formatAbilityName(ability: string): string {
		return abilityNames[ability.toLowerCase()] || ability;
	}

	function formatAbilityBoosts(boosts: AbilityBoost[]): string {
		if (!boosts || boosts.length === 0) {
			return 'None';
		}

		const formatted = boosts.map((boost) => {
			if (boost.free) {
				return 'Free';
			} else if (boost.options.length === 1) {
				return formatAbilityName(boost.options[0]);
			} else {
				return boost.options.map(formatAbilityName).join(' or ');
			}
		});

		return formatted.join(', ');
	}

	function formatAbilityFlaws(flaws: AbilityFlaw[]): string {
		if (!flaws || flaws.length === 0) {
			return 'None';
		}

		const formatted = flaws.map((flaw) => {
			if (flaw.options.length === 1) {
				return formatAbilityName(flaw.options[0]);
			} else {
				return flaw.options.map(formatAbilityName).join(' or ');
			}
		});

		return formatted.join(', ');
	}
</script>

<div class="ancestry-selector">
	<div class="selector-header">
		<h2 class="selector-title">Choose Your Ancestry</h2>
		<p class="selector-description">
			Your ancestry determines your size, speed, languages, and special abilities. You also gain
			ability boosts and possibly ability flaws.
		</p>
	</div>

	<!-- Search -->
	<div class="selector-search">
		<input
			type="search"
			bind:value={searchQuery}
			placeholder="Search ancestries..."
			class="search-input"
			aria-label="Search ancestries"
		/>
	</div>

	<!-- Ancestry Grid -->
	<div class="grid-container">
		<div class="ancestry-grid">
			{#each filteredAncestries as ancestry}
				{@const isSelected = selectedAncestry?.name === ancestry.name}

				<div class="ancestry-card" class:selected={isSelected}>
				<div class="card-header">
					<h3 class="card-title">{ancestry.name}</h3>
					<div class="card-meta">
						<span class="meta-badge">{ancestry.rarity || 'Common'}</span>
					</div>
				</div>

				<div class="card-stats">
					<div class="stat-item">
						<span class="stat-label">HP</span>
						<span class="stat-value">{ancestry.hp}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Size</span>
						<span class="stat-value">{ancestry.size}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Speed</span>
						<span class="stat-value">{ancestry.speed} ft</span>
					</div>
				</div>

				<div class="card-boosts">
					<div class="boost-section">
						<strong>Ability Boosts:</strong>
						{formatAbilityBoosts(ancestry.boosts)}
					</div>
					{#if ancestry.flaws && ancestry.flaws.length > 0}
						<div class="flaw-section">
							<strong>Ability Flaws:</strong>
							{formatAbilityFlaws(ancestry.flaws)}
						</div>
					{/if}
				</div>

				<div class="card-actions">
					<Button
						variant="secondary"
						size="sm"
						onclick={(e) => {
							e.stopPropagation();
							viewDetails(ancestry);
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
							handleSelect(ancestry);
						}}
					>
						{isSelected ? 'Selected' : 'Select'}
					</Button>
				</div>
				</div>
			{/each}
		</div>
	</div>

	{#if filteredAncestries.length === 0}
		<div class="empty-state">
			<p>No ancestries found matching "{searchQuery}".</p>
		</div>
	{/if}
</div>

<!-- Detail Modal -->
{#if selectedForDetails}
	<Modal bind:open={detailModalOpen} title={selectedForDetails.name} size="lg">
		<div class="ancestry-detail">
			<div class="detail-section">
				<h4>Statistics</h4>
				<dl class="detail-stats">
					<div class="stat-row">
						<dt>Hit Points</dt>
						<dd>{selectedForDetails.hp}</dd>
					</div>
					<div class="stat-row">
						<dt>Size</dt>
						<dd>{selectedForDetails.size}</dd>
					</div>
					<div class="stat-row">
						<dt>Speed</dt>
						<dd>{selectedForDetails.speed} feet</dd>
					</div>
					<div class="stat-row">
						<dt>Rarity</dt>
						<dd>{selectedForDetails.rarity || 'Common'}</dd>
					</div>
				</dl>
			</div>

			<div class="detail-section">
				<h4>Description</h4>
				<RichDescription content={selectedForDetails.description} />
			</div>

			<div class="detail-section">
				<h4>Ability Boosts and Flaws</h4>
				<div class="ability-info">
					<p><strong>Boosts:</strong> {formatAbilityBoosts(selectedForDetails.boosts)}</p>
					{#if selectedForDetails.flaws && selectedForDetails.flaws.length > 0}
						<p><strong>Flaws:</strong> {formatAbilityFlaws(selectedForDetails.flaws)}</p>
					{/if}
				</div>
			</div>

			{#if selectedForDetails.languages && selectedForDetails.languages.length > 0}
				<div class="detail-section">
					<h4>Languages</h4>
					<p>{selectedForDetails.languages.join(', ')}</p>
				</div>
			{/if}

			{#if selectedForDetails.additionalLanguages && selectedForDetails.additionalLanguages.count > 0}
				<div class="detail-section">
					<h4>Additional Languages</h4>
					<p>Choose {selectedForDetails.additionalLanguages.count} from: {selectedForDetails.additionalLanguages.options.join(', ')}</p>
				</div>
			{/if}

			{#if selectedForDetails.vision && selectedForDetails.vision !== 'normal'}
				<div class="detail-section">
					<h4>Vision</h4>
					<p>{selectedForDetails.vision === 'low-light-vision' ? 'Low-Light Vision' : selectedForDetails.vision === 'darkvision' ? 'Darkvision' : selectedForDetails.vision}</p>
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
				disabled={selectedAncestry?.name === selectedForDetails?.name}
				onclick={() => {
					if (selectedForDetails) {
						handleSelect(selectedForDetails);
						detailModalOpen = false;
					}
				}}
			>
				{selectedAncestry?.name === selectedForDetails?.name ? 'Selected' : 'Select Ancestry'}
			</Button>
		{/snippet}
	</Modal>
{/if}

<style>
	.ancestry-selector {
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
	.ancestry-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.ancestry-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 12px;
		transition: all var(--transition-fast);
	}

	.ancestry-card:hover {
		border-color: var(--link-color, #5c7cfa);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.ancestry-card.selected {
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

	.card-stats {
		display: flex;
		gap: 1rem;
		padding: 0.75rem;
		background-color: var(--surface-1, #ffffff);
		border-radius: 8px;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary, #666666);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.card-boosts {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.boost-section {
		color: var(--text-primary, #1a1a1a);
	}

	.flaw-section {
		color: #f03e3e;
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
	.ancestry-detail {
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

	.detail-stats {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 4px;
	}

	.stat-row dt {
		font-weight: 600;
		color: var(--text-secondary, #666666);
	}

	.stat-row dd {
		margin: 0;
		color: var(--text-primary, #1a1a1a);
	}

	.ability-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.ability-info p {
		margin: 0;
		color: var(--text-primary, #1a1a1a);
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
		.ancestry-grid {
			grid-template-columns: 1fr;
		}

		.selector-title {
			font-size: 1.5rem;
		}

		.card-stats {
			flex-wrap: wrap;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.ancestry-card {
			border-width: 3px;
		}

		.ancestry-card.selected {
			border-width: 4px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.ancestry-card {
			transition: none;
		}
	}
</style>
