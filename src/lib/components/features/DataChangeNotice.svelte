<script lang="ts">
	/**
	 * DataChangeNotice Component
	 *
	 * Displays a notification when the character was created with an older data version.
	 * Shows changelog and allows user to acknowledge the update or keep the old version.
	 *
	 * Usage:
	 * <DataChangeNotice {character} {onUpdateVersion} {onDismiss} />
	 */

	import type { Character } from '$lib/engine/models/Character';
	import {
		getCurrentDataVersion,
		isVersionOutdated,
		getChangelogBetween,
		getVersionMetadata
	} from '$lib/data/versioning/version';
	import Modal from '$lib/components/common/Modal.svelte';
	import Button from '$lib/components/common/Button.svelte';

	interface Props {
		/** The character to check for data updates */
		character: Character;

		/** Callback when user accepts the update */
		onUpdateVersion?: (newVersion: string) => void;

		/** Callback when user dismisses the notice */
		onDismiss?: () => void;

		/** Whether to show the notice (can be controlled externally) */
		show?: boolean;
	}

	let { character, onUpdateVersion, onDismiss, show = $bindable(true) }: Props = $props();

	// Determine if update is available
	const hasUpdate = $derived(isVersionOutdated(character.dataVersion));
	const currentVersion = getCurrentDataVersion();

	// Get changelog
	const changelog = $derived.by(() => {
		if (!hasUpdate) return [];
		return getChangelogBetween(character.dataVersion, currentVersion);
	});

	// Get version metadata
	const characterVersionMeta = $derived(getVersionMetadata(character.dataVersion));
	const currentVersionMeta = $derived(getVersionMetadata(currentVersion));

	// Internal state for modal
	let showModal = $state(false);

	// Show modal when there's an update and show prop is true
	$effect(() => {
		if (hasUpdate && show) {
			showModal = true;
		}
	});

	function handleAcceptUpdate() {
		onUpdateVersion?.(currentVersion);
		showModal = false;
		show = false;
	}

	function handleDismiss() {
		onDismiss?.();
		showModal = false;
		show = false;
	}

	// Format date for display
	function formatDate(isoDate: string): string {
		const date = new Date(isoDate);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

{#if hasUpdate}
	<!-- Banner notification (persistent until dismissed) -->
	{#if !showModal && show}
		<div class="update-banner" role="alert" aria-live="polite">
			<div class="banner-content">
				<div class="banner-icon">ℹ️</div>
				<div class="banner-text">
					<strong>Data Update Available</strong>
					<p>
						New game data is available. Your character was created with {character.dataVersion},
						but the current version is {currentVersion}.
					</p>
				</div>
				<div class="banner-actions">
					<Button variant="primary" size="sm" onclick={() => (showModal = true)}>
						View Changes
					</Button>
					<Button variant="ghost" size="sm" onclick={handleDismiss}> Dismiss </Button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Detailed change modal -->
	<Modal bind:open={showModal} title="Game Data Update" size="lg">
		<div class="update-modal">
			<!-- Version comparison -->
			<div class="version-comparison">
				<div class="version-box old-version">
					<h4>Your Character</h4>
					<div class="version-info">
						<span class="version-number">{character.dataVersion}</span>
						{#if characterVersionMeta}
							<span class="version-date">{formatDate(characterVersionMeta.importDate)}</span>
						{/if}
					</div>
				</div>

				<div class="version-arrow">→</div>

				<div class="version-box new-version">
					<h4>Latest Data</h4>
					<div class="version-info">
						<span class="version-number">{currentVersion}</span>
						{#if currentVersionMeta}
							<span class="version-date">{formatDate(currentVersionMeta.importDate)}</span>
						{/if}
					</div>
				</div>
			</div>

			<!-- Changelog -->
			<div class="changelog-section">
				<h3>What's Changed</h3>
				<p class="changelog-intro">
					The following updates have been made to the game data since your character was created:
				</p>

				<div class="changelog-list">
					{#each changelog as change}
						<div class="changelog-item">
							<span class="changelog-bullet">•</span>
							<span class="changelog-text">{change}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Impact notice -->
			<div class="impact-notice">
				<h4>How does this affect my character?</h4>
				<p>
					These changes may affect feats, spells, items, or class features your character has
					selected. The character builder will automatically use the latest data when calculating
					stats and abilities.
				</p>
				<p class="impact-recommendation">
					<strong>Recommendation:</strong> Accept the update to ensure your character sheet reflects
					the current game rules. You can review your character after updating to verify all selections
					are still valid.
				</p>
			</div>

			<!-- Decision buttons -->
			<div class="decision-section">
				<h4>What would you like to do?</h4>
				<div class="decision-buttons">
					<div class="decision-option">
						<Button variant="primary" size="lg" onclick={handleAcceptUpdate}>
							Accept Update
						</Button>
						<p class="option-description">
							Update character to use the latest game data ({currentVersion})
						</p>
					</div>

					<div class="decision-option">
						<Button variant="secondary" size="lg" onclick={handleDismiss}>
							Keep Current Version
						</Button>
						<p class="option-description">
							Continue using {character.dataVersion} (you can update later)
						</p>
					</div>
				</div>
			</div>

			<!-- Additional info -->
			<div class="additional-info">
				<p>
					<strong>Note:</strong> You can always view the changelog by visiting the
					<a href="/changelog">Changelog page</a>.
				</p>
			</div>
		</div>

		{#snippet footer()}
			<Button variant="ghost" onclick={handleDismiss}>Close</Button>
		{/snippet}
	</Modal>
{/if}

<style>
	/* Banner notification */
	.update-banner {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 1rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.banner-content {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.banner-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.banner-text {
		flex: 1;
	}

	.banner-text strong {
		display: block;
		font-size: 1rem;
		margin-bottom: 0.25rem;
	}

	.banner-text p {
		margin: 0;
		font-size: 0.875rem;
		opacity: 0.95;
	}

	.banner-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	/* Modal content */
	.update-modal {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	/* Version comparison */
	.version-comparison {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		padding: 1.5rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
	}

	.version-box {
		flex: 1;
		text-align: center;
		padding: 1rem;
		border-radius: 8px;
		border: 2px solid transparent;
	}

	.version-box h4 {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-secondary, #666666);
	}

	.version-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.version-number {
		font-size: 1.25rem;
		font-weight: 700;
		font-family: 'Courier New', monospace;
		color: var(--text-primary, #1a1a1a);
	}

	.version-date {
		font-size: 0.75rem;
		color: var(--text-secondary, #666666);
	}

	.old-version {
		background-color: rgba(255, 193, 7, 0.1);
		border-color: #ffc107;
	}

	.new-version {
		background-color: rgba(76, 175, 80, 0.1);
		border-color: #4caf50;
	}

	.version-arrow {
		font-size: 2rem;
		color: var(--text-secondary, #666666);
		flex-shrink: 0;
	}

	/* Changelog */
	.changelog-section h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.changelog-intro {
		margin: 0 0 1rem 0;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
	}

	.changelog-list {
		max-height: 300px;
		overflow-y: auto;
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--border-color, #e0e0e0);
	}

	.changelog-item {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	.changelog-item:last-child {
		margin-bottom: 0;
	}

	.changelog-bullet {
		color: var(--link-color, #5c7cfa);
		font-weight: 700;
		flex-shrink: 0;
	}

	.changelog-text {
		color: var(--text-primary, #1a1a1a);
	}

	/* Impact notice */
	.impact-notice {
		padding: 1.5rem;
		background-color: rgba(33, 150, 243, 0.05);
		border: 2px solid #2196f3;
		border-radius: 8px;
	}

	.impact-notice h4 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #1565c0;
	}

	.impact-notice p {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		line-height: 1.6;
		color: var(--text-secondary, #666666);
	}

	.impact-notice p:last-child {
		margin-bottom: 0;
	}

	.impact-recommendation {
		padding-top: 0.75rem;
		border-top: 1px solid rgba(33, 150, 243, 0.2);
	}

	.impact-recommendation strong {
		color: #1565c0;
	}

	/* Decision section */
	.decision-section h4 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.decision-buttons {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.decision-option {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 1.5rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
		border: 2px solid var(--border-color, #e0e0e0);
		transition: border-color 0.2s;
	}

	.decision-option:hover {
		border-color: var(--link-color, #5c7cfa);
	}

	.option-description {
		margin: 1rem 0 0 0;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		line-height: 1.5;
	}

	/* Additional info */
	.additional-info {
		padding-top: 1rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}

	.additional-info p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
	}

	.additional-info a {
		color: var(--link-color, #5c7cfa);
		text-decoration: none;
	}

	.additional-info a:hover {
		text-decoration: underline;
	}

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.banner-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.banner-actions {
			width: 100%;
			flex-direction: column;
		}

		.version-comparison {
			flex-direction: column;
			gap: 1rem;
		}

		.version-arrow {
			transform: rotate(90deg);
		}

		.decision-buttons {
			grid-template-columns: 1fr;
		}
	}
</style>
