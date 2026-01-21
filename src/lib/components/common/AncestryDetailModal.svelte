<script lang="ts">
	import type { Ancestry } from '$lib/data/types/app';
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';
	import RichDescription from './RichDescription.svelte';

	interface Props {
		/** Whether the modal is open */
		open?: boolean;
		/** The ancestry to display */
		ancestry: Ancestry | null;
		/** Callback when modal is closed */
		onClose?: () => void;
	}

	let { open = $bindable(false), ancestry, onClose }: Props = $props();

	function handleClose() {
		open = false;
		onClose?.();
	}

	// Format size for display
	function formatSize(size: string): string {
		const sizeMap: Record<string, string> = {
			tiny: 'Tiny',
			sm: 'Small',
			med: 'Medium',
			lg: 'Large',
			huge: 'Huge',
			grg: 'Gargantuan'
		};
		return sizeMap[size] || size;
	}

	// Format vision for display
	function formatVision(vision: string): string {
		const visionMap: Record<string, string> = {
			normal: 'Normal Vision',
			'low-light-vision': 'Low-Light Vision',
			darkvision: 'Darkvision'
		};
		return visionMap[vision] || vision;
	}

	// Format ability boosts
	function formatBoosts(boosts: Ancestry['boosts']): string {
		return boosts
			.map((boost) => {
				if (boost.free) {
					return 'Free';
				}
				return boost.options.join(' or ').toUpperCase();
			})
			.join(', ');
	}

	// Format ability flaws
	function formatFlaws(flaws: Ancestry['flaws']): string {
		if (!flaws || flaws.length === 0) return 'None';
		return flaws
			.map((flaw) => {
				return flaw.options.join(' or ').toUpperCase();
			})
			.join(', ');
	}
</script>

{#if ancestry}
	<Modal bind:open={open} title={ancestry.name} size="lg" onClose={handleClose}>
		<div class="ancestry-detail">
			<!-- Header Info -->
			<div class="ancestry-header">
				<div class="ancestry-meta">
					<span class="meta-badge size-badge">{formatSize(ancestry.size)}</span>
					{#if ancestry.rarity && ancestry.rarity !== 'common'}
						<span class="meta-badge rarity-badge rarity-{ancestry.rarity}">{ancestry.rarity}</span>
					{/if}
				</div>
			</div>

			<!-- Ancestry Stats -->
			<div class="ancestry-stats">
				<div class="stat-grid">
					<div class="stat-item">
						<dt class="stat-label">Hit Points</dt>
						<dd class="stat-value">{ancestry.hp}</dd>
					</div>

					<div class="stat-item">
						<dt class="stat-label">Size</dt>
						<dd class="stat-value">{formatSize(ancestry.size)}</dd>
					</div>

					<div class="stat-item">
						<dt class="stat-label">Speed</dt>
						<dd class="stat-value">{ancestry.speed} feet</dd>
					</div>

					<div class="stat-item">
						<dt class="stat-label">Vision</dt>
						<dd class="stat-value">{formatVision(ancestry.vision)}</dd>
					</div>
				</div>
			</div>

			<!-- Ability Boosts & Flaws -->
			<div class="detail-section">
				<h4>Ability Boosts</h4>
				<p class="ability-text">{formatBoosts(ancestry.boosts)}</p>
			</div>

			{#if ancestry.flaws && ancestry.flaws.length > 0}
				<div class="detail-section">
					<h4>Ability Flaws</h4>
					<p class="ability-text flaw-text">{formatFlaws(ancestry.flaws)}</p>
				</div>
			{/if}

			<!-- Languages -->
			<div class="detail-section">
				<h4>Languages</h4>
				<p class="languages-text">
					{#if ancestry.languages.length > 0}
						{ancestry.languages.join(', ')}
					{:else}
						None
					{/if}
				</p>
				{#if ancestry.additionalLanguages.count > 0}
					<p class="additional-languages">
						<strong>Additional Languages:</strong>
						{ancestry.additionalLanguages.count}
						{#if ancestry.additionalLanguages.options.length > 0}
							from {ancestry.additionalLanguages.options.join(', ')}
						{:else}
							of your choice
						{/if}
					</p>
				{/if}
			</div>

			<!-- Description -->
			<div class="detail-section">
				<h4>Description</h4>
				<RichDescription content={ancestry.description} class="ancestry-description-content" />
			</div>

			<!-- Traits -->
			{#if ancestry.traits && ancestry.traits.length > 0}
				<div class="detail-section">
					<h4>Traits</h4>
					<div class="trait-list">
						{#each ancestry.traits as trait}
							<span class="trait-badge">{trait}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Source -->
			{#if ancestry.source}
				<div class="detail-section source-section">
					<p class="source-text">
						<strong>Source:</strong>
						{ancestry.source.title}
						{#if ancestry.source.remaster}
							<span class="remaster-badge" title="Remastered content">Remaster</span>
						{/if}
					</p>
				</div>
			{/if}
		</div>

		{#snippet footer()}
			<Button variant="secondary" onclick={handleClose}>Close</Button>
		{/snippet}
	</Modal>
{/if}

<style>
	.ancestry-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.ancestry-header {
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.ancestry-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.meta-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		border-radius: 4px;
		text-transform: capitalize;
	}

	.size-badge {
		background-color: rgba(55, 178, 77, 0.1);
		color: #2f9e44;
		border: 1px solid rgba(55, 178, 77, 0.3);
	}

	.rarity-badge {
		border: 1px solid currentColor;
	}

	.rarity-badge.rarity-uncommon {
		background-color: rgba(250, 176, 5, 0.1);
		color: #c77700;
	}

	.rarity-badge.rarity-rare {
		background-color: rgba(240, 62, 62, 0.1);
		color: #e03131;
	}

	.rarity-badge.rarity-unique {
		background-color: rgba(174, 62, 201, 0.1);
		color: #ae3ec9;
	}

	.ancestry-stats {
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
		padding: 1rem;
	}

	.stat-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary, #666);
		margin: 0;
	}

	.stat-value {
		font-size: 0.875rem;
		color: var(--text-primary, #1a1a1a);
		margin: 0;
	}

	.detail-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.detail-section h4 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		border-bottom: 1px solid var(--border-color, #e0e0e0);
		padding-bottom: 0.25rem;
	}

	.ability-text {
		margin: 0;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.flaw-text {
		color: #e03131;
	}

	.languages-text {
		margin: 0;
		color: var(--text-primary, #1a1a1a);
		text-transform: capitalize;
	}

	.additional-languages {
		margin: 0.5rem 0 0 0;
		color: var(--text-secondary, #666);
		font-size: 0.875rem;
	}

	.trait-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.trait-badge {
		display: inline-block;
		padding: 0.25rem 0.625rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 4px;
		font-size: 0.875rem;
		color: var(--text-secondary, #666);
		text-transform: lowercase;
	}

	.source-section {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}

	.source-text {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary, #666);
	}

	.remaster-badge {
		display: inline-block;
		margin-left: 0.5rem;
		padding: 0.125rem 0.5rem;
		background-color: rgba(55, 178, 77, 0.1);
		color: #2f9e44;
		border: 1px solid rgba(55, 178, 77, 0.3);
		border-radius: 3px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	/* Ensure nested RichDescription styles work */
	.ancestry-detail :global(.ancestry-description-content) {
		color: var(--text-primary, #1a1a1a);
	}
</style>
