<script lang="ts">
	import type { Equipment, Weapon, Armor } from '$lib/data/types/app';
	import Modal from '../common/Modal.svelte';
	import Button from '../common/Button.svelte';
	import RichDescription from '../common/RichDescription.svelte';

	/**
	 * EquipmentDetail Component
	 *
	 * Displays comprehensive equipment information in a modal.
	 * Shows all metadata, full description, and item-specific properties.
	 */

	interface Props {
		/** The equipment to display */
		equipment: Equipment | null;

		/** Whether the modal is open */
		open?: boolean;

		/** Callback when modal closes */
		onClose?: () => void;

		/** Callback when equipment is added to inventory (free/loot) */
		// eslint-disable-next-line no-unused-vars
		onAddToInventory?: (equipment: Equipment, quantity: number) => void;

		/** Callback when equipment is purchased (costs money) */
		// eslint-disable-next-line no-unused-vars
		onPurchase?: (equipment: Equipment, quantity: number) => void;

		/** Whether to show the add buttons */
		showAddButton?: boolean;
	}

	let {
		equipment,
		open = $bindable(false),
		onClose,
		onAddToInventory,
		onPurchase,
		showAddButton = false
	}: Props = $props();

	let quantity = $state(1);

	function handleAdd() {
		if (equipment && onAddToInventory) {
			onAddToInventory(equipment, quantity);
			quantity = 1; // Reset quantity
			onClose?.();
		}
	}

	function handlePurchase() {
		if (equipment && onPurchase) {
			onPurchase(equipment, quantity);
			quantity = 1; // Reset quantity
			onClose?.();
		}
	}

	function isWeapon(item: Equipment): item is Weapon {
		return item.equipmentType === 'weapon';
	}

	function isArmor(item: Equipment): item is Armor {
		return item.equipmentType === 'armor';
	}
</script>

<Modal {open} {onClose} size="lg" title={equipment?.name}>
	{#if equipment}
		<div class="equipment-detail">
			<!-- Header Info -->
			<div class="equipment-header">
				<div class="equipment-level-info">
					<span class="equipment-level">Level {equipment.level}</span>
					<span class="equipment-type">{equipment.equipmentType.replace('-', ' ')}</span>
					<span class="rarity-badge rarity-{equipment.rarity}">{equipment.rarity}</span>
				</div>

				{#if equipment.traits && equipment.traits.length > 0}
					<div class="equipment-traits">
						{#each equipment.traits as trait}
							<span class="trait-badge">{trait}</span>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Basic Properties -->
			<div class="equipment-meta-grid">
				<div class="meta-item">
					<strong>Price:</strong>
					<span>{equipment.price.display}</span>
				</div>

				<div class="meta-item">
					<strong>Bulk:</strong>
					<span>{equipment.bulk.display}</span>
				</div>

				{#if equipment.hands}
					<div class="meta-item">
						<strong>Hands:</strong>
						<span>{equipment.hands}</span>
					</div>
				{/if}

				{#if equipment.usage}
					<div class="meta-item">
						<strong>Usage:</strong>
						<span>{equipment.usage}</span>
					</div>
				{/if}

				{#if equipment.activate}
					<div class="meta-item">
						<strong>Activate:</strong>
						<span>
							{equipment.activate.actionCost}
							{equipment.activate.actionType}
							{equipment.activate.actionCost > 1 ? 's' : ''}
						</span>
					</div>
				{/if}
			</div>

			<!-- Weapon-Specific Properties -->
			{#if isWeapon(equipment)}
				{@const weapon = equipment}
				<div class="weapon-stats">
					<h4 class="subsection-title">Weapon Properties</h4>
					<div class="weapon-grid">
						<div class="stat-item">
							<strong>Category:</strong>
							<span>{weapon.category}</span>
						</div>

						<div class="stat-item">
							<strong>Group:</strong>
							<span>{weapon.group}</span>
						</div>

						<div class="stat-item">
							<strong>Damage:</strong>
							<span>{weapon.damage.dice}{weapon.damage.die} {weapon.damage.damageType}</span>
						</div>

						{#if weapon.range}
							<div class="stat-item">
								<strong>Range:</strong>
								<span>{weapon.range} ft</span>
							</div>
						{/if}

						{#if weapon.reload}
							<div class="stat-item">
								<strong>Reload:</strong>
								<span>{weapon.reload}</span>
							</div>
						{/if}
					</div>

					{#if weapon.weaponTraits && weapon.weaponTraits.length > 0}
						<div class="weapon-traits-section">
							<strong>Weapon Traits:</strong>
							<div class="trait-list">
								{#each weapon.weaponTraits as trait}
									<span class="weapon-trait">{trait}</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Armor-Specific Properties -->
			{#if isArmor(equipment)}
				{@const armor = equipment}
				<div class="armor-stats">
					<h4 class="subsection-title">Armor Properties</h4>
					<div class="armor-grid">
						<div class="stat-item">
							<strong>Category:</strong>
							<span>{armor.category}</span>
						</div>

						<div class="stat-item">
							<strong>Group:</strong>
							<span>{armor.group}</span>
						</div>

						<div class="stat-item">
							<strong>AC Bonus:</strong>
							<span>+{armor.acBonus}</span>
						</div>

						{#if armor.dexCap !== undefined}
							<div class="stat-item">
								<strong>Dex Cap:</strong>
								<span>+{armor.dexCap}</span>
							</div>
						{/if}

						<div class="stat-item">
							<strong>Check Penalty:</strong>
							<span>{armor.checkPenalty}</span>
						</div>

						<div class="stat-item">
							<strong>Speed Penalty:</strong>
							<span>{armor.speedPenalty} ft</span>
						</div>

						{#if armor.strength}
							<div class="stat-item">
								<strong>Min Strength:</strong>
								<span>{armor.strength}</span>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Description -->
			<div class="equipment-description">
				<h4 class="subsection-title">Description</h4>
				<div class="description-content">
					<RichDescription content={equipment.description} />
				</div>
			</div>

			<!-- Source -->
			<div class="equipment-source">
				<strong>Source:</strong>
				{equipment.source.title}
				{#if equipment.source.remaster}
					<span class="remaster-badge">Remaster</span>
				{/if}
			</div>
		</div>

		{#snippet footer()}
			<div class="modal-actions">
				{#if showAddButton && (onAddToInventory || onPurchase)}
					<div class="add-controls">
						<label for="quantity-input" class="quantity-label">Quantity:</label>
						<input
							id="quantity-input"
							type="number"
							class="quantity-input"
							bind:value={quantity}
							min="1"
							max="999"
						/>
					</div>
					<div class="button-group">
						{#if onAddToInventory}
							<Button variant="primary" onclick={handleAdd}>
								Add (Free)
							</Button>
						{/if}
						{#if onPurchase}
							<Button variant="primary" onclick={handlePurchase}>
								Buy
							</Button>
						{/if}
					</div>
				{/if}
				<Button variant="secondary" onclick={onClose}>Close</Button>
			</div>
		{/snippet}
	{/if}
</Modal>

<style>
	.equipment-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.equipment-header {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.equipment-level-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.equipment-level {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--link-color, #5c7cfa);
		background-color: rgba(92, 124, 250, 0.1);
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
	}

	.equipment-type {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
		text-transform: capitalize;
	}

	.rarity-badge {
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.rarity-common {
		background-color: rgba(108, 117, 125, 0.2);
		color: #6c757d;
	}

	.rarity-uncommon {
		background-color: rgba(40, 167, 69, 0.2);
		color: var(--success-color, #28a745);
	}

	.rarity-rare {
		background-color: rgba(0, 123, 255, 0.2);
		color: #007bff;
	}

	.rarity-unique {
		background-color: rgba(255, 193, 7, 0.2);
		color: var(--warning-color, #ffc107);
	}

	.equipment-traits {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.trait-badge {
		padding: 0.375rem 0.75rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 6px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
		text-transform: capitalize;
	}

	.equipment-meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 0.75rem;
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.875rem;
	}

	.meta-item strong {
		color: var(--text-secondary, #666666);
		font-weight: 600;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.meta-item span {
		color: var(--text-primary, #1a1a1a);
		font-weight: 500;
	}

	.subsection-title {
		margin: 0 0 0.75rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.weapon-stats,
	.armor-stats {
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
	}

	.weapon-grid,
	.armor-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.875rem;
	}

	.stat-item strong {
		color: var(--text-secondary, #666666);
		font-weight: 600;
	}

	.stat-item span {
		color: var(--text-primary, #1a1a1a);
		text-transform: capitalize;
	}

	.weapon-traits-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.weapon-traits-section strong {
		color: var(--text-secondary, #666666);
		font-weight: 600;
	}

	.trait-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.weapon-trait {
		padding: 0.25rem 0.5rem;
		background-color: var(--surface-1, #ffffff);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-primary, #1a1a1a);
		text-transform: capitalize;
	}

	.equipment-description {
		line-height: 1.6;
		color: var(--text-primary, #1a1a1a);
	}

	.description-content :global(p) {
		margin-bottom: 0.75rem;
	}

	.description-content :global(p:last-child) {
		margin-bottom: 0;
	}

	.description-content :global(strong) {
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.description-content :global(hr) {
		margin: 1rem 0;
		border: none;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}

	.equipment-source {
		padding-top: 1rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.remaster-badge {
		padding: 0.25rem 0.5rem;
		background-color: var(--link-color, #5c7cfa);
		color: white;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.modal-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		justify-content: flex-end;
	}

	.add-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-right: auto;
	}

	.button-group {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.quantity-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.quantity-input {
		width: 80px;
		padding: 0.5rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-size: 0.9375rem;
		font-family: inherit;
		background-color: var(--surface-1, #ffffff);
		color: var(--text-primary, #1a1a1a);
		transition: border-color var(--transition-fast);
	}

	.quantity-input:focus {
		outline: none;
		border-color: var(--link-color, #5c7cfa);
	}

	/* Mobile */
	@media (max-width: 640px) {
		.equipment-meta-grid,
		.weapon-grid,
		.armor-grid {
			grid-template-columns: 1fr;
		}

		.modal-actions {
			flex-direction: column-reverse;
			align-items: stretch;
		}
	}
</style>
