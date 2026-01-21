<script lang="ts">
	import type { Background } from '$lib/data/types/app';
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';
	import RichDescription from './RichDescription.svelte';

	interface Props {
		/** Whether the modal is open */
		open?: boolean;
		/** The background to display */
		background: Background | null;
		/** Callback when modal is closed */
		onClose?: () => void;
	}

	let { open = $bindable(false), background, onClose }: Props = $props();

	function handleClose() {
		open = false;
		onClose?.();
	}

	// Format ability boosts
	function formatBoosts(boosts: Background['boosts']): string {
		return boosts
			.map((boost) => {
				if (boost.free) {
					return 'Free';
				}
				return boost.options.join(' or ').toUpperCase();
			})
			.join(', ');
	}
</script>

{#if background}
	<Modal bind:open={open} title={background.name} size="lg" onClose={handleClose}>
		<div class="background-detail">
			<!-- Header Info -->
			<div class="background-header">
				<div class="background-meta">
					{#if background.rarity && background.rarity !== 'common'}
						<span class="meta-badge rarity-badge rarity-{background.rarity}">{background.rarity}</span>
					{/if}
				</div>
			</div>

			<!-- Ability Boosts -->
			<div class="detail-section">
				<h4>Ability Boosts</h4>
				<p class="ability-text">{formatBoosts(background.boosts)}</p>
			</div>

			<!-- Trained Skills -->
			{#if background.trainedSkills && background.trainedSkills.length > 0}
				<div class="detail-section">
					<h4>Trained Skills</h4>
					<p class="skills-text">
						{background.trainedSkills.join(', ')}
					</p>
				</div>
			{/if}

			<!-- Description -->
			<div class="detail-section">
				<h4>Description</h4>
				<RichDescription content={background.description} class="background-description-content" />
			</div>

			<!-- Traits -->
			{#if background.traits && background.traits.length > 0}
				<div class="detail-section">
					<h4>Traits</h4>
					<div class="trait-list">
						{#each background.traits as trait}
							<span class="trait-badge">{trait}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Source -->
			{#if background.source}
				<div class="detail-section source-section">
					<p class="source-text">
						<strong>Source:</strong>
						{background.source.title}
						{#if background.source.remaster}
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
	.background-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.background-header {
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.background-meta {
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

	.ability-text {
		margin: 0;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.skills-text {
		margin: 0;
		color: var(--text-primary, #1a1a1a);
		text-transform: capitalize;
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
	.background-detail :global(.background-description-content) {
		color: var(--text-primary, #1a1a1a);
	}
</style>
