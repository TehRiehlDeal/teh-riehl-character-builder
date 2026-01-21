<script lang="ts">
	import { onMount } from 'svelte';
	import type { Equipment } from '$lib/data/types/app';
	import { getAllEquipment, getEquipmentById } from '$lib/data/repositories/equipmentRepository';
	import { character } from '$lib/stores/character';
	import BulkTracker from '$lib/components/inventory/BulkTracker.svelte';
	import InventoryList from '$lib/components/inventory/InventoryList.svelte';
	import EquipmentDetail from '$lib/components/inventory/EquipmentDetail.svelte';
	import EquipmentBrowser from '$lib/components/inventory/EquipmentBrowser.svelte';
	import WealthTracker from '$lib/components/inventory/WealthTracker.svelte';
	import type { InventoryItem } from '$lib/components/inventory/InventoryList.svelte';

	let allEquipment = $state<Equipment[]>([]);
	let loading = $state(true);
	let selectedEquipment = $state<Equipment | null>(null);
	let showEquipmentDetail = $state(false);
	let showBrowser = $state(false);

	// Load equipment data for inventory items
	let inventoryItems = $state<InventoryItem[]>([]);

	// Get strength modifier from character
	const strengthModifier = $derived(
		$character?.abilities?.strength
			? Math.floor(($character.abilities.strength - 10) / 2)
			: 0
	);

	// Get wealth with defaults (in case older character data doesn't have wealth)
	const wealth = $derived($character?.wealth || { pp: 0, gp: 0, sp: 0, cp: 0 });

	onMount(async () => {
		try {
			allEquipment = await getAllEquipment();

			// Load equipment data for inventory items
			if ($character?.inventory) {
				await loadInventoryItems();
			}
		} catch (error) {
			console.error('Failed to load equipment:', error);
		} finally {
			loading = false;
		}
	});

	// Load equipment details for inventory items from character store
	async function loadInventoryItems() {
		if (!$character?.inventory) return;

		const items: InventoryItem[] = [];
		for (const charItem of $character.inventory) {
			try {
				const equipment = await getEquipmentById(charItem.itemId);
				if (equipment) {
					items.push({
						equipment,
						quantity: charItem.quantity,
						worn: charItem.worn,
						invested: charItem.invested,
						containerId: charItem.containerId
					});
				}
			} catch (error) {
				console.warn(`Failed to load equipment ${charItem.itemId}:`, error);
			}
		}
		inventoryItems = items;
	}

	// Watch for character inventory changes and reload
	$effect(() => {
		if ($character?.inventory) {
			loadInventoryItems();
		}
	});

	// Calculate total bulk
	const totalBulk = $derived(
		inventoryItems.reduce((sum, item) => sum + item.equipment.bulk.value * item.quantity, 0)
	);

	function handleViewDetails(item: InventoryItem) {
		selectedEquipment = item.equipment;
		showEquipmentDetail = true;
	}

	function handleToggleWorn(item: InventoryItem) {
		const equipmentType = item.equipment.equipmentType;

		// If item is currently worn, unwear/unequip it
		if (item.worn) {
			// Unequip from equipment slots
			if (equipmentType === 'armor' && $character.equipment.armor?.itemId === item.equipment.id) {
				character.unequipArmor();
			} else if (equipmentType === 'shield' && $character.equipment.shield?.itemId === item.equipment.id) {
				character.unequipShield();
			} else if (equipmentType === 'weapon') {
				character.unequipWeapon(item.equipment.id);
			}

			// Toggle worn status in inventory
			character.toggleItemWorn(item.equipment.id);
		} else {
			// Equip the item
			if (equipmentType === 'armor') {
				// Unequip current armor if any
				if ($character.equipment.armor) {
					character.toggleItemWorn($character.equipment.armor.itemId);
				}
				// Equip new armor
				character.equipArmor(item.equipment.id, item.equipment.name);
			} else if (equipmentType === 'shield') {
				// Unequip current shield if any
				if ($character.equipment.shield) {
					character.toggleItemWorn($character.equipment.shield.itemId);
				}
				// Equip new shield
				character.equipShield(item.equipment.id, item.equipment.name);
			} else if (equipmentType === 'weapon') {
				// Add weapon to equipped weapons
				character.equipWeapon(item.equipment.id, item.equipment.name);
			}

			// Toggle worn status in inventory
			character.toggleItemWorn(item.equipment.id);
		}
	}

	function handleToggleInvested(item: InventoryItem) {
		character.toggleItemInvested(item.equipment.id);
	}

	function handleRemoveItem(item: InventoryItem) {
		character.removeInventoryItem(item.equipment.id);
	}

	function handleCloseDetail() {
		showEquipmentDetail = false;
		selectedEquipment = null;
	}

	function handleOpenBrowser() {
		showBrowser = true;
	}

	function handleCloseBrowser() {
		showBrowser = false;
	}

	function handleAddToInventory(equipment: Equipment, quantity: number) {
		// Check if item already exists in inventory
		const existing = $character.inventory.find((item) => item.itemId === equipment.id);

		if (existing) {
			// Update quantity
			character.updateItemQuantity(equipment.id, existing.quantity + quantity);
		} else {
			// Add new item
			character.addInventoryItem(equipment.id, equipment.name, quantity);
		}
	}

	function handlePurchaseEquipment(equipment: Equipment, quantity: number) {
		// Calculate total cost in copper pieces
		const totalCostCp = equipment.price.value * quantity;

		// Get current wealth in copper pieces
		const currentWealthCp =
			wealth.pp * 1000 +
			wealth.gp * 100 +
			wealth.sp * 10 +
			wealth.cp;

		// Check if character can afford it
		if (currentWealthCp < totalCostCp) {
			alert(`Insufficient funds! You need ${(totalCostCp / 100).toFixed(2)} gp but only have ${(currentWealthCp / 100).toFixed(2)} gp.`);
			return;
		}

		// Deduct cost from wealth
		const remainingCp = currentWealthCp - totalCostCp;

		// Convert remaining copper to currency denominations
		const newPp = Math.floor(remainingCp / 1000);
		const newGp = Math.floor((remainingCp % 1000) / 100);
		const newSp = Math.floor((remainingCp % 100) / 10);
		const newCp = remainingCp % 10;

		// Update wealth
		character.updateWealth(newPp, newGp, newSp, newCp);

		// Add to inventory
		handleAddToInventory(equipment, quantity);
	}

	function handleUpdateWealth(pp: number, gp: number, sp: number, cp: number) {
		character.updateWealth(pp, gp, sp, cp);
	}
</script>

<svelte:head>
	<title>Equipment - Character Builder</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<h1 class="page-title">Equipment & Inventory</h1>
		<p class="page-description">
			Manage weapons, armor, gear, and wealth.
		</p>
	</header>

	<div class="content-sections">
		<!-- Wealth Tracker -->
		<section class="content-section" aria-labelledby="wealth">
			<div class="section-body">
				<WealthTracker
					pp={wealth.pp}
					gp={wealth.gp}
					sp={wealth.sp}
					cp={wealth.cp}
					onUpdateWealth={handleUpdateWealth}
				/>
			</div>
		</section>

		<!-- Bulk Tracker -->
		<section class="content-section" aria-labelledby="bulk">
			<h2 id="bulk" class="section-title">Encumbrance</h2>
			<div class="section-body">
				<BulkTracker currentBulk={totalBulk} {strengthModifier} />
			</div>
		</section>

		<!-- Inventory -->
		<section class="content-section" aria-labelledby="inventory">
			<div class="section-header">
				<h2 id="inventory" class="section-title">Inventory</h2>
				<button
					type="button"
					class="btn-browse"
					onclick={handleOpenBrowser}
					aria-label="Browse equipment shop"
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.70711 15.2929C4.07714 15.9229 4.52331 17 5.41421 17H17M17 17C15.8954 17 15 17.8954 15 19C15 20.1046 15.8954 21 17 21C18.1046 21 19 20.1046 19 19C19 17.8954 18.1046 17 17 17ZM9 19C9 20.1046 8.10457 21 7 21C5.89543 21 5 20.1046 5 19C5 17.8954 5.89543 17 7 17C8.10457 17 9 17.8954 9 19Z"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					Browse Equipment Shop
				</button>
			</div>
			<div class="section-body">
				{#if inventoryItems.length === 0}
					<div class="empty-inventory">
						<p>Your inventory is empty.</p>
						<p class="empty-help">Use the "Browse Equipment Shop" button above to add items.</p>
					</div>
				{:else}
					<InventoryList
						items={inventoryItems}
						onViewDetails={handleViewDetails}
						onToggleWorn={handleToggleWorn}
						onToggleInvested={handleToggleInvested}
						onRemoveItem={handleRemoveItem}
					/>
				{/if}
			</div>
		</section>

		<!-- Equipment Browser (Modal-like) -->
		{#if showBrowser}
			<section class="browser-modal" aria-labelledby="equipment-browser">
				<div class="browser-container">
					<div class="browser-header-row">
						<h2 id="equipment-browser" class="browser-title">Equipment Shop</h2>
						<button
							type="button"
							class="btn-close-browser"
							onclick={handleCloseBrowser}
							aria-label="Close equipment shop"
						>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
					<div class="browser-content">
						{#if loading}
							<div class="loading-container">
								<p>Loading equipment...</p>
							</div>
						{:else}
							<EquipmentBrowser
								equipment={allEquipment}
								onAddToInventory={handlePurchaseEquipment}
							/>
						{/if}
					</div>
				</div>
			</section>
		{/if}
	</div>
</div>

<!-- Equipment Detail Modal -->
<EquipmentDetail
	equipment={selectedEquipment}
	open={showEquipmentDetail}
	onClose={handleCloseDetail}
	showAddButton={false}
/>

<style>
	.page-content {
		max-width: 1000px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.page-title {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		color: var(--text-primary, #1a1a1a);
	}

	.page-description {
		font-size: 1.125rem;
		margin: 0;
		color: var(--text-secondary, #666666);
	}

	.content-sections {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.content-section {
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
		color: var(--text-primary, #1a1a1a);
	}

	.section-body {
		color: var(--text-secondary, #666666);
	}

	.btn-browse {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background-color: var(--link-color, #5c7cfa);
		color: white;
		border: none;
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-fast);
		white-space: nowrap;
	}

	.btn-browse:hover {
		background-color: #4c6ef5;
	}

	.btn-browse:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	.btn-browse svg {
		flex-shrink: 0;
	}

	/* Equipment Browser Modal */
	.browser-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1000;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		overflow: hidden;
	}

	.browser-container {
		width: 100%;
		max-width: 1200px;
		max-height: 90vh;
		background-color: var(--surface-1, #ffffff);
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.browser-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.5rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.browser-title {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.btn-close-browser {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		padding: 0.5rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		color: var(--text-primary, #1a1a1a);
		cursor: pointer;
		transition: all var(--transition-fast);
		flex-shrink: 0;
	}

	.btn-close-browser:hover {
		background-color: #f03e3e;
		border-color: #f03e3e;
		color: white;
	}

	.btn-close-browser:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	.browser-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
	}

	.loading-container {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		color: var(--text-secondary, #666666);
	}

	.empty-inventory {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 3rem;
		text-align: center;
		color: var(--text-secondary, #666666);
	}

	.empty-inventory p {
		margin: 0;
		font-size: 1rem;
	}

	.empty-help {
		font-size: 0.875rem;
		color: var(--text-tertiary, #999999);
		max-width: 300px;
	}

	@media (max-width: 768px) {
		.page-title {
			font-size: 1.75rem;
		}

		.page-description {
			font-size: 1rem;
		}

		.section-title {
			font-size: 1.25rem;
		}

		.content-section {
			padding: 1.25rem;
		}

		.section-header {
			flex-direction: column;
			align-items: stretch;
		}

		.btn-browse {
			justify-content: center;
		}

		.browser-container {
			max-height: 95vh;
		}

		.browser-content {
			padding: 1rem;
		}
	}
</style>
