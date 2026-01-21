<script lang="ts">
	import type { Condition } from '$lib/data/types/app';
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';
	import RichDescription from './RichDescription.svelte';

	interface Props {
		/** Whether the modal is open */
		open?: boolean;
		/** The condition to display */
		condition: Condition | null;
		/** Callback when modal is closed */
		onClose?: () => void;
	}

	let { open = $bindable(false), condition, onClose }: Props = $props();

	function handleClose() {
		open = false;
		onClose?.();
	}

	// Format duration for display
	function formatDuration(duration?: Condition['duration']): string {
		if (!duration) return 'Unlimited';
		if (duration.text) return duration.text;
		if (duration.unit === 'unlimited') return 'Unlimited';
		return `${duration.value} ${duration.unit}`;
	}
</script>

{#if condition}
	<Modal bind:open={open} title={condition.name} size="lg" onClose={handleClose}>
		<div class="condition-detail">
			<!-- Header Info -->
			<div class="condition-header">
				<div class="condition-meta">
					{#if condition.value?.isValued}
						<span class="meta-badge valued-badge">
							Valued Condition (Current: {condition.value.value})
						</span>
					{/if}

					{#if condition.rarity && condition.rarity !== 'common'}
						<span class="meta-badge rarity-badge rarity-{condition.rarity}">{condition.rarity}</span>
					{/if}

					{#if condition.removable}
						<span class="meta-badge removable-badge">Removable</span>
					{/if}
				</div>
			</div>

			<!-- Condition Stats -->
			<div class="condition-stats">
				<div class="stat-grid">
					<div class="stat-item">
						<dt class="stat-label">Duration</dt>
						<dd class="stat-value">{formatDuration(condition.duration)}</dd>
					</div>

					{#if condition.value?.isValued}
						<div class="stat-item">
							<dt class="stat-label">Value</dt>
							<dd class="stat-value">
								{condition.value.value}
								{#if condition.value.immutable}
									<span class="immutable-badge">immutable</span>
								{/if}
							</dd>
						</div>
					{/if}
				</div>
			</div>

			<!-- Description -->
			<div class="detail-section">
				<h4>Effect</h4>
				<RichDescription content={condition.description} class="condition-description-content" />
			</div>

			<!-- Overrides -->
			{#if condition.overrides && condition.overrides.length > 0}
				<div class="detail-section">
					<h4>Overrides</h4>
					<p class="overrides-text">
						This condition overrides: {condition.overrides.join(', ')}
					</p>
				</div>
			{/if}

			<!-- Traits -->
			{#if condition.traits && condition.traits.length > 0}
				<div class="detail-section">
					<h4>Traits</h4>
					<div class="trait-list">
						{#each condition.traits as trait}
							<span class="trait-badge">{trait}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Source -->
			{#if condition.source}
				<div class="detail-section source-section">
					<p class="source-text">
						<strong>Source:</strong>
						{condition.source.title}
						{#if condition.source.remaster}
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
	.condition-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.condition-header {
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.condition-meta {
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

	.valued-badge {
		background-color: rgba(174, 62, 201, 0.1);
		color: #ae3ec9;
		border: 1px solid rgba(174, 62, 201, 0.3);
	}

	.removable-badge {
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

	.condition-stats {
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

	.immutable-badge {
		display: inline-block;
		padding: 0.125rem 0.375rem;
		background-color: rgba(240, 62, 62, 0.1);
		color: #e03131;
		border: 1px solid rgba(240, 62, 62, 0.3);
		border-radius: 3px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
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

	.overrides-text {
		margin: 0;
		color: var(--text-primary, #1a1a1a);
		font-style: italic;
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
	.condition-detail :global(.condition-description-content) {
		color: var(--text-primary, #1a1a1a);
	}
</style>
