<script lang="ts">
	import type { Feat } from '$lib/data/types/app';
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';
	import RichDescription from './RichDescription.svelte';

	interface Props {
		/** Whether the modal is open */
		open?: boolean;
		/** The feat to display */
		feat: Feat | null;
		/** Callback when modal is closed */
		onClose?: () => void;
	}

	let { open = $bindable(false), feat, onClose }: Props = $props();

	function handleClose() {
		open = false;
		onClose?.();
	}

	// Format prerequisites for display
	function formatPrerequisites(prerequisites: string[]): string {
		if (!prerequisites || prerequisites.length === 0) {
			return 'None';
		}
		return prerequisites.join(', ');
	}

	// Format action type with icons
	function getActionIcon(actionType?: string, actions?: number): string {
		if (!actionType || actionType === 'passive') return '';

		if (actionType === 'free') return '⚡'; // Free action
		if (actionType === 'reaction') return '↩️'; // Reaction

		// Action with specific number
		if (actionType === 'action' && actions) {
			return '◆'.repeat(actions); // Pathfinder action symbols
		}

		return '';
	}
</script>

{#if feat}
	<Modal bind:open={open} title={feat.name} size="lg" onClose={handleClose}>
		<div class="feat-detail">
			<!-- Header Info -->
			<div class="feat-header">
				<div class="feat-meta">
					<span class="meta-badge level-badge">Level {feat.level}</span>
					<span class="meta-badge category-badge">{feat.category}</span>
					{#if feat.rarity && feat.rarity !== 'common'}
						<span class="meta-badge rarity-badge rarity-{feat.rarity}">{feat.rarity}</span>
					{/if}
					{#if feat.actionType && feat.actionType !== 'passive'}
						<span class="meta-badge action-badge" title="{feat.actionType}">
							{getActionIcon(feat.actionType, feat.actions)}
							{feat.actionType}
						</span>
					{/if}
				</div>
			</div>

			<!-- Prerequisites -->
			{#if feat.prerequisites && feat.prerequisites.length > 0}
				<div class="detail-section">
					<h4>Prerequisites</h4>
					<p class="prerequisites-text">{formatPrerequisites(feat.prerequisites)}</p>
				</div>
			{/if}

			<!-- Description -->
			<div class="detail-section">
				<h4>Description</h4>
				<RichDescription content={feat.description} class="feat-description-content" />
			</div>

			<!-- Traits -->
			{#if feat.traits && feat.traits.length > 0}
				<div class="detail-section">
					<h4>Traits</h4>
					<div class="trait-list">
						{#each feat.traits as trait}
							<span class="trait-badge">{trait}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Source -->
			{#if feat.source}
				<div class="detail-section source-section">
					<p class="source-text">
						<strong>Source:</strong> {feat.source.title}
						{#if feat.source.remaster}
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
	.feat-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.feat-header {
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.feat-meta {
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
		background-color: rgba(92, 124, 250, 0.1);
		color: #5c7cfa;
		border: 1px solid rgba(92, 124, 250, 0.3);
	}

	.category-badge {
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

	.action-badge {
		background-color: rgba(240, 62, 62, 0.1);
		color: #e03131;
		border: 1px solid rgba(240, 62, 62, 0.3);
		font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
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

	.prerequisites-text {
		margin: 0;
		color: var(--text-secondary, #666);
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
	.feat-detail :global(.feat-description-content) {
		color: var(--text-primary, #1a1a1a);
	}
</style>
