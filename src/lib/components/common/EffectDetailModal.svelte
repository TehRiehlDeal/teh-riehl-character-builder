<script lang="ts">
	import type { Effect } from '$lib/data/types/app';
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';
	import RichDescription from './RichDescription.svelte';

	interface Props {
		/** Whether the modal is open */
		open?: boolean;
		/** The effect to display */
		effect: Effect | null;
		/** Callback when modal is closed */
		onClose?: () => void;
	}

	let { open = $bindable(false), effect, onClose }: Props = $props();

	function handleClose() {
		open = false;
		onClose?.();
	}

	// Format duration for display
	function formatDuration(duration: Effect['duration']): string {
		if (duration.unit === 'unlimited') return 'Unlimited';
		if (duration.value === 0) return 'Instant';
		return `${duration.value} ${duration.unit}`;
	}
</script>

{#if effect}
	<Modal bind:open={open} title={effect.name} size="lg" onClose={handleClose}>
		<div class="effect-detail">
			<!-- Header Info -->
			<div class="effect-header">
				<div class="effect-meta">
					<span class="meta-badge level-badge">Level {effect.level}</span>

					{#if effect.rarity && effect.rarity !== 'common'}
						<span class="meta-badge rarity-badge rarity-{effect.rarity}">{effect.rarity}</span>
					{/if}

					{#if effect.duration.sustained}
						<span class="meta-badge sustained-badge">Sustained</span>
					{/if}

					{#if effect.tokenIcon.show}
						<span class="meta-badge token-badge">Shows on Token</span>
					{/if}
				</div>
			</div>

			<!-- Effect Stats -->
			<div class="effect-stats">
				<div class="stat-grid">
					<div class="stat-item">
						<dt class="stat-label">Duration</dt>
						<dd class="stat-value">{formatDuration(effect.duration)}</dd>
					</div>

					{#if effect.duration.expiry}
						<div class="stat-item">
							<dt class="stat-label">Expires</dt>
							<dd class="stat-value">{effect.duration.expiry}</dd>
						</div>
					{/if}

					{#if effect.start.initiative !== null}
						<div class="stat-item">
							<dt class="stat-label">Start Initiative</dt>
							<dd class="stat-value">{effect.start.initiative}</dd>
						</div>
					{/if}
				</div>
			</div>

			<!-- Description -->
			<div class="detail-section">
				<h4>Effect</h4>
				<RichDescription content={effect.description} class="effect-description-content" />
			</div>

			<!-- Traits -->
			{#if effect.traits && effect.traits.length > 0}
				<div class="detail-section">
					<h4>Traits</h4>
					<div class="trait-list">
						{#each effect.traits as trait}
							<span class="trait-badge">{trait}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Source -->
			{#if effect.source}
				<div class="detail-section source-section">
					<p class="source-text">
						<strong>Source:</strong>
						{effect.source.title}
						{#if effect.source.remaster}
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
	.effect-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.effect-header {
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.effect-meta {
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

	.level-badge {
		background-color: rgba(51, 154, 240, 0.1);
		color: #1971c2;
		border: 1px solid rgba(51, 154, 240, 0.3);
	}

	.sustained-badge {
		background-color: rgba(250, 176, 5, 0.1);
		color: #c77700;
		border: 1px solid rgba(250, 176, 5, 0.3);
	}

	.token-badge {
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

	.effect-stats {
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
		padding: 1rem;
	}

	.stat-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
		display: flex;
		align-items: center;
		gap: 0.5rem;
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
	.effect-detail :global(.effect-description-content) {
		color: var(--text-primary, #1a1a1a);
	}
</style>
