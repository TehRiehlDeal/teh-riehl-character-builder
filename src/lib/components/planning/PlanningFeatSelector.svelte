<script lang="ts">
	/**
	 * Planning Feat Selector
	 *
	 * @deprecated This component is deprecated and no longer used in the codebase.
	 * Use ItemSelectionModal from $lib/components/wizard/ItemSelectionModal.svelte instead.
	 *
	 * ItemSelectionModal provides the same functionality with additional features:
	 * - Prerequisite checking
	 * - Support for different item types (feats, class features, etc.)
	 * - Consistent styling across the entire application
	 *
	 * A button that opens a modal for selecting feats in the Planning tab.
	 * Uses a split-panel layout with feat list on left and details on right.
	 */

	import type { Feat } from '$lib/data/types/app';
	import Modal from '$lib/components/common/Modal.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import RichDescription from '$lib/components/common/RichDescription.svelte';

	interface Props {
		/** Label for the feat slot (e.g., "Class Feat", "Ancestry Feat") */
		label: string;
		/** Available feats to choose from (already filtered by level and category) */
		availableFeats: Feat[];
		/** Currently selected feat ID (if any) */
		selectedFeatId?: string;
		/** Callback when a feat is selected */
		onSelect: (featId: string) => void;
		/** Whether the selector is disabled */
		disabled?: boolean;
		/** Optional variant styling */
		variant?: 'default' | 'variant-rule';
		/** Loading state */
		loading?: boolean;
	}

	let {
		label,
		availableFeats,
		selectedFeatId = undefined,
		onSelect,
		disabled = false,
		variant = 'default',
		loading = false
	}: Props = $props();

	// Modal state
	let modalOpen = $state(false);
	let selectedInModal = $state<string | undefined>(undefined);
	let searchQuery = $state('');

	// Get currently selected feat from the list
	const selectedFeat = $derived(
		availableFeats.find(f => f.id === selectedFeatId)
	);

	// Get feat being previewed in modal
	const previewFeat = $derived(
		availableFeats.find(f => f.id === selectedInModal)
	);

	// Filter feats by search query
	const filteredFeats = $derived(
		availableFeats.filter(feat =>
			feat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			feat.traits.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
		)
	);

	function openModal() {
		if (disabled || loading) return;
		// Pre-select the currently selected feat when opening modal
		selectedInModal = selectedFeatId;
		searchQuery = '';
		modalOpen = true;
	}

	function handleAccept() {
		if (selectedInModal) {
			onSelect(selectedInModal);
			modalOpen = false;
		}
	}

	function handleCancel() {
		modalOpen = false;
		selectedInModal = undefined;
	}

	function handleFeatClick(featId: string) {
		selectedInModal = featId;
	}

	function handleClearSelection() {
		onSelect('');
		modalOpen = false;
	}
</script>

<div class="feat-selector" class:variant-rule={variant === 'variant-rule'}>
	<div class="selector-label">
		{label}:
		{#if variant === 'variant-rule'}
			<span class="variant-indicator">Variant Rule</span>
		{/if}
	</div>

	<button
		class="selector-button"
		class:has-selection={!!selectedFeat}
		class:disabled={disabled || loading}
		onclick={openModal}
		type="button"
		disabled={disabled || loading}
	>
		{#if loading}
			<span class="button-text loading">Loading feats...</span>
		{:else if selectedFeat}
			<span class="button-text selected">{selectedFeat.name}</span>
			<span class="feat-level">Level {selectedFeat.level}</span>
		{:else}
			<span class="button-text placeholder">Select feat...</span>
		{/if}
	</button>
</div>

{#if modalOpen}
	<Modal
		open={modalOpen}
		title={`Select ${label}`}
		onClose={handleCancel}
		size="xl"
	>
		<div class="modal-content">
			<!-- Search bar -->
			<div class="search-bar">
				<input
					type="text"
					class="search-input"
					placeholder="Search feats by name or trait..."
					bind:value={searchQuery}
					autofocus
				/>
				<span class="search-count">{filteredFeats.length} feats</span>
			</div>

			<div class="split-layout">
				<!-- Left panel: Feat list -->
				<div class="feat-list-panel">
					<div class="feat-list">
						{#if filteredFeats.length === 0}
							<div class="no-results">
								{#if searchQuery}
									No feats match "{searchQuery}"
								{:else}
									No feats available
								{/if}
							</div>
						{:else}
							{#each filteredFeats as feat}
								<button
									class="feat-item"
									class:selected={selectedInModal === feat.id}
									onclick={() => handleFeatClick(feat.id)}
									type="button"
								>
									<div class="feat-item-header">
										<span class="feat-item-name">{feat.name}</span>
										<span class="feat-item-level">Level {feat.level}</span>
									</div>
									{#if feat.traits.length > 0}
										<div class="feat-item-traits">
											{#each feat.traits.slice(0, 3) as trait}
												<span class="trait-tag">{trait}</span>
											{/each}
											{#if feat.traits.length > 3}
												<span class="trait-tag">+{feat.traits.length - 3}</span>
											{/if}
										</div>
									{/if}
								</button>
							{/each}
						{/if}
					</div>
				</div>

				<!-- Right panel: Feat details -->
				<div class="feat-details-panel">
					{#if previewFeat}
						<div class="feat-details">
							<h3 class="feat-name">{previewFeat.name}</h3>

							<div class="feat-meta">
								<span class="meta-item">
									<strong>Level:</strong> {previewFeat.level}
								</span>
								<span class="meta-item">
									<strong>Rarity:</strong>
									<span class="rarity rarity-{previewFeat.rarity}">{previewFeat.rarity}</span>
								</span>
							</div>

							{#if previewFeat.traits.length > 0}
								<div class="feat-traits">
									{#each previewFeat.traits as trait}
										<span class="trait-badge">{trait}</span>
									{/each}
								</div>
							{/if}

							{#if previewFeat.prerequisites.length > 0}
								<div class="feat-section">
									<strong>Prerequisites:</strong>
									<ul class="prerequisites-list">
										{#each previewFeat.prerequisites as prereq}
											<li>{prereq}</li>
										{/each}
									</ul>
								</div>
							{/if}

							<div class="feat-section">
								<strong>Description:</strong>
								<div class="feat-description">
									<RichDescription content={previewFeat.description} />
								</div>
							</div>

							{#if previewFeat.actionType}
								<div class="feat-section">
									<strong>Action Type:</strong>
									<span class="action-type">{previewFeat.actionType}</span>
									{#if previewFeat.actions}
										<span class="action-count">({previewFeat.actions} {previewFeat.actions === 1 ? 'action' : 'actions'})</span>
									{/if}
								</div>
							{/if}

							<div class="feat-section source">
								<strong>Source:</strong> {previewFeat.source.title}
							</div>
						</div>
					{:else}
						<div class="no-selection">
							<p>Select a feat from the list to view details</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Modal actions -->
			<div class="modal-actions">
				{#if selectedFeatId}
					<Button variant="danger" onclick={handleClearSelection}>
						Clear Selection
					</Button>
				{/if}
				<div class="action-spacer"></div>
				<Button variant="secondary" onclick={handleCancel}>
					Cancel
				</Button>
				<Button
					variant="primary"
					onclick={handleAccept}
					disabled={!selectedInModal}
				>
					Accept
				</Button>
			</div>
		</div>
	</Modal>
{/if}

<style>
	.feat-selector {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.selector-label {
		font-weight: 600;
		font-size: 0.9375rem;
		color: var(--text-primary, #1a1a1a);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.variant-indicator {
		display: inline-flex;
		align-items: center;
		padding: 0.125rem 0.5rem;
		background-color: var(--link-color, #5c7cfa);
		color: white;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-radius: 4px;
	}

	.selector-button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 1rem 1.25rem;
		background-color: var(--surface-1, #ffffff);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all var(--transition-fast);
		text-align: left;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
		position: relative;
	}

	.selector-button::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		background-color: var(--link-color, #5c7cfa);
		border-radius: 8px 0 0 8px;
		opacity: 0;
		transition: opacity var(--transition-fast);
	}

	.selector-button:hover:not(.disabled) {
		border-color: var(--link-color, #5c7cfa);
		background-color: var(--surface-1, #ffffff);
		box-shadow: 0 2px 8px rgba(92, 124, 250, 0.15);
	}

	.selector-button:hover:not(.disabled)::before {
		opacity: 1;
	}

	.selector-button:active:not(.disabled) {
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.selector-button:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	.selector-button.disabled {
		background-color: var(--surface-2, #f5f5f5);
		cursor: not-allowed;
		opacity: 0.6;
		box-shadow: none;
	}

	.selector-button.has-selection {
		border-color: var(--success-color, #37b24d);
		background-color: rgba(55, 178, 77, 0.05);
		box-shadow: 0 1px 2px rgba(55, 178, 77, 0.15);
	}

	.selector-button.has-selection::before {
		background-color: var(--success-color, #37b24d);
		opacity: 1;
	}

	.button-text {
		flex: 1;
	}

	.button-text.placeholder {
		color: var(--text-secondary, #666666);
	}

	.button-text.selected {
		color: var(--text-primary, #1a1a1a);
		font-weight: 500;
	}

	.button-text.loading {
		color: var(--text-secondary, #666666);
		font-style: italic;
	}

	.feat-level {
		color: var(--text-secondary, #666666);
		font-size: 0.875rem;
		margin-left: 0.5rem;
	}

	/* Modal content */
	.modal-content {
		display: flex;
		flex-direction: column;
		height: 70vh;
		max-height: 800px;
	}

	.search-bar {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.search-input {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-size: 0.9375rem;
		font-family: inherit;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--focus-color, #5c7cfa);
		box-shadow: 0 0 0 3px rgba(92, 124, 250, 0.1);
	}

	.search-count {
		color: var(--text-secondary, #666666);
		font-size: 0.875rem;
		white-space: nowrap;
	}

	.split-layout {
		display: grid;
		grid-template-columns: 1fr 1.5fr;
		gap: 1.5rem;
		flex: 1;
		overflow: hidden;
	}

	/* Feat list panel */
	.feat-list-panel {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-right: 2px solid var(--border-color, #e0e0e0);
		padding-right: 1.5rem;
	}

	.feat-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.feat-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid transparent;
		border-radius: 6px;
		cursor: pointer;
		transition: all var(--transition-fast);
		text-align: left;
		font-family: inherit;
	}

	.feat-item:hover {
		background-color: var(--surface-3, #e0e0e0);
	}

	.feat-item.selected {
		background-color: rgba(92, 124, 250, 0.1);
		border-color: var(--link-color, #5c7cfa);
	}

	.feat-item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.feat-item-name {
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		font-size: 0.9375rem;
	}

	.feat-item-level {
		color: var(--text-secondary, #666666);
		font-size: 0.8125rem;
		white-space: nowrap;
	}

	.feat-item-traits {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.trait-tag {
		padding: 0.125rem 0.5rem;
		background-color: var(--surface-1, #ffffff);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 4px;
		font-size: 0.75rem;
		color: var(--text-secondary, #666666);
	}

	.no-results {
		padding: 2rem;
		text-align: center;
		color: var(--text-secondary, #666666);
	}

	/* Feat details panel */
	.feat-details-panel {
		overflow-y: auto;
		padding-right: 0.5rem;
	}

	.feat-details {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.feat-name {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.feat-meta {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.meta-item {
		font-size: 0.9375rem;
		color: var(--text-primary, #1a1a1a);
	}

	.rarity {
		padding: 0.125rem 0.5rem;
		border-radius: 4px;
		font-size: 0.8125rem;
		font-weight: 600;
		text-transform: capitalize;
	}

	.rarity-common {
		background-color: #e9ecef;
		color: #495057;
	}

	.rarity-uncommon {
		background-color: #fff3cd;
		color: #856404;
	}

	.rarity-rare {
		background-color: #cce5ff;
		color: #004085;
	}

	.rarity-unique {
		background-color: #f8d7da;
		color: #721c24;
	}

	.feat-traits {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.trait-badge {
		padding: 0.25rem 0.75rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary, #1a1a1a);
	}

	.feat-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.feat-section strong {
		color: var(--text-primary, #1a1a1a);
		font-weight: 600;
	}

	/* RichDescription component handles its own styling for .feat-description */

	.prerequisites-list {
		margin: 0;
		padding-left: 1.5rem;
		color: var(--text-primary, #1a1a1a);
	}

	.action-type {
		padding: 0.25rem 0.75rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 4px;
		font-weight: 500;
		text-transform: capitalize;
	}

	.action-count {
		color: var(--text-secondary, #666666);
		font-size: 0.875rem;
	}

	.source {
		color: var(--text-secondary, #666666);
		font-size: 0.875rem;
	}

	.no-selection {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-secondary, #666666);
	}

	/* Modal actions */
	.modal-actions {
		display: flex;
		gap: 0.75rem;
		padding-top: 1.5rem;
		border-top: 2px solid var(--border-color, #e0e0e0);
		margin-top: 1.5rem;
	}

	.action-spacer {
		flex: 1;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.split-layout {
			grid-template-columns: 1fr;
			grid-template-rows: auto 1fr;
		}

		.feat-list-panel {
			border-right: none;
			border-bottom: 2px solid var(--border-color, #e0e0e0);
			padding-right: 0;
			padding-bottom: 1rem;
			max-height: 300px;
		}

		.modal-actions {
			flex-wrap: wrap;
		}

		.action-spacer {
			display: none;
		}
	}
</style>
