<script lang="ts">
	import type { Heritage } from '$lib/data/types/app';
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';
	import RichDescription from './RichDescription.svelte';

	interface Props {
		/** Whether the modal is open */
		open?: boolean;
		/** The heritage to display */
		heritage: Heritage | null;
		/** Callback when modal is closed */
		onClose?: () => void;
	}

	let { open = $bindable(false), heritage, onClose }: Props = $props();

	function handleClose() {
		open = false;
		onClose?.();
	}
</script>

{#if heritage}
	<Modal bind:open={open} title={heritage.name} size="lg" onClose={handleClose}>
		<div class="heritage-detail">
			<!-- Header Info -->
			<div class="heritage-header">
				<div class="heritage-meta">
					<span class="meta-badge ancestry-badge">{heritage.ancestry}</span>
					{#if heritage.rarity && heritage.rarity !== 'common'}
						<span class="meta-badge rarity-badge rarity-{heritage.rarity}">{heritage.rarity}</span>
					{/if}
				</div>
			</div>

			<!-- Description -->
			<div class="detail-section">
				<h4>Description</h4>
				<RichDescription content={heritage.description} class="heritage-description-content" />
			</div>

			<!-- Traits -->
			{#if heritage.traits && heritage.traits.length > 0}
				<div class="detail-section">
					<h4>Traits</h4>
					<div class="trait-list">
						{#each heritage.traits as trait}
							<span class="trait-badge">{trait}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Source -->
			{#if heritage.source}
				<div class="detail-section source-section">
					<p class="source-text">
						<strong>Source:</strong>
						{heritage.source.title}
						{#if heritage.source.remaster}
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
	.heritage-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.heritage-header {
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.heritage-meta {
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

	.ancestry-badge {
		background-color: rgba(92, 124, 250, 0.1);
		color: #5c7cfa;
		border: 1px solid rgba(92, 124, 250, 0.3);
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
	.heritage-detail :global(.heritage-description-content) {
		color: var(--text-primary, #1a1a1a);
	}
</style>
