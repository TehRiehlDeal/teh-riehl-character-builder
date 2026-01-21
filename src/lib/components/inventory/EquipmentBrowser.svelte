<script lang="ts">
	import type { Equipment, Weapon, Armor } from '$lib/data/types/app';
	import EquipmentDetail from './EquipmentDetail.svelte';

	interface Props {
		/** All available equipment */
		equipment: Equipment[];
		/** Callback when equipment is added to inventory */
		// eslint-disable-next-line no-unused-vars
		onAddToInventory?: (equipment: Equipment, quantity: number) => void;
	}

	let { equipment, onAddToInventory }: Props = $props();

	let searchQuery = $state('');
	let selectedType = $state<string>('all');
	let selectedLevel = $state<string>('all');
	let selectedRarity = $state<string>('all');
	let selectedEquipment = $state<Equipment | null>(null);
	let showDetail = $state(false);

	// Filter equipment based on search and filters
	const filteredEquipment = $derived.by(() => {
		let filtered = equipment;

		// Search by name
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter((item) => item.name.toLowerCase().includes(query));
		}

		// Filter by equipment type
		if (selectedType !== 'all') {
			filtered = filtered.filter((item) => item.equipmentType === selectedType);
		}

		// Filter by level
		if (selectedLevel !== 'all') {
			const level = parseInt(selectedLevel, 10);
			filtered = filtered.filter((item) => item.level === level);
		}

		// Filter by rarity
		if (selectedRarity !== 'all') {
			filtered = filtered.filter((item) => item.rarity === selectedRarity);
		}

		// Sort by name (create a copy to avoid mutation)
		return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
	});

	function handleViewDetails(item: Equipment) {
		selectedEquipment = item;
		showDetail = true;
	}

	function handleCloseDetail() {
		showDetail = false;
		selectedEquipment = null;
	}

	function handleAddToInventory(item: Equipment, quantity: number) {
		onAddToInventory?.(item, quantity);
	}

	function getEquipmentIcon(item: Equipment): string {
		switch (item.equipmentType) {
			case 'weapon':
				return '⚔️';
			case 'armor':
				return '🛡️';
			case 'shield':
				return '🛡️';
			case 'consumable':
				return '🧪';
			case 'adventuring-gear':
				return '🎒';
			default:
				return '📦';
		}
	}

	function getRarityColor(rarity: string): string {
		switch (rarity) {
			case 'common':
				return '#666666';
			case 'uncommon':
				return '#37b24d';
			case 'rare':
				return '#5c7cfa';
			case 'unique':
				return '#f03e3e';
			default:
				return '#666666';
		}
	}
</script>

<div class="equipment-browser">
	<div class="browser-header">
		<h3 class="browser-title">Equipment Shop</h3>
		<p class="browser-description">Browse and purchase equipment for your character.</p>
	</div>

	<!-- Search and Filters -->
	<div class="search-section">
		<input
			type="text"
			class="search-input"
			bind:value={searchQuery}
			placeholder="Search equipment..."
			aria-label="Search equipment"
		/>

		<div class="filter-grid">
			<div class="filter-field">
				<label for="type-filter" class="filter-label">Type:</label>
				<select id="type-filter" class="filter-select" bind:value={selectedType}>
					<option value="all">All Types</option>
					<option value="weapon">Weapons</option>
					<option value="armor">Armor</option>
					<option value="shield">Shields</option>
					<option value="consumable">Consumables</option>
					<option value="adventuring-gear">Adventuring Gear</option>
					<option value="other">Other</option>
				</select>
			</div>

			<div class="filter-field">
				<label for="level-filter" class="filter-label">Level:</label>
				<select id="level-filter" class="filter-select" bind:value={selectedLevel}>
					<option value="all">All Levels</option>
					{#each Array.from({ length: 21 }, (_, i) => i) as level}
						<option value={level.toString()}>{level}</option>
					{/each}
				</select>
			</div>

			<div class="filter-field">
				<label for="rarity-filter" class="filter-label">Rarity:</label>
				<select id="rarity-filter" class="filter-select" bind:value={selectedRarity}>
					<option value="all">All Rarities</option>
					<option value="common">Common</option>
					<option value="uncommon">Uncommon</option>
					<option value="rare">Rare</option>
					<option value="unique">Unique</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Results -->
	<div class="results-section">
		<div class="results-header">
			<span class="results-count">{filteredEquipment.length} items found</span>
		</div>

		{#if filteredEquipment.length === 0}
			<div class="empty-results">
				<p>No equipment found matching your criteria.</p>
				<p class="empty-help">Try adjusting your search or filters.</p>
			</div>
		{:else}
			<div class="equipment-grid">
				{#each filteredEquipment as item}
					<div class="equipment-card">
						<div class="card-header">
							<span class="card-icon" aria-hidden="true">{getEquipmentIcon(item)}</span>
							<div class="card-title-section">
								<h4 class="card-title">{item.name}</h4>
								<div class="card-meta">
									<span class="meta-level">Level {item.level}</span>
									<span class="meta-rarity" style="color: {getRarityColor(item.rarity)}">
										{item.rarity}
									</span>
								</div>
							</div>
						</div>

						<div class="card-info">
							{#if item.price && item.price.display}
								<div class="info-row">
									<span class="info-label">Price:</span>
									<span class="info-value">{item.price.display}</span>
								</div>
							{/if}
							{#if item.bulk && item.bulk.display}
								<div class="info-row">
									<span class="info-label">Bulk:</span>
									<span class="info-value">{item.bulk.display}</span>
								</div>
							{/if}
							{#if item.equipmentType === 'weapon'}
								{@const weapon = item as Weapon}
								{#if weapon.damage && weapon.damage.die}
									<div class="info-row">
										<span class="info-label">Damage:</span>
										<span class="info-value">{weapon.damage.dice}d{weapon.damage.die.replace('d', '')} {weapon.damage.damageType}</span>
									</div>
								{/if}
							{/if}
							{#if item.equipmentType === 'armor'}
								{@const armor = item as Armor}
								{#if armor.acBonus !== undefined && armor.acBonus !== null}
									<div class="info-row">
										<span class="info-label">AC Bonus:</span>
										<span class="info-value">+{armor.acBonus}</span>
									</div>
								{/if}
							{/if}
						</div>

						<div class="card-actions">
							<button
								type="button"
								class="btn-view"
								onclick={() => handleViewDetails(item)}
							>
								View Details
							</button>
							<button
								type="button"
								class="btn-add"
								onclick={() => handleAddToInventory(item, 1)}
							>
								Add to Inventory
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Equipment Detail Modal -->
<EquipmentDetail
	equipment={selectedEquipment}
	open={showDetail}
	onClose={handleCloseDetail}
	showAddButton={true}
	onAddToInventory={(equipment, quantity) => {
		handleAddToInventory(equipment, quantity);
		handleCloseDetail();
	}}
/>

<style>
	.equipment-browser {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.browser-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.browser-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.browser-description {
		margin: 0;
		font-size: 0.9375rem;
		color: var(--text-secondary, #666666);
	}

	/* Search and Filters */
	.search-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		font-size: 1rem;
		font-family: inherit;
		background-color: var(--surface-1, #ffffff);
		color: var(--text-primary, #1a1a1a);
		transition: border-color var(--transition-fast);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--link-color, #5c7cfa);
	}

	.filter-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.filter-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.filter-select {
		padding: 0.5rem 0.75rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-size: 0.9375rem;
		font-family: inherit;
		background-color: var(--surface-1, #ffffff);
		color: var(--text-primary, #1a1a1a);
		cursor: pointer;
		transition: border-color var(--transition-fast);
	}

	.filter-select:focus {
		outline: none;
		border-color: var(--link-color, #5c7cfa);
	}

	/* Results */
	.results-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.results-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0;
	}

	.results-count {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary, #666666);
	}

	.empty-results {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 3rem;
		text-align: center;
		color: var(--text-secondary, #666666);
	}

	.empty-results p {
		margin: 0;
		font-size: 1rem;
	}

	.empty-help {
		font-size: 0.875rem;
		color: var(--text-tertiary, #999999);
	}

	/* Equipment Grid */
	.equipment-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
	}

	.equipment-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		background-color: var(--surface-1, #ffffff);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 10px;
		transition: all var(--transition-fast);
	}

	.equipment-card:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border-color: var(--link-color, #5c7cfa);
	}

	.card-header {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.card-icon {
		font-size: 1.5rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.card-title-section {
		flex: 1;
		min-width: 0;
	}

	.card-title {
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.card-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.meta-level {
		color: var(--text-secondary, #666666);
	}

	.meta-rarity {
		text-transform: capitalize;
	}

	.card-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
	}

	.info-label {
		font-weight: 600;
		color: var(--text-secondary, #666666);
	}

	.info-value {
		color: var(--text-primary, #1a1a1a);
		font-weight: 500;
	}

	.card-actions {
		display: flex;
		gap: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}

	.btn-view,
	.btn-add {
		flex: 1;
		padding: 0.625rem 1rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-view {
		background-color: var(--surface-2, #f5f5f5);
		color: var(--text-primary, #1a1a1a);
	}

	.btn-view:hover {
		background-color: var(--surface-3, #e0e0e0);
		border-color: var(--text-secondary, #666666);
	}

	.btn-add {
		background-color: var(--link-color, #5c7cfa);
		color: white;
		border-color: var(--link-color, #5c7cfa);
	}

	.btn-add:hover {
		background-color: #4c6ef5;
		border-color: #4c6ef5;
	}

	.btn-view:focus-visible,
	.btn-add:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	/* Mobile */
	@media (max-width: 768px) {
		.equipment-grid {
			grid-template-columns: 1fr;
		}

		.filter-grid {
			grid-template-columns: 1fr;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.equipment-card {
			transition: none;
		}
	}
</style>
