<script lang="ts">
	import InventoryList from './InventoryList.svelte';
	import Button from '../common/Button.svelte';
	import type { InventoryItem } from './InventoryList.svelte';

	/**
	 * ContainerAwareInventoryList Component
	 *
	 * Extends InventoryList with container support.
	 * Displays containers with nested items and provides stow/unstow functionality.
	 */

	interface Props {
		/** Array of inventory items (filtered for current tab) */
		items: InventoryItem[];

		/** Array of ALL inventory items (needed to find containers in other tabs) */
		allItems?: InventoryItem[];

		/** Array of available containers (passed from parent to avoid recalculation) */
		availableContainers?: InventoryItem[];

		/** Title for the list */
		title?: string;

		/** External type filter (from tabs) */
		externalTypeFilter?: string[];

		/** Callback when item is selected for details */
		// eslint-disable-next-line no-unused-vars
		onViewDetails?: (item: InventoryItem) => void;

		/** Callback when item worn status changes */
		// eslint-disable-next-line no-unused-vars
		onToggleWorn?: (item: InventoryItem) => void;

		/** Callback when item invested status changes */
		// eslint-disable-next-line no-unused-vars
		onToggleInvested?: (item: InventoryItem) => void;

		/** Callback when item is removed */
		// eslint-disable-next-line no-unused-vars
		onRemoveItem?: (item: InventoryItem) => void;

		/** Callback when item is stowed into a container */
		// eslint-disable-next-line no-unused-vars
		onStowItem?: (itemId: string, containerId: string) => void;

		/** Callback when item is removed from container */
		// eslint-disable-next-line no-unused-vars
		onUnstowItem?: (itemId: string) => void;
	}

	let {
		items,
		allItems,
		availableContainers: passedContainers,
		title = 'Inventory',
		externalTypeFilter,
		onViewDetails,
		onToggleWorn,
		onToggleInvested,
		onRemoveItem,
		onStowItem,
		onUnstowItem
	}: Props = $props();

	let showStowModal = $state(false);
	let selectedItemForStowing = $state<InventoryItem | null>(null);
	let draggedItem = $state<InventoryItem | null>(null);
	let dragOverContainerId = $state<string | null>(null);
	let dragOverUnstow = $state(false);

	// Identify container items
	function isContainer(item: InventoryItem): boolean {
		const traits = item.equipment.traits || [];
		const name = item.equipment.name.toLowerCase();

		// Check for container trait
		if (traits.some((t) => t.toLowerCase() === 'container')) {
			return true;
		}

		// Check for common container names in adventuring gear
		if (item.equipment.equipmentType === 'adventuring-gear') {
			const containerKeywords = ['backpack', 'bag', 'pouch', 'sack', 'case', 'chest', 'box'];
			return containerKeywords.some((keyword) => name.includes(keyword));
		}

		return false;
	}

	// Containers that are visible in the current tab (for display purposes)
	const containersInCurrentTab = $derived(items.filter(isContainer));

	// Get items that are not in containers (from the filtered items for this tab)
	const topLevelItems = $derived(items.filter((item) => !item.containerId));

	// Get items in a specific container (need to check ALL items, not just filtered ones)
	function getItemsInContainer(containerId: string): InventoryItem[] {
		const itemsToCheck = allItems || items;
		return itemsToCheck.filter((item) => item.containerId === containerId);
	}

	// Get container capacity limit based on item
	function getContainerCapacity(container: InventoryItem): number {
		const name = container.equipment.name.toLowerCase();

		// Spacious Pouches (extradimensional) - Type I/II/III/IV
		if (name.includes('spacious pouch')) {
			if (name.includes('type iv') || name.includes('4')) return 150;
			if (name.includes('type iii') || name.includes('3')) return 100;
			if (name.includes('type ii') || name.includes('2')) return 50;
			// Default Type I or unspecified
			return 25;
		}

		// Bag of Holding (extradimensional)
		if (name.includes('bag of holding')) {
			if (name.includes('type iv') || name.includes('4')) return 150;
			if (name.includes('type iii') || name.includes('3')) return 100;
			if (name.includes('type ii') || name.includes('2')) return 50;
			return 25; // Default Type I
		}

		// Regular containers (no extradimensional properties)
		// These don't have practical capacity limits in PF2e
		if (name.includes('backpack')) {
			return 999; // Essentially unlimited
		}

		if (name.includes('sack')) {
			return 999; // Essentially unlimited
		}

		if (name.includes('bag') && !name.includes('holding')) {
			return 999; // Essentially unlimited
		}

		// Default for unrecognized containers
		return 999;
	}

	// Calculate bulk of items in a container
	function getContainerCurrentBulk(containerId: string): number {
		const containedItems = getItemsInContainer(containerId);
		return containedItems.reduce((sum, item) => {
			return sum + item.equipment.bulk.value * item.quantity;
		}, 0);
	}

	// Check if a container has a meaningful capacity limit
	function hasCapacityLimit(container: InventoryItem): boolean {
		const capacity = getContainerCapacity(container);
		return capacity < 999; // Containers with 999 capacity are effectively unlimited
	}

	// Check if an item can be stowed
	function canBeStowed(item: InventoryItem): boolean {
		// Can't stow containers
		if (isContainer(item)) {
			return false;
		}

		// Can't stow items that are currently worn
		if (item.worn) {
			return false;
		}

		// Can only stow weapons, armor, and some gear
		const stowableTypes = ['weapon', 'armor', 'shield', 'consumable', 'adventuring-gear'];
		return stowableTypes.includes(item.equipment.equipmentType);
	}

	// Available containers for stowing (from ALL inventory, not just current tab)
	const availableContainers = $derived(
		passedContainers
			? passedContainers.filter((c) => !c.containerId)
			: (allItems || items).filter(isContainer).filter((c) => !c.containerId)
	);

	function handleStowClick(item: InventoryItem) {
		selectedItemForStowing = item;
		showStowModal = true;
	}

	function handleConfirmStow(containerId: string) {
		if (!selectedItemForStowing || !onStowItem) return;

		// Check if the container has capacity
		const container = availableContainers.find((c) => c.equipment.id === containerId);
		if (!container) return;

		// Only check capacity for containers with limits (extradimensional containers)
		if (hasCapacityLimit(container)) {
			const currentBulk = getContainerCurrentBulk(containerId);
			const capacity = getContainerCapacity(container);
			const itemBulk = selectedItemForStowing.equipment.bulk.value * selectedItemForStowing.quantity;

			if (currentBulk + itemBulk > capacity) {
				alert(
					`Cannot stow ${selectedItemForStowing.equipment.name}: ` +
					`${container.equipment.name} is full (${currentBulk.toFixed(1)}/${capacity} Bulk). ` +
					`This item would add ${itemBulk.toFixed(1)} Bulk.`
				);
				return;
			}
		}

		onStowItem(selectedItemForStowing.equipment.id, containerId);
		showStowModal = false;
		selectedItemForStowing = null;
	}

	function handleCancelStow() {
		showStowModal = false;
		selectedItemForStowing = null;
	}

	function handleUnstow(item: InventoryItem) {
		if (onUnstowItem) {
			onUnstowItem(item.equipment.id);
		}
	}

	// ========================================
	// Drag and Drop Handlers
	// ========================================

	function handleDragStart(event: DragEvent, item: InventoryItem) {
		if (!event.dataTransfer) return;

		draggedItem = item;
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', item.equipment.id);

		// Add a semi-transparent drag image
		if (event.target instanceof HTMLElement) {
			event.target.style.opacity = '0.5';
		}
	}

	function handleDragEnd(event: DragEvent) {
		draggedItem = null;
		dragOverContainerId = null;
		dragOverUnstow = false;

		// Reset opacity
		if (event.target instanceof HTMLElement) {
			event.target.style.opacity = '1';
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	function handleContainerDragOver(event: DragEvent, containerId: string) {
		event.preventDefault();
		if (!draggedItem) return;

		// Check if this is a valid drop
		const container = availableContainers.find((c) => c.equipment.id === containerId);
		if (!container) return;

		// Can't drop a container into itself
		if (draggedItem.equipment.id === containerId) {
			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = 'none';
			}
			return;
		}

		// Check capacity for limited containers
		if (hasCapacityLimit(container)) {
			const currentBulk = getContainerCurrentBulk(containerId);
			const capacity = getContainerCapacity(container);
			const itemBulk = draggedItem.equipment.bulk.value * draggedItem.quantity;

			// If item is already in this container, don't count it
			const effectiveCurrentBulk = draggedItem.containerId === containerId
				? currentBulk - itemBulk
				: currentBulk;

			if (effectiveCurrentBulk + itemBulk > capacity) {
				if (event.dataTransfer) {
					event.dataTransfer.dropEffect = 'none';
				}
				return;
			}
		}

		dragOverContainerId = containerId;
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	function handleContainerDragLeave() {
		dragOverContainerId = null;
	}

	function handleContainerDrop(event: DragEvent, containerId: string) {
		event.preventDefault();
		dragOverContainerId = null;

		if (!draggedItem || !onStowItem) return;

		// Can't drop a container into itself
		if (draggedItem.equipment.id === containerId) return;

		const container = availableContainers.find((c) => c.equipment.id === containerId);
		if (!container) return;

		// Check capacity for limited containers
		if (hasCapacityLimit(container)) {
			const currentBulk = getContainerCurrentBulk(containerId);
			const capacity = getContainerCapacity(container);
			const itemBulk = draggedItem.equipment.bulk.value * draggedItem.quantity;

			// If item is already in this container, don't count it
			const effectiveCurrentBulk = draggedItem.containerId === containerId
				? currentBulk - itemBulk
				: currentBulk;

			if (effectiveCurrentBulk + itemBulk > capacity) {
				alert(
					`Cannot stow ${draggedItem.equipment.name}: ` +
					`${container.equipment.name} is full (${effectiveCurrentBulk.toFixed(1)}/${capacity} Bulk). ` +
					`This item would add ${itemBulk.toFixed(1)} Bulk.`
				);
				return;
			}
		}

		onStowItem(draggedItem.equipment.id, containerId);
		draggedItem = null;
	}

	function handleUnstowDragOver(event: DragEvent) {
		event.preventDefault();
		if (!draggedItem || !draggedItem.containerId) {
			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = 'none';
			}
			return;
		}

		dragOverUnstow = true;
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	function handleUnstowDragLeave() {
		dragOverUnstow = false;
	}

	function handleUnstowDrop(event: DragEvent) {
		event.preventDefault();
		dragOverUnstow = false;

		if (!draggedItem || !draggedItem.containerId || !onUnstowItem) return;

		onUnstowItem(draggedItem.equipment.id);
		draggedItem = null;
	}

	// Check if an item can be dragged
	function canDragItem(item: InventoryItem): boolean {
		// Can't drag worn items
		if (item.worn) return false;

		// Can't drag containers (for now - could allow later)
		if (isContainer(item)) return false;

		return true;
	}
</script>

<div class="container-aware-inventory">
	<!-- Always show container-aware layout -->
	<div class="inventory-with-containers">
		<div class="list-header">
			<h3 class="list-title">{title}</h3>
		</div>

		<!-- Containers Section (only if containers are in current tab) -->
		{#if containersInCurrentTab.length > 0}
			<div class="containers-section">
				<h4 class="section-subtitle">Containers</h4>
				{#each containersInCurrentTab as container}
						{@const containedItems = getItemsInContainer(container.equipment.id)}
						<div
							class="container-item"
							class:drag-over={dragOverContainerId === container.equipment.id}
							ondragover={(e) => handleContainerDragOver(e, container.equipment.id)}
							ondragleave={handleContainerDragLeave}
							ondrop={(e) => handleContainerDrop(e, container.equipment.id)}
						>
							<div class="container-header">
								<div class="container-info">
									<h5 class="container-name">{container.equipment.name}</h5>
									<div class="container-meta">
										<span class="meta-item">
											<strong>Items:</strong>
											{containedItems.length}
										</span>
										{#if hasCapacityLimit(container)}
											<span class="meta-item">
												<strong>Capacity:</strong>
												{getContainerCurrentBulk(container.equipment.id).toFixed(1)}/{getContainerCapacity(container)} Bulk
											</span>
										{:else}
											<span class="meta-item">
												<strong>Contents:</strong>
												{getContainerCurrentBulk(container.equipment.id).toFixed(1)} Bulk
											</span>
										{/if}
										<span class="meta-item">
											<strong>Container Bulk:</strong>
											{container.equipment.bulk.display}
										</span>
										{#if container.quantity > 1}
											<span class="quantity-badge">×{container.quantity}</span>
										{/if}
									</div>
								</div>
								<div class="container-actions">
									<Button variant="secondary" size="sm" onclick={() => onViewDetails?.(container)}>
										Details
									</Button>
									{#if onRemoveItem}
										<Button variant="ghost" size="sm" onclick={() => onRemoveItem(container)}>
											Remove
										</Button>
									{/if}
								</div>
							</div>

							{#if containedItems.length > 0}
								<div class="contained-items">
									{#each containedItems as item}
										<div
											class="nested-item"
											class:draggable={canDragItem(item)}
											draggable={canDragItem(item)}
											ondragstart={(e) => handleDragStart(e, item)}
											ondragend={handleDragEnd}
										>
											<div class="nested-item-info">
												<span class="nested-item-name">{item.equipment.name}</span>
												{#if item.quantity > 1}
													<span class="quantity-badge-sm">×{item.quantity}</span>
												{/if}
												<span class="nested-item-meta">
													Bulk: {item.equipment.bulk.display}
												</span>
											</div>
											<div class="nested-item-actions">
												<Button
													variant="ghost"
													size="sm"
													onclick={() => onViewDetails?.(item)}
												>
													Details
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onclick={() => handleUnstow(item)}
												>
													Remove from Container
												</Button>
												{#if onRemoveItem}
													<Button
														variant="ghost"
														size="sm"
														onclick={() => onRemoveItem(item)}
													>
														Delete
													</Button>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="empty-container">
									<p>This container is empty.</p>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

		<!-- Unstow Drop Zone (only show when dragging an item from a container) -->
		{#if draggedItem && draggedItem.containerId}
			<div
				class="unstow-zone"
				class:drag-over={dragOverUnstow}
				ondragover={handleUnstowDragOver}
				ondragleave={handleUnstowDragLeave}
				ondrop={handleUnstowDrop}
			>
				<div class="unstow-zone-content">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M9 11V6L7 8M9 6l2 2M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					<span>Drop here to remove from container</span>
				</div>
			</div>
		{/if}

		<!-- Regular Items Section (items not in containers) -->
		<div class="regular-items-section">
				<h4 class="section-subtitle">Items</h4>
				{#if topLevelItems.filter((item) => !isContainer(item)).length === 0}
					<div class="empty-state">
						<p>No items to display.</p>
					</div>
				{:else}
					{#each topLevelItems.filter((item) => !isContainer(item)) as item}
						<div
							class="item-card"
							class:draggable={canDragItem(item)}
							draggable={canDragItem(item)}
							ondragstart={(e) => handleDragStart(e, item)}
							ondragend={handleDragEnd}
						>
							<div class="item-info">
								<div class="item-header-row">
									<h5 class="item-name">{item.equipment.name}</h5>
									{#if item.quantity > 1}
										<span class="quantity-badge">×{item.quantity}</span>
									{/if}
								</div>

								<div class="item-meta">
									<span class="meta-item">
										<strong>Level:</strong>
										{item.equipment.level}
									</span>
									<span class="meta-item">
										<strong>Bulk:</strong>
										{item.equipment.bulk.display}
									</span>
									<span class="meta-item">
										<strong>Price:</strong>
										{item.equipment.price.display}
									</span>
								</div>

								<div class="item-status">
									{#if item.worn}
										<span class="status-badge worn">Worn</span>
									{/if}
									{#if item.invested}
										<span class="status-badge invested">Invested</span>
									{/if}
								</div>
							</div>

							<div class="item-actions">
								<Button variant="secondary" size="sm" onclick={() => onViewDetails?.(item)}>
									Details
								</Button>

								{#if onToggleWorn}
									<Button
										variant="ghost"
										size="sm"
										onclick={() => onToggleWorn(item)}
										title={item.worn ? 'Unequip' : 'Equip'}
									>
										{item.worn ? 'Unequip' : 'Equip'}
									</Button>
								{/if}

								{#if onToggleInvested && item.equipment.traits.includes('invested')}
									<Button
										variant="ghost"
										size="sm"
										onclick={() => onToggleInvested(item)}
										title={item.invested ? 'Uninvest' : 'Invest'}
									>
										{item.invested ? 'Uninvest' : 'Invest'}
									</Button>
								{/if}

								{#if canBeStowed(item) && availableContainers.length > 0}
									<Button
										variant="ghost"
										size="sm"
										onclick={() => handleStowClick(item)}
									>
										Stow
									</Button>
								{/if}

								{#if onRemoveItem}
									<Button variant="ghost" size="sm" onclick={() => onRemoveItem(item)}>
										Remove
									</Button>
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
</div>

<!-- Stow Modal -->
{#if showStowModal && selectedItemForStowing}
	<div class="modal-overlay" onclick={handleCancelStow}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Stow {selectedItemForStowing.equipment.name}</h3>
				<button
					class="modal-close"
					onclick={handleCancelStow}
					aria-label="Close modal"
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M18 6L6 18M6 6L18 18"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>
			</div>

			<div class="modal-body">
				<p>Choose a container:</p>
				<div class="container-choices">
					{#each availableContainers as container}
						{@const itemsInContainer = getItemsInContainer(container.equipment.id)}
						{@const currentBulk = getContainerCurrentBulk(container.equipment.id)}
						{@const capacity = getContainerCapacity(container)}
						{@const itemBulk = selectedItemForStowing ? selectedItemForStowing.equipment.bulk.value * selectedItemForStowing.quantity : 0}
						{@const willFit = currentBulk + itemBulk <= capacity}
						{@const limited = hasCapacityLimit(container)}
						<button
							class="container-choice"
							class:container-full={!willFit && limited}
							onclick={() => handleConfirmStow(container.equipment.id)}
							disabled={!willFit && limited}
						>
							<span class="container-choice-name">
								{container.equipment.name}
								{#if !willFit && limited}
									<span class="full-badge">(Full)</span>
								{/if}
							</span>
							<span class="container-choice-info">
								{itemsInContainer.length} items •
								{#if limited}
									{currentBulk.toFixed(1)}/{capacity} Bulk capacity
								{:else}
									{currentBulk.toFixed(1)} Bulk
								{/if}
							</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="modal-footer">
				<Button variant="ghost" onclick={handleCancelStow}>Cancel</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.container-aware-inventory {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.inventory-with-containers {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.list-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.list-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.section-subtitle {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		padding-bottom: 0.5rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	/* Container Styles */
	.container-item {
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1rem;
		background: var(--surface-1, #ffffff);
		transition: all 0.2s ease;
	}

	.container-item.drag-over {
		border-color: var(--link-color, #5c7cfa);
		background-color: rgba(92, 124, 250, 0.05);
		box-shadow: 0 0 0 3px rgba(92, 124, 250, 0.1);
	}

	.container-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 0.75rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border-color, #e0e0e0);
	}

	.container-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.container-name {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.container-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
	}

	.meta-item {
		display: flex;
		gap: 0.25rem;
	}

	.container-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.contained-items {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.nested-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-left: 1.5rem;
		padding: 0.75rem;
		border-left: 3px solid var(--border-color, #e0e0e0);
		background: var(--surface-2, #f5f5f5);
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.nested-item-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
	}

	.nested-item-name {
		font-weight: 500;
		color: var(--text-primary, #1a1a1a);
	}

	.nested-item-meta {
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
	}

	.nested-item-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.empty-container {
		margin-left: 1.5rem;
		padding: 1rem;
		text-align: center;
		color: var(--text-secondary, #666666);
		font-size: 0.875rem;
		font-style: italic;
	}

	.empty-container p {
		margin: 0;
	}

	/* Regular Items */
	.regular-items-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.item-card {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		transition: all 0.2s;
	}

	.item-card:hover {
		border-color: var(--link-color, #5c7cfa);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.item-card.draggable,
	.nested-item.draggable {
		cursor: grab;
	}

	.item-card.draggable:active,
	.nested-item.draggable:active {
		cursor: grabbing;
	}

	.item-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.item-header-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.item-name {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.quantity-badge {
		padding: 0.25rem 0.5rem;
		background-color: var(--link-color, #5c7cfa);
		color: white;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.quantity-badge-sm {
		padding: 0.125rem 0.375rem;
		background-color: var(--link-color, #5c7cfa);
		color: white;
		border-radius: 3px;
		font-size: 0.625rem;
		font-weight: 600;
	}

	.item-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		font-size: 0.8125rem;
		color: var(--text-secondary, #666666);
	}

	.item-status {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.status-badge {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.status-badge.worn {
		background-color: rgba(40, 167, 69, 0.2);
		color: var(--success-color, #28a745);
		border: 1px solid var(--success-color, #28a745);
	}

	.status-badge.invested {
		background-color: rgba(92, 124, 250, 0.2);
		color: var(--link-color, #5c7cfa);
		border: 1px solid var(--link-color, #5c7cfa);
	}

	.item-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: flex-end;
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		color: var(--text-secondary, #666666);
	}

	.empty-state p {
		margin: 0;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		padding: 1rem;
	}

	.modal-content {
		background-color: var(--surface-1, #ffffff);
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		max-width: 500px;
		width: 100%;
		max-height: 80vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.modal-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0.25rem;
		background: none;
		border: none;
		border-radius: 6px;
		color: var(--text-secondary, #666666);
		cursor: pointer;
		transition: all var(--transition-fast, 0.2s);
	}

	.modal-close:hover {
		background-color: var(--surface-2, #f5f5f5);
		color: var(--text-primary, #1a1a1a);
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
	}

	.modal-body p {
		margin: 0 0 1rem 0;
		font-size: 0.9375rem;
		color: var(--text-secondary, #666666);
	}

	.container-choices {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.container-choice {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		font-family: inherit;
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast, 0.2s);
	}

	.container-choice:hover:not(:disabled) {
		background-color: var(--surface-3, #e0e0e0);
		border-color: var(--link-color, #5c7cfa);
	}

	.container-choice:disabled,
	.container-choice.container-full {
		opacity: 0.5;
		cursor: not-allowed;
		background-color: var(--surface-2, #f5f5f5);
	}

	.container-choice-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.full-badge {
		color: var(--danger-color, #dc3545);
		font-size: 0.875rem;
		font-weight: 500;
		margin-left: 0.5rem;
	}

	.container-choice-info {
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}

	/* Unstow Drop Zone */
	.unstow-zone {
		margin-bottom: 1.5rem;
		padding: 2rem;
		border: 3px dashed var(--border-color, #e0e0e0);
		border-radius: 12px;
		background-color: var(--surface-2, #f5f5f5);
		transition: all 0.3s ease;
	}

	.unstow-zone.drag-over {
		border-color: var(--link-color, #5c7cfa);
		background-color: rgba(92, 124, 250, 0.05);
		box-shadow: 0 0 0 3px rgba(92, 124, 250, 0.1);
	}

	.unstow-zone-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		color: var(--text-secondary, #666666);
	}

	.unstow-zone.drag-over .unstow-zone-content {
		color: var(--link-color, #5c7cfa);
	}

	.unstow-zone-content svg {
		opacity: 0.6;
	}

	.unstow-zone.drag-over .unstow-zone-content svg {
		opacity: 1;
	}

	.unstow-zone-content span {
		font-size: 0.9375rem;
		font-weight: 500;
	}

	/* Mobile */
	@media (max-width: 768px) {
		.item-card,
		.nested-item {
			flex-direction: column;
		}

		.item-actions,
		.nested-item-actions,
		.container-actions {
			flex-direction: row;
			width: 100%;
			flex-wrap: wrap;
		}

		.unstow-zone {
			padding: 1.5rem 1rem;
		}

		.unstow-zone-content span {
			font-size: 0.875rem;
			text-align: center;
		}
	}
</style>
