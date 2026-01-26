<script lang="ts">
	import type { Equipment, Weapon, Armor } from '$lib/data/types/app';
	import EquipmentDetail from './EquipmentDetail.svelte';

	interface Props {
		/** All available equipment */
		equipment: Equipment[];
		/** Callback when equipment is added to inventory (free/loot) */
		// eslint-disable-next-line no-unused-vars
		onAddToInventory?: (equipment: Equipment, quantity: number) => void;
		/** Callback when equipment is purchased (costs money) */
		// eslint-disable-next-line no-unused-vars
		onPurchase?: (equipment: Equipment, quantity: number) => void;
		/** Initial type filter (pre-filter based on active tab) */
		initialTypeFilter?: string;
	}

	let { equipment, onAddToInventory, onPurchase, initialTypeFilter = 'all' }: Props = $props();

	let searchQuery = $state('');
	let selectedType = $state<string>(initialTypeFilter);
	let selectedLevel = $state<string>('all');
	let selectedRarity = $state<string>('all');
	let selectedEquipment = $state<Equipment | null>(null);
	let showDetail = $state(false);

	// Pagination state
	let currentPage = $state(1);
	let itemsPerPage = $state(20);

	// Update selected type when initialTypeFilter changes
	$effect(() => {
		selectedType = initialTypeFilter;
	});

	// Reset to page 1 when filters change
	$effect(() => {
		// Dependencies: search, filters
		void searchQuery;
		void selectedType;
		void selectedLevel;
		void selectedRarity;
		void itemsPerPage;
		currentPage = 1;
	});

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

	// Calculate pagination
	const totalPages = $derived(Math.ceil(filteredEquipment.length / itemsPerPage));
	const startIndex = $derived((currentPage - 1) * itemsPerPage);
	const endIndex = $derived(startIndex + itemsPerPage);
	const paginatedEquipment = $derived(filteredEquipment.slice(startIndex, endIndex));

	// Generate page numbers for pagination UI
	const pageNumbers = $derived.by(() => {
		const pages: (number | string)[] = [];
		const maxVisible = 7; // Max page numbers to show

		if (totalPages <= maxVisible) {
			// Show all pages
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Show first, last, current, and nearby pages with ellipsis
			if (currentPage <= 3) {
				// Near start
				for (let i = 1; i <= 5; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(totalPages);
			} else if (currentPage >= totalPages - 2) {
				// Near end
				pages.push(1);
				pages.push('...');
				for (let i = totalPages - 4; i <= totalPages; i++) {
					pages.push(i);
				}
			} else {
				// Middle
				pages.push(1);
				pages.push('...');
				for (let i = currentPage - 1; i <= currentPage + 1; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(totalPages);
			}
		}

		return pages;
	});

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

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

	function handlePurchase(item: Equipment, quantity: number) {
		onPurchase?.(item, quantity);
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
			<div class="results-info">
				<span class="results-count">
					{filteredEquipment.length} items found
					{#if totalPages > 1}
						(page {currentPage} of {totalPages})
					{/if}
				</span>
			</div>

			<div class="items-per-page">
				<label for="items-per-page">Items per page:</label>
				<select id="items-per-page" bind:value={itemsPerPage}>
					<option value={10}>10</option>
					<option value={20}>20</option>
					<option value={50}>50</option>
					<option value={100}>100</option>
				</select>
			</div>
		</div>

		{#if filteredEquipment.length === 0}
			<div class="empty-results">
				<p>No equipment found matching your criteria.</p>
				<p class="empty-help">Try adjusting your search or filters.</p>
			</div>
		{:else}
			<div class="equipment-grid">
				{#each paginatedEquipment as item}
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
								class="btn-add-free"
								onclick={() => handleAddToInventory(item, 1)}
								title="Add to inventory (free - loot)"
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path
										d="M12 5v14m-7-7h14"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								Add
							</button>
							<button
								type="button"
								class="btn-buy"
								onclick={() => handlePurchase(item, 1)}
								title="Purchase with gold"
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path
										d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								Buy
							</button>
						</div>
					</div>
				{/each}
			</div>

			<!-- Pagination Controls -->
			{#if totalPages > 1}
				<div class="pagination">
					<button
						class="pagination-btn"
						disabled={currentPage === 1}
						onclick={() => goToPage(currentPage - 1)}
						aria-label="Previous page"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M15 18l-6-6 6-6"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						Previous
					</button>

					<div class="pagination-numbers">
						{#each pageNumbers as pageNum}
							{#if pageNum === '...'}
								<span class="pagination-ellipsis">...</span>
							{:else}
								{@const page = pageNum as number}
								<button
									class="pagination-number"
									class:active={currentPage === page}
									onclick={() => goToPage(page)}
									aria-label="Go to page {page}"
									aria-current={currentPage === page ? 'page' : undefined}
								>
									{page}
								</button>
							{/if}
						{/each}
					</div>

					<button
						class="pagination-btn"
						disabled={currentPage === totalPages}
						onclick={() => goToPage(currentPage + 1)}
						aria-label="Next page"
					>
						Next
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M9 18l6-6-6-6"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
				</div>
			{/if}
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
	onPurchase={(equipment, quantity) => {
		handlePurchase(equipment, quantity);
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
		flex-wrap: wrap;
		gap: 1rem;
		padding: 0.5rem 0;
		margin-bottom: 1rem;
	}

	.results-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.results-count {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary, #666666);
	}

	.items-per-page {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
	}

	.items-per-page label {
		font-weight: 500;
	}

	.items-per-page select {
		padding: 0.375rem 0.5rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-size: 0.875rem;
		font-family: inherit;
		background-color: var(--surface-1, #ffffff);
		color: var(--text-primary, #1a1a1a);
		cursor: pointer;
	}

	.items-per-page select:focus {
		outline: none;
		border-color: var(--link-color, #5c7cfa);
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
		gap: 0.5rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
		flex-wrap: wrap;
	}

	.btn-view,
	.btn-add-free,
	.btn-buy {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		flex: 1;
		min-width: 80px;
		padding: 0.625rem 0.75rem;
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
		flex: 1 1 100%;
	}

	.btn-view:hover {
		background-color: var(--surface-3, #e0e0e0);
		border-color: var(--text-secondary, #666666);
	}

	.btn-add-free {
		background-color: var(--success-color, #28a745);
		color: white;
		border-color: var(--success-color, #28a745);
	}

	.btn-add-free:hover {
		background-color: #218838;
		border-color: #218838;
	}

	.btn-buy {
		background-color: var(--link-color, #5c7cfa);
		color: white;
		border-color: var(--link-color, #5c7cfa);
	}

	.btn-buy:hover {
		background-color: #4c6ef5;
		border-color: #4c6ef5;
	}

	.btn-view:focus-visible,
	.btn-add-free:focus-visible,
	.btn-buy:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	.btn-add-free svg,
	.btn-buy svg {
		flex-shrink: 0;
	}

	/* Pagination */
	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 2px solid var(--border-color, #e0e0e0);
	}

	.pagination-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary, #1a1a1a);
		cursor: pointer;
		transition: all var(--transition-fast, 0.2s);
	}

	.pagination-btn:hover:not(:disabled) {
		background-color: var(--surface-3, #e0e0e0);
		border-color: var(--link-color, #5c7cfa);
	}

	.pagination-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.pagination-btn:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	.pagination-numbers {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.pagination-number {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 40px;
		height: 40px;
		padding: 0.5rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary, #1a1a1a);
		cursor: pointer;
		transition: all var(--transition-fast, 0.2s);
	}

	.pagination-number:hover {
		background-color: var(--surface-3, #e0e0e0);
		border-color: var(--link-color, #5c7cfa);
	}

	.pagination-number.active {
		background-color: var(--link-color, #5c7cfa);
		border-color: var(--link-color, #5c7cfa);
		color: white;
		font-weight: 600;
	}

	.pagination-number:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	.pagination-ellipsis {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 40px;
		height: 40px;
		padding: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		user-select: none;
	}

	/* Mobile */
	@media (max-width: 768px) {
		.equipment-grid {
			grid-template-columns: 1fr;
		}

		.filter-grid {
			grid-template-columns: 1fr;
		}

		.results-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.items-per-page {
			width: 100%;
			justify-content: space-between;
		}

		.pagination {
			flex-wrap: wrap;
		}

		.pagination-btn {
			font-size: 0.8125rem;
			padding: 0.5rem 0.75rem;
		}

		.pagination-number {
			min-width: 36px;
			height: 36px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.equipment-card,
		.pagination-btn,
		.pagination-number {
			transition: none;
		}
	}
</style>
