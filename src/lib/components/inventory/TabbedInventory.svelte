<script lang="ts">
	import ContainerAwareInventoryList from './ContainerAwareInventoryList.svelte';
	import type { InventoryItem } from './InventoryList.svelte';

	/**
	 * TabbedInventory Component
	 *
	 * Displays inventory items organized into tabs by equipment type.
	 * Provides context-aware navigation for weapons, armor, and gear.
	 */

	interface Props {
		/** Array of all inventory items */
		items: InventoryItem[];

		/** Currently active tab */
		activeTab: 'weapons' | 'armor' | 'gear';

		/** Callback when tab changes */
		// eslint-disable-next-line no-unused-vars
		onTabChange: (tab: 'weapons' | 'armor' | 'gear') => void;

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
		activeTab = $bindable(),
		onTabChange,
		onViewDetails,
		onToggleWorn,
		onToggleInvested,
		onRemoveItem,
		onStowItem,
		onUnstowItem
	}: Props = $props();

	// Tab configuration with type filters
	const tabFilters = {
		weapons: ['weapon'],
		armor: ['armor', 'shield'],
		gear: ['consumable', 'adventuring-gear', 'other']
	};

	// Filter items based on active tab (for display)
	const filteredItems = $derived.by(() => {
		const allowedTypes = tabFilters[activeTab];
		return items.filter((item) => allowedTypes.includes(item.equipment.equipmentType));
	});

	// Get all containers (needed for stowing items from any tab)
	const allContainers = $derived.by(() => {
		return items.filter((item) => {
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
		});
	});

	// Calculate item counts per tab
	const weaponCount = $derived(
		items.filter((item) => tabFilters.weapons.includes(item.equipment.equipmentType)).length
	);
	const armorCount = $derived(
		items.filter((item) => tabFilters.armor.includes(item.equipment.equipmentType)).length
	);
	const gearCount = $derived(
		items.filter((item) => tabFilters.gear.includes(item.equipment.equipmentType)).length
	);

	// Keyboard navigation
	function handleKeydown(event: KeyboardEvent, tab: 'weapons' | 'armor' | 'gear') {
		const tabs: Array<'weapons' | 'armor' | 'gear'> = ['weapons', 'armor', 'gear'];
		const currentIndex = tabs.indexOf(activeTab);

		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				if (currentIndex > 0) {
					const newTab = tabs[currentIndex - 1];
					activeTab = newTab;
					onTabChange(newTab);
					// Focus the new tab
					setTimeout(() => {
						const tabButton = document.querySelector(
							`[data-tab="${newTab}"]`
						) as HTMLButtonElement;
						tabButton?.focus();
					}, 0);
				}
				break;
			case 'ArrowRight':
				event.preventDefault();
				if (currentIndex < tabs.length - 1) {
					const newTab = tabs[currentIndex + 1];
					activeTab = newTab;
					onTabChange(newTab);
					// Focus the new tab
					setTimeout(() => {
						const tabButton = document.querySelector(
							`[data-tab="${newTab}"]`
						) as HTMLButtonElement;
						tabButton?.focus();
					}, 0);
				}
				break;
			case 'Home':
				event.preventDefault();
				activeTab = 'weapons';
				onTabChange('weapons');
				setTimeout(() => {
					const tabButton = document.querySelector('[data-tab="weapons"]') as HTMLButtonElement;
					tabButton?.focus();
				}, 0);
				break;
			case 'End':
				event.preventDefault();
				activeTab = 'gear';
				onTabChange('gear');
				setTimeout(() => {
					const tabButton = document.querySelector('[data-tab="gear"]') as HTMLButtonElement;
					tabButton?.focus();
				}, 0);
				break;
		}
	}

	function handleTabClick(tab: 'weapons' | 'armor' | 'gear') {
		activeTab = tab;
		onTabChange(tab);
	}
</script>

<div class="tabbed-inventory">
	<!-- Tab Navigation -->
	<div role="tablist" aria-label="Inventory categories" class="inventory-tabs">
		<button
			role="tab"
			aria-selected={activeTab === 'weapons'}
			aria-controls="weapons-panel"
			tabindex={activeTab === 'weapons' ? 0 : -1}
			class="inventory-tab"
			data-tab="weapons"
			onclick={() => handleTabClick('weapons')}
			onkeydown={(e) => handleKeydown(e, 'weapons')}
		>
			Weapons <span class="tab-count">({weaponCount})</span>
		</button>

		<button
			role="tab"
			aria-selected={activeTab === 'armor'}
			aria-controls="armor-panel"
			tabindex={activeTab === 'armor' ? 0 : -1}
			class="inventory-tab"
			data-tab="armor"
			onclick={() => handleTabClick('armor')}
			onkeydown={(e) => handleKeydown(e, 'armor')}
		>
			Armor <span class="tab-count">({armorCount})</span>
		</button>

		<button
			role="tab"
			aria-selected={activeTab === 'gear'}
			aria-controls="gear-panel"
			tabindex={activeTab === 'gear' ? 0 : -1}
			class="inventory-tab"
			data-tab="gear"
			onclick={() => handleTabClick('gear')}
			onkeydown={(e) => handleKeydown(e, 'gear')}
		>
			Gear <span class="tab-count">({gearCount})</span>
		</button>
	</div>

	<!-- Tab Panels -->
	<div
		role="tabpanel"
		id="weapons-panel"
		aria-labelledby="weapons-tab"
		hidden={activeTab !== 'weapons'}
		class="tab-panel"
	>
		{#if activeTab === 'weapons'}
			{#if filteredItems.length === 0}
				<div class="empty-state">
					<p>No weapons in inventory.</p>
					<p class="empty-help">Browse the Equipment Shop to add some.</p>
				</div>
			{:else}
				<ContainerAwareInventoryList
					items={filteredItems}
					allItems={items}
					availableContainers={allContainers}
					title="Weapons"
					externalTypeFilter={tabFilters.weapons}
					onViewDetails={onViewDetails}
					onToggleWorn={onToggleWorn}
					onToggleInvested={onToggleInvested}
					onRemoveItem={onRemoveItem}
					onStowItem={onStowItem}
					onUnstowItem={onUnstowItem}
				/>
			{/if}
		{/if}
	</div>

	<div
		role="tabpanel"
		id="armor-panel"
		aria-labelledby="armor-tab"
		hidden={activeTab !== 'armor'}
		class="tab-panel"
	>
		{#if activeTab === 'armor'}
			{#if filteredItems.length === 0}
				<div class="empty-state">
					<p>No armor or shields in inventory.</p>
					<p class="empty-help">Browse the Equipment Shop to add some.</p>
				</div>
			{:else}
				<ContainerAwareInventoryList
					items={filteredItems}
					allItems={items}
					availableContainers={allContainers}
					title="Armor & Shields"
					externalTypeFilter={tabFilters.armor}
					onViewDetails={onViewDetails}
					onToggleWorn={onToggleWorn}
					onToggleInvested={onToggleInvested}
					onRemoveItem={onRemoveItem}
					onStowItem={onStowItem}
					onUnstowItem={onUnstowItem}
				/>
			{/if}
		{/if}
	</div>

	<div
		role="tabpanel"
		id="gear-panel"
		aria-labelledby="gear-tab"
		hidden={activeTab !== 'gear'}
		class="tab-panel"
	>
		{#if activeTab === 'gear'}
			{#if filteredItems.length === 0}
				<div class="empty-state">
					<p>No gear in inventory.</p>
					<p class="empty-help">Browse the Equipment Shop to add consumables and adventuring gear.</p>
				</div>
			{:else}
				<ContainerAwareInventoryList
					items={filteredItems}
					allItems={items}
					availableContainers={allContainers}
					title="Gear & Consumables"
					externalTypeFilter={tabFilters.gear}
					onViewDetails={onViewDetails}
					onToggleWorn={onToggleWorn}
					onToggleInvested={onToggleInvested}
					onRemoveItem={onRemoveItem}
					onStowItem={onStowItem}
					onUnstowItem={onUnstowItem}
				/>
			{/if}
		{/if}
	</div>
</div>

<style>
	.tabbed-inventory {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.inventory-tabs {
		display: flex;
		gap: 0;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
		margin-bottom: 1.5rem;
	}

	.inventory-tab {
		padding: 0.75rem 1.5rem;
		border: none;
		background: none;
		border-bottom: 3px solid transparent;
		color: var(--text-secondary, #666666);
		font-weight: 500;
		font-size: 0.9375rem;
		font-family: inherit;
		cursor: pointer;
		transition: all var(--transition-fast, 0.2s);
		white-space: nowrap;
		margin-bottom: -2px;
	}

	.inventory-tab[aria-selected='true'] {
		color: var(--link-color, #5c7cfa);
		border-bottom-color: var(--link-color, #5c7cfa);
		font-weight: 600;
	}

	.inventory-tab:hover:not([aria-selected='true']) {
		color: var(--text-primary, #1a1a1a);
		background-color: var(--surface-2, #f5f5f5);
	}

	.inventory-tab:focus {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: -2px;
		z-index: 1;
	}

	.tab-count {
		font-size: 0.875rem;
		color: var(--text-tertiary, #999999);
		margin-left: 0.25rem;
	}

	.inventory-tab[aria-selected='true'] .tab-count {
		color: var(--link-color, #5c7cfa);
	}

	.tab-panel {
		display: block;
	}

	.tab-panel[hidden] {
		display: none;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 3rem;
		text-align: center;
		color: var(--text-secondary, #666666);
	}

	.empty-state p {
		margin: 0;
		font-size: 1rem;
	}

	.empty-help {
		font-size: 0.875rem;
		color: var(--text-tertiary, #999999);
		max-width: 300px;
	}

	/* Mobile */
	@media (max-width: 768px) {
		.inventory-tab {
			padding: 0.625rem 1rem;
			font-size: 0.875rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.inventory-tab {
			transition: none;
		}
	}
</style>
