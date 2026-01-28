<script lang="ts">
	import type { Background } from '$lib/data/types/app';
	import Button from '../common/Button.svelte';
	import Modal from '../common/Modal.svelte';
	import RichDescription from '../common/RichDescription.svelte';
	import { getExcerpt } from '$lib/utils/descriptionParser';

	interface Props {
		/** Available backgrounds */
		backgrounds: Background[];
		/** Currently selected background */
		selectedBackground?: Background | null;
		/** Callback when background is selected */
		// eslint-disable-next-line no-unused-vars
		onSelect?: (background: Background) => void;
	}

	let { backgrounds, selectedBackground = null, onSelect }: Props = $props();

	let detailModalOpen = $state(false);
	let selectedForDetails: Background | null = $state(null);
	let searchQuery = $state('');

	// Filter backgrounds by search
	const filteredBackgrounds = $derived.by(() => {
		if (!searchQuery) return backgrounds;
		return backgrounds.filter((background) =>
			background.name.toLowerCase().includes(searchQuery.toLowerCase())
		);
	});

	function handleSelect(background: Background) {
		onSelect?.(background);
	}

	function viewDetails(background: Background) {
		selectedForDetails = background;
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

	function formatAbilityBoosts(boosts?: { index: number; options: string[]; free: boolean }[]): string {
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
</script>

<div class="background-selector">
	<div class="selector-header">
		<h2 class="selector-title">Choose Your Background</h2>
		<p class="selector-description">
			Your background represents your life before becoming an adventurer. It grants ability boosts,
			skill training, and sometimes a feat.
		</p>
	</div>

	<!-- Search -->
	<div class="selector-search">
		<input
			type="search"
			bind:value={searchQuery}
			placeholder="Search backgrounds..."
			class="search-input"
			aria-label="Search backgrounds"
		/>
	</div>

	<!-- Background Grid -->
	<div class="grid-container">
		<div class="background-grid">
			{#each filteredBackgrounds as background}
				{@const isSelected = selectedBackground?.name === background.name}

				<div class="background-card" class:selected={isSelected}>
				<div class="card-header">
					<h3 class="card-title">{background.name}</h3>
					{#if background.rarity && background.rarity !== 'common'}
						<div class="card-meta">
							<span class="meta-badge">{background.rarity}</span>
						</div>
					{/if}
				</div>

				{#if background.description}
					<p class="card-description">
						{getExcerpt(background.description, 150)}
					</p>
				{/if}

				<div class="card-info">
					<div class="info-section">
						<strong>Ability Boosts:</strong>
						{formatAbilityBoosts(background.boosts)}
					</div>

					{#if background.trainedSkills && background.trainedSkills.length > 0}
						<div class="info-section">
							<strong>Skill Training:</strong>
							{background.trainedSkills.join(', ')}
						</div>
					{/if}

					{#if background.trainedLore && background.trainedLore.length > 0}
						<div class="info-section">
							<strong>Lore:</strong>
							{background.trainedLore.join(', ')}
						</div>
					{/if}

					<!--
					{#if background.feat}
						<div class="info-section feat-info">
							<strong>Feat:</strong>
							{background.feat}
						</div>
					{/if}
					-->
				</div>

				<div class="card-actions">
					<Button
						variant="secondary"
						size="sm"
						onclick={(e) => {
							e.stopPropagation();
							viewDetails(background);
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
							handleSelect(background);
						}}
					>
						{isSelected ? 'Selected' : 'Select'}
					</Button>
				</div>
				</div>
			{/each}
		</div>
	</div>

	{#if filteredBackgrounds.length === 0}
		<div class="empty-state">
			<p>No backgrounds found matching "{searchQuery}".</p>
		</div>
	{/if}
</div>

<!-- Detail Modal -->
{#if selectedForDetails}
	<Modal bind:open={detailModalOpen} title={selectedForDetails.name} size="lg">
		<div class="background-detail">
			{#if selectedForDetails.description}
				<div class="detail-section">
					<h4>Description</h4>
					<RichDescription content={selectedForDetails.description} class="detail-description" />
				</div>
			{/if}

			<div class="detail-section">
				<h4>Ability Boosts</h4>
				<p>{formatAbilityBoosts(selectedForDetails.boosts)}</p>
			</div>

			{#if selectedForDetails.trainedSkills && selectedForDetails.trainedSkills.length > 0}
				<div class="detail-section">
					<h4>Skill Training</h4>
					<ul class="skill-list">
						{#each selectedForDetails.trainedSkills as skill}
							<li>{skill}</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if selectedForDetails.trainedLore && selectedForDetails.trainedLore.length > 0}
				<div class="detail-section">
					<h4>Lore Skills</h4>
					<ul class="skill-list">
						{#each selectedForDetails.trainedLore as lore}
							<li>{lore}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!--
			{#if selectedForDetails.feat}
				<div class="detail-section">
					<h4>Background Feat</h4>
					<p>{selectedForDetails.feat}</p>
				</div>
			{/if}
			-->

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
				disabled={selectedBackground?.name === selectedForDetails?.name}
				onclick={() => {
					if (selectedForDetails) {
						handleSelect(selectedForDetails);
						detailModalOpen = false;
					}
				}}
			>
				{selectedBackground?.name === selectedForDetails?.name ? 'Selected' : 'Select Background'}
			</Button>
		{/snippet}
	</Modal>
{/if}

<style>
	.background-selector {
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
	.background-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.background-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 12px;
		transition: all var(--transition-fast);
	}

	.background-card:hover {
		border-color: var(--link-color, #5c7cfa);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.background-card.selected {
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
	.background-detail {
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

	.skill-list {
		margin: 0;
		padding-left: 1.5rem;
		color: var(--text-primary, #1a1a1a);
	}

	.skill-list li {
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
		.background-grid {
			grid-template-columns: 1fr;
		}

		.selector-title {
			font-size: 1.5rem;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.background-card {
			border-width: 3px;
		}

		.background-card.selected {
			border-width: 4px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.background-card {
			transition: none;
		}
	}
</style>
