<script lang="ts">
	import type { Equipment } from '$lib/data/types/app';
	import Button from '../common/Button.svelte';

	/**
	 * InventoryList Component
	 *
	 * Displays a character's inventory with filtering and grouping.
	 * Shows equipment status (worn, carried, invested), quantity, and bulk.
	 */

	export interface InventoryItem {
		equipment: Equipment;
		quantity: number;
		worn: boolean; // Equipped on the body
		invested: boolean; // Invested for magic items
		containerId?: string; // ID of container holding this item
	}

	interface Props {
		/** Array of inventory items */
		items: InventoryItem[];

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

		/** Title for the list */
		title?: string;

		/** External type filter (from tabs) - when set, disables the type dropdown */
		externalTypeFilter?: string[];
	}

	let {
		items,
		onViewDetails,
		onToggleWorn,
		onToggleInvested,
		onRemoveItem,
		title = 'Inventory',
		externalTypeFilter
	}: Props = $props();

	let searchQuery = $state('');
	let filterType = $state<string>('all');
	let filterWorn = $state<string>('all'); // all, worn, carried

	// Get unique equipment types
	const equipmentTypes = $derived.by(() => {
		const types = new Set(items.map((item) => item.equipment.equipmentType));
		return ['all', ...Array.from(types).sort()];
	});

	// Filter items
	const filteredItems = $derived.by(() => {
		return items.filter((item) => {
			// External filter from tabs (takes precedence)
			if (externalTypeFilter && !externalTypeFilter.includes(item.equipment.equipmentType)) {
				return false;
			}

			// Search filter
			if (searchQuery && !item.equipment.name.toLowerCase().includes(searchQuery.toLowerCase())) {
				return false;
			}

			// Type filter (only if no external filter)
			if (!externalTypeFilter && filterType !== 'all' && item.equipment.equipmentType !== filterType) {
				return false;
			}

			// Worn filter
			if (filterWorn === 'worn' && !item.worn) {
				return false;
			} else if (filterWorn === 'carried' && item.worn) {
				return false;
			}

			return true;
		});
	});

	// Group items by equipment type
	const itemsByType = $derived.by(() => {
		const grouped = new Map<string, InventoryItem[]>();

		for (const item of filteredItems) {
			const type = item.equipment.equipmentType;
			if (!grouped.has(type)) {
				grouped.set(type, []);
			}
			grouped.get(type)!.push(item);
		}

		// Sort within each group by name
		for (const itemList of grouped.values()) {
			itemList.sort((a, b) => a.equipment.name.localeCompare(b.equipment.name));
		}

		return grouped;
	});

	// Get sorted types
	const types = $derived(Array.from(itemsByType.keys()).sort());

	// Calculate total bulk
	const totalBulk = $derived(
		items.reduce((sum, item) => sum + item.equipment.bulk.value * item.quantity, 0)
	);

	function clearFilters() {
		searchQuery = '';
		filterType = 'all';
		filterWorn = 'all';
	}

	function formatEquipmentType(type: string): string {
		return type
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
</script>

<div class="inventory-list">
	<div class="list-header">
		<h3 class="list-title">{title}</h3>
		<div class="header-stats">
			<span class="item-count">{filteredItems.length} items</span>
			<span class="bulk-total">Total Bulk: {totalBulk.toFixed(1)}</span>
		</div>
	</div>

	<!-- Filters -->
	<div class="filters">
		<input
			type="search"
			bind:value={searchQuery}
			placeholder="Search items..."
			class="search-input"
			aria-label="Search items"
		/>

		<select
			bind:value={filterType}
			class="filter-select"
			aria-label="Filter by type"
			disabled={!!externalTypeFilter}
		>
			{#each equipmentTypes as type}
				<option value={type}>{type === 'all' ? 'All Types' : formatEquipmentType(type)}</option>
			{/each}
		</select>

		<select bind:value={filterWorn} class="filter-select" aria-label="Filter by status">
			<option value="all">All Items</option>
			<option value="worn">Worn/Equipped</option>
			<option value="carried">Carried</option>
		</select>

		<Button variant="ghost" size="sm" onclick={clearFilters}>Clear</Button>
	</div>

	<!-- Item Groups by Type -->
	<div class="item-groups">
		{#if types.length === 0}
			<div class="empty-state">
				<p>No items found matching your criteria.</p>
			</div>
		{:else}
			{#each types as type}
				{@const typeItems = itemsByType.get(type) ?? []}
				<div class="type-group">
					<h4 class="type-header">
						{formatEquipmentType(type)}
						<span class="type-count">({typeItems.length})</span>
					</h4>

					<div class="item-cards">
						{#each typeItems as item}
							<div class="item-card">
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
											{#if item.quantity > 1}
												(Total: {(item.equipment.bulk.value * item.quantity).toFixed(1)})
											{/if}
										</span>
										<span class="meta-item">
											<strong>Price:</strong>
											{item.equipment.price.display}
										</span>
									</div>

									{#if item.equipment.traits && item.equipment.traits.length > 0}
										<div class="item-traits">
											{#each item.equipment.traits.slice(0, 3) as trait}
												<span class="trait-badge">{trait}</span>
											{/each}
											{#if item.equipment.traits.length > 3}
												<span class="trait-badge">+{item.equipment.traits.length - 3} more</span>
											{/if}
										</div>
									{/if}

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

									{#if onRemoveItem}
										<Button variant="ghost" size="sm" onclick={() => onRemoveItem(item)}>
											Remove
										</Button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.inventory-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.list-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.list-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.header-stats {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.item-count,
	.bulk-total {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
		background-color: var(--surface-2, #f5f5f5);
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
	}

	.filters {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.search-input {
		flex: 1;
		min-width: 200px;
		padding: 0.625rem 1rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-size: 0.9375rem;
		font-family: inherit;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--focus-color, #5c7cfa);
	}

	.filter-select {
		padding: 0.625rem 1rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-size: 0.9375rem;
		font-family: inherit;
		background-color: white;
		min-width: 140px;
	}

	.filter-select:focus {
		outline: none;
		border-color: var(--focus-color, #5c7cfa);
	}

	.item-groups {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.type-group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.type-header {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		padding-bottom: 0.5rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.type-count {
		font-size: 0.875rem;
		font-weight: 400;
		color: var(--text-secondary, #666666);
	}

	.item-cards {
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

	.item-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		font-size: 0.8125rem;
		color: var(--text-secondary, #666666);
	}

	.meta-item {
		display: flex;
		gap: 0.25rem;
	}

	.item-traits {
		display: flex;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.trait-badge {
		padding: 0.25rem 0.5rem;
		background-color: var(--surface-3, #e0e0e0);
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
		text-transform: capitalize;
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
		padding: 3rem;
		text-align: center;
		color: var(--text-secondary, #666666);
	}

	.empty-state p {
		margin: 0;
	}

	/* Mobile */
	@media (max-width: 768px) {
		.item-card {
			flex-direction: column;
		}

		.item-actions {
			flex-direction: row;
			width: 100%;
			flex-wrap: wrap;
		}

		.filters {
			flex-direction: column;
		}

		.search-input,
		.filter-select {
			width: 100%;
			min-width: 0;
		}

		.list-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.header-stats {
			width: 100%;
			flex-direction: column;
			align-items: flex-start;
		}

		.item-count,
		.bulk-total {
			width: 100%;
		}
	}
</style>
