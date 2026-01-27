<script lang="ts">
	/**
	 * Item Selection Modal
	 *
	 * A generic modal for selecting feats/items with a split-panel layout.
	 * Used for class features, dedication choices, heritage choices, and all feat selections.
	 */

	import type { Feat } from '$lib/data/types/app';
	import Modal from '$lib/components/common/Modal.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import RichDescription from '$lib/components/common/RichDescription.svelte';

	export interface TabConfig {
		id: string;
		label: string;
		items: Feat[];
	}

	interface Props {
		/** Title for the modal */
		title: string;
		/** Label for the button */
		buttonLabel: string;
		/** Available items to choose from (already filtered) - used when tabs not provided */
		availableItems: Feat[];
		/** Currently selected item UUID/ID (if any) */
		selectedValue?: string;
		/** Callback when an item is selected */
		onSelect: (value: string) => void;
		/** Callback when selection is cleared (optional) */
		onClear?: () => void;
		/** Whether the selector is disabled */
		disabled?: boolean;
		/** Loading state */
		loading?: boolean;
		/** Character's ability scores for prerequisite checking */
		abilityScores?: Record<string, number>;
		/** Character's trained skills for prerequisite checking */
		trainedSkills?: string[];
		/** Whether to show prerequisite checking */
		showPrerequisites?: boolean;
		/** Whether to bypass level prerequisites (e.g., Ancient Elf) */
		bypassLevelPrereqs?: boolean;
		/** Optional variant styling (e.g., 'variant-rule' for Free Archetype) */
		variant?: 'default' | 'variant-rule';
		/** Optional label to display above the button */
		label?: string;
		/** Optional tabs configuration for multi-category selection */
		tabs?: TabConfig[];
	}

	let {
		title,
		buttonLabel,
		availableItems,
		selectedValue = undefined,
		onSelect,
		onClear,
		disabled = false,
		loading = false,
		abilityScores = {},
		trainedSkills = [],
		showPrerequisites = false,
		bypassLevelPrereqs = false,
		variant = 'default',
		label,
		tabs
	}: Props = $props();

	// Modal state
	let modalOpen = $state(false);
	let selectedInModal = $state<string | undefined>(undefined);
	let searchQuery = $state('');
	let activeTabId = $state<string | undefined>(undefined);

	// Initialize active tab when modal opens
	$effect(() => {
		if (modalOpen && tabs && tabs.length > 0 && !activeTabId) {
			activeTabId = tabs[0].id;
		}
	});

	// Get all items (either from tabs or availableItems)
	const allItems = $derived.by(() => {
		if (tabs && tabs.length > 0) {
			return tabs.flatMap(tab => tab.items);
		}
		return availableItems;
	});

	// Get items for current tab (or all items if no tabs)
	const currentTabItems = $derived.by(() => {
		if (tabs && tabs.length > 0 && activeTabId) {
			const tab = tabs.find(t => t.id === activeTabId);
			return tab?.items || [];
		}
		return availableItems;
	});

	// Get currently selected item from all items
	const selectedItem = $derived(
		selectedValue
			? allItems.find((f) => selectedValue.includes(f.id))
			: undefined
	);

	// Get item being previewed in modal
	const previewItem = $derived(
		selectedInModal ? allItems.find((f) => selectedInModal?.includes(f.id)) : undefined
	);

	// Filter items by search query (only current tab items)
	const filteredItems = $derived(
		currentTabItems.filter(
			(item) =>
				item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.traits.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
		)
	);

	// Prerequisite checking
	function checkPrerequisites(item: Feat): { met: boolean; unmetReasons: string[] } {
		const unmetReasons: string[] = [];

		if (!showPrerequisites || !item.prerequisites || item.prerequisites.length === 0) {
			return { met: true, unmetReasons: [] };
		}

		for (const prereq of item.prerequisites) {
			const prereqLower = prereq.toLowerCase();

			// Skip level prerequisites if bypassed (e.g., Ancient Elf)
			if (bypassLevelPrereqs && prereqLower.includes('level')) {
				continue;
			}

			// Check ability score prerequisites (both score and modifier format)
			const abilityScoreMatch = prereq.match(/^(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+(\d+)/i);
			const abilityModifierMatch = prereq.match(/^(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+\+(\d+)/i);

			if (abilityScoreMatch || abilityModifierMatch) {
				const match = abilityScoreMatch || abilityModifierMatch;
				const abilityName = match![1];
				const value = parseInt(match![2], 10);

				// Convert modifier to score: +0=10, +1=12, +2=14, +3=16, etc.
				const requiredScore = abilityModifierMatch ? 10 + (value * 2) : value;

				const currentScore = abilityScores[abilityName] || abilityScores[abilityName.toLowerCase()] || 10;

				if (currentScore < requiredScore) {
					unmetReasons.push(prereq);
				}
				continue;
			}

			// Check trained skill prerequisites
			const trainedMatch = prereq.match(/trained in (\w+)/i);
			if (trainedMatch) {
				const skillName = trainedMatch[1].toLowerCase();
				const isTrainedInSkill = trainedSkills.some(s => s.toLowerCase() === skillName);
				if (!isTrainedInSkill) {
					unmetReasons.push(prereq);
				}
				continue;
			}

			// If we can't parse it, mark as unmet to be safe
			if (!prereqLower.includes('level')) {
				unmetReasons.push(prereq);
			}
		}

		return { met: unmetReasons.length === 0, unmetReasons };
	}

	function openModal() {
		if (disabled || loading) return;
		// Pre-select the currently selected item when opening modal
		selectedInModal = selectedValue;
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

	function handleItemClick(itemId: string, itemUUID?: string) {
		// If we have a UUID format (Compendium.pf2e.classfeatures.Item.XXX), use it
		// Otherwise, just use the ID
		selectedInModal = itemUUID || `Compendium.pf2e.classfeatures.Item.${itemId}`;
	}

	function handleClearSelection() {
		if (onClear) {
			onClear();
		} else {
			onSelect('');
		}
		modalOpen = false;
	}
</script>

<div class="item-selector" class:variant-rule={variant === 'variant-rule'}>
	{#if label}
		<div class="selector-label">
			{label}:
			{#if variant === 'variant-rule'}
				<span class="variant-indicator">Variant Rule</span>
			{/if}
		</div>
	{/if}

	<button
		class="selector-button"
		class:has-selection={!!selectedItem}
		class:disabled={disabled || loading}
		onclick={openModal}
		type="button"
		disabled={disabled || loading}
	>
		{#if loading}
			<span class="button-text loading">Loading...</span>
		{:else if selectedItem}
			<span class="button-text selected">{selectedItem.name}</span>
			{#if selectedItem.level !== undefined}
				<span class="item-level">Level {selectedItem.level}</span>
			{/if}
		{:else}
			<span class="button-text placeholder">{buttonLabel}</span>
		{/if}
	</button>
</div>

{#if modalOpen}
	<Modal open={modalOpen} title={title} onClose={handleCancel} size="xl">
		<div class="modal-content">
			<!-- Tabs (if provided) -->
			{#if tabs && tabs.length > 1}
				<div class="tabs-container">
					{#each tabs as tab}
						<button
							class="tab-button"
							class:active={activeTabId === tab.id}
							onclick={() => { activeTabId = tab.id; searchQuery = ''; }}
							type="button"
						>
							{tab.label}
							<span class="tab-count">({tab.items.length})</span>
						</button>
					{/each}
				</div>
			{/if}

			<!-- Search bar -->
			<div class="search-bar">
				<input
					type="text"
					class="search-input"
					placeholder="Search by name or trait..."
					bind:value={searchQuery}
					autofocus
				/>
				<span class="search-count">{filteredItems.length} options</span>
			</div>

			<div class="split-layout">
				<!-- Left panel: Item list -->
				<div class="item-list-panel">
					<div class="item-list">
						{#if filteredItems.length === 0}
							<div class="no-results">
								{#if searchQuery}
									No options match "{searchQuery}"
								{:else}
									No options available
								{/if}
							</div>
						{:else}
							{#each filteredItems as item}
								{@const prereqCheck = checkPrerequisites(item)}
								{@const isSelected = selectedInModal === item.id || selectedInModal?.includes(item.id)}

								<button
									class="item-entry"
									class:selected={isSelected}
									class:has-unmet-prereqs={prereqCheck.unmetReasons.length > 0}
									onclick={() => handleItemClick(item.id)}
									type="button"
								>
									<div class="item-header">
										<span class="item-name">{item.name}</span>
										{#if item.level !== undefined}
											<span class="item-level">Level {item.level}</span>
										{/if}
									</div>

									{#if item.traits && item.traits.length > 0}
										<div class="item-traits">
											{#each item.traits as trait}
												<span class="trait-badge">{trait}</span>
											{/each}
										</div>
									{/if}

									{#if prereqCheck.unmetReasons.length > 0}
										<div class="prerequisites unmet">
											<strong>Prerequisites not met:</strong>
											{prereqCheck.unmetReasons.join(', ')}
										</div>
									{:else if item.prerequisites && item.prerequisites.length > 0}
										<div class="prerequisites met">
											<strong>Prerequisites:</strong>
											{item.prerequisites.join(', ')}
											{#if bypassLevelPrereqs && item.prerequisites.some(p => p.toLowerCase().includes('level'))}
												<span class="bypass-note">(level requirement bypassed)</span>
											{/if}
										</div>
									{/if}
								</button>
							{/each}
						{/if}
					</div>
				</div>

				<!-- Right panel: Detail view -->
				<div class="detail-panel">
					{#if previewItem}
						<div class="item-detail">
							<h3 class="detail-title">{previewItem.name}</h3>

							<div class="detail-metadata">
								{#if previewItem.level !== undefined}
									<div class="metadata-item">
										<strong>Level:</strong>
										{previewItem.level}
									</div>
								{/if}
								{#if previewItem.prerequisites && previewItem.prerequisites.length > 0}
									<div class="metadata-item">
										<strong>Prerequisites:</strong>
										{previewItem.prerequisites.join(', ')}
									</div>
								{/if}
								{#if previewItem.traits && previewItem.traits.length > 0}
									<div class="metadata-item">
										<strong>Traits:</strong>
										<div class="traits-list">
											{#each previewItem.traits as trait}
												<span class="trait-badge">{trait}</span>
											{/each}
										</div>
									</div>
								{/if}
								{#if previewItem.rarity && previewItem.rarity !== 'common'}
									<div class="metadata-item">
										<strong>Rarity:</strong>
										<span class="rarity-badge rarity-{previewItem.rarity}">{previewItem.rarity}</span>
									</div>
								{/if}
							</div>

							{#if previewItem.description}
								<div class="detail-description">
									<RichDescription content={previewItem.description} />
								</div>
							{/if}
						</div>
					{:else}
						<div class="no-selection">
							<p>Select an option from the list to see details</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#snippet footer()}
			<Button variant="secondary" onclick={handleCancel}>Cancel</Button>
			{#if selectedValue && onClear}
				<Button variant="ghost" onclick={handleClearSelection}>Clear Selection</Button>
			{/if}
			<Button variant="primary" disabled={!selectedInModal} onclick={handleAccept}>
				Select
			</Button>
		{/snippet}
	</Modal>
{/if}

<style>
	.item-selector {
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
		padding: 0.75rem 1rem;
		background-color: var(--surface-1, #ffffff);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		cursor: pointer;
		transition: all var(--transition-fast);
		min-height: 48px;
		width: 100%;
		text-align: left;
	}

	.selector-button:hover:not(.disabled) {
		border-color: var(--link-color, #5c7cfa);
		background-color: var(--surface-2, #f5f5f5);
	}

	.selector-button.has-selection {
		background-color: rgba(92, 124, 250, 0.05);
	}

	.selector-button.disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.button-text {
		font-size: 1rem;
	}

	.button-text.placeholder {
		color: var(--text-tertiary, #999999);
	}

	.button-text.selected {
		color: var(--text-primary, #1a1a1a);
		font-weight: 500;
	}

	.button-text.loading {
		color: var(--text-secondary, #666666);
	}

	.item-level {
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		padding: 0.25rem 0.5rem;
		background-color: var(--surface-3, #e0e0e0);
		border-radius: 4px;
	}

	/* Modal content */
	.modal-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 70vh;
		max-height: 600px;
	}

	.tabs-container {
		display: flex;
		gap: 0.5rem;
		padding-bottom: 0.75rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.tab-button {
		padding: 0.5rem 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px 8px 0 0;
		cursor: pointer;
		transition: all var(--transition-fast);
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.tab-button:hover {
		background-color: var(--surface-1, #ffffff);
		border-color: var(--link-color, #5c7cfa);
	}

	.tab-button.active {
		background-color: var(--surface-1, #ffffff);
		border-color: var(--link-color, #5c7cfa);
		border-bottom-color: var(--surface-1, #ffffff);
		color: var(--text-primary, #1a1a1a);
		position: relative;
		margin-bottom: -2px;
		z-index: 1;
	}

	.tab-count {
		font-size: 0.8125rem;
		color: var(--text-tertiary, #999999);
	}

	.tab-button.active .tab-count {
		color: var(--link-color, #5c7cfa);
	}

	.search-bar {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		padding-bottom: 0.75rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.search-input {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		font-size: 1rem;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--link-color, #5c7cfa);
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
		overflow: hidden;
		flex: 1;
	}

	.item-list-panel {
		overflow-y: auto;
		border-right: 2px solid var(--border-color, #e0e0e0);
		padding-right: 1rem;
	}

	.item-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.item-entry {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		cursor: pointer;
		transition: all var(--transition-fast);
		text-align: left;
		width: 100%;
	}

	.item-entry:hover {
		border-color: var(--link-color, #5c7cfa);
	}

	.item-entry.selected {
		background-color: rgba(92, 124, 250, 0.1);
		border-color: var(--link-color, #5c7cfa);
		border-width: 3px;
	}

	.item-entry.has-unmet-prereqs {
		border-color: #ffc107;
		background-color: rgba(255, 193, 7, 0.05);
	}

	.item-entry.has-unmet-prereqs .item-name {
		color: #856404;
	}

	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.item-name {
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.item-traits {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.trait-badge {
		padding: 0.125rem 0.375rem;
		background-color: var(--surface-1, #ffffff);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
	}

	.rarity-badge {
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: capitalize;
	}

	.rarity-badge.rarity-uncommon {
		background-color: rgba(40, 167, 69, 0.15);
		border: 1px solid #28a745;
		color: #28a745;
	}

	.rarity-badge.rarity-rare {
		background-color: rgba(0, 123, 255, 0.15);
		border: 1px solid #007bff;
		color: #007bff;
	}

	.rarity-badge.rarity-unique {
		background-color: rgba(220, 53, 69, 0.15);
		border: 1px solid #dc3545;
		color: #dc3545;
	}

	.prerequisites {
		font-size: 0.875rem;
		padding: 0.5rem;
		border-radius: 4px;
		margin-top: 0.5rem;
	}

	.prerequisites.met {
		background-color: rgba(40, 167, 69, 0.1);
		color: #155724;
		border: 1px solid rgba(40, 167, 69, 0.3);
	}

	.prerequisites.unmet {
		background-color: rgba(255, 193, 7, 0.1);
		color: #856404;
		border: 1px solid rgba(255, 193, 7, 0.5);
	}

	.prerequisites strong {
		color: inherit;
	}

	.bypass-note {
		font-style: italic;
		font-size: 0.8rem;
		opacity: 0.85;
		margin-left: 0.25rem;
	}

	.detail-panel {
		overflow-y: auto;
	}

	.item-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.detail-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.detail-metadata {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
	}

	.metadata-item {
		line-height: 1.6;
	}

	.metadata-item strong {
		color: var(--text-primary, #1a1a1a);
		margin-right: 0.5rem;
	}

	.traits-list {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-top: 0.5rem;
	}

	.detail-description {
		line-height: 1.6;
		color: var(--text-primary, #1a1a1a);
	}

	.no-results,
	.no-selection {
		padding: 3rem;
		text-align: center;
		color: var(--text-secondary, #666666);
	}

	@media (max-width: 768px) {
		.split-layout {
			grid-template-columns: 1fr;
		}

		.item-list-panel {
			border-right: none;
			padding-right: 0;
			max-height: 300px;
		}

		.detail-panel {
			border-top: 2px solid var(--border-color, #e0e0e0);
			padding-top: 1rem;
		}
	}
</style>
