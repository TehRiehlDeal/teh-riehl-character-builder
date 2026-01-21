<script lang="ts">
	import type { Action } from '$lib/data/types/app';
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';
	import RichDescription from './RichDescription.svelte';

	interface Props {
		/** Whether the modal is open */
		open?: boolean;
		/** The action to display */
		action: Action | null;
		/** Callback when modal is closed */
		onClose?: () => void;
	}

	let { open = $bindable(false), action, onClose }: Props = $props();

	function handleClose() {
		open = false;
		onClose?.();
	}

	// Get action icon based on action type and count
	function getActionIcon(actionType: string, actions?: number): string {
		if (actionType === 'reaction') return '↩️';
		if (actionType === 'free') return '⚡';
		if (actionType === 'passive') return '—';

		if (actions === 1) return '◆';
		if (actions === 2) return '◆◆';
		if (actions === 3) return '◆◆◆';

		return '';
	}

	// Get action type label
	function getActionTypeLabel(actionType: string, actions?: number): string {
		if (actionType === 'reaction') return 'Reaction';
		if (actionType === 'free') return 'Free Action';
		if (actionType === 'passive') return 'Passive';

		if (actions) {
			return `${actions} ${actions === 1 ? 'Action' : 'Actions'}`;
		}

		return 'Action';
	}
</script>

{#if action}
	<Modal bind:open={open} title={action.name} size="lg" onClose={handleClose}>
		<div class="action-detail">
			<!-- Header Info -->
			<div class="action-header">
				<div class="action-meta">
					<span class="meta-badge action-badge">
						<span class="action-icon">{getActionIcon(action.actionType, action.actions)}</span>
						{getActionTypeLabel(action.actionType, action.actions)}
					</span>

					{#if action.category}
						<span class="meta-badge category-badge">{action.category}</span>
					{/if}

					{#if action.rarity && action.rarity !== 'common'}
						<span class="meta-badge rarity-badge rarity-{action.rarity}">{action.rarity}</span>
					{/if}
				</div>
			</div>

			<!-- Requirements & Trigger -->
			{#if action.requirements || action.trigger}
				<div class="action-conditions">
					{#if action.requirements}
						<div class="condition-item">
							<dt class="condition-label">Requirements</dt>
							<dd class="condition-value">{action.requirements}</dd>
						</div>
					{/if}

					{#if action.trigger}
						<div class="condition-item">
							<dt class="condition-label">Trigger</dt>
							<dd class="condition-value">{action.trigger}</dd>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Description -->
			<div class="detail-section">
				<h4>Description</h4>
				<RichDescription content={action.description} class="action-description-content" />
			</div>

			<!-- Traits -->
			{#if action.traits && action.traits.length > 0}
				<div class="detail-section">
					<h4>Traits</h4>
					<div class="trait-list">
						{#each action.traits as trait}
							<span class="trait-badge">{trait}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Source -->
			{#if action.source}
				<div class="detail-section source-section">
					<p class="source-text">
						<strong>Source:</strong>
						{action.source.title}
						{#if action.source.remaster}
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
	.action-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.action-header {
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.action-meta {
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

	.action-badge {
		background-color: rgba(92, 124, 250, 0.1);
		color: #5c7cfa;
		border: 1px solid rgba(92, 124, 250, 0.3);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.action-icon {
		font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
		font-weight: bold;
		font-size: 1.1em;
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

	.action-conditions {
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.condition-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.condition-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary, #666);
		margin: 0;
	}

	.condition-value {
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
	.action-detail :global(.action-description-content) {
		color: var(--text-primary, #1a1a1a);
	}
</style>
