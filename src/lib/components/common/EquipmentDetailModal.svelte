<script lang="ts">
	import type { Equipment, Weapon, Armor } from '$lib/data/types/app';
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';
	import RichDescription from './RichDescription.svelte';

	interface Props {
		/** Whether the modal is open */
		open?: boolean;
		/** The equipment to display */
		equipment: Equipment | null;
		/** Callback when modal is closed */
		onClose?: () => void;
	}

	let { open = $bindable(false), equipment, onClose }: Props = $props();

	function handleClose() {
		open = false;
		onClose?.();
	}

	// Type guards
	function isWeapon(item: Equipment): item is Weapon {
		return item.equipmentType === 'weapon';
	}

	function isArmor(item: Equipment): item is Armor {
		return item.equipmentType === 'armor';
	}
</script>

{#if equipment}
	<Modal bind:open={open} title={equipment.name} size="lg" onClose={handleClose}>
		<div class="equipment-detail">
			<!-- Header Info -->
			<div class="equipment-header">
				<div class="equipment-meta">
					<span class="meta-badge type-badge">{equipment.equipmentType}</span>
					<span class="meta-badge level-badge">Level {equipment.level}</span>
					{#if equipment.rarity && equipment.rarity !== 'common'}
						<span class="meta-badge rarity-badge rarity-{equipment.rarity}">{equipment.rarity}</span>
					{/if}
				</div>
			</div>

			<!-- Equipment Stats -->
			<div class="equipment-stats">
				<div class="stat-grid">
					<div class="stat-item">
						<dt class="stat-label">Price</dt>
						<dd class="stat-value">{equipment.price.display}</dd>
					</div>

					<div class="stat-item">
						<dt class="stat-label">Bulk</dt>
						<dd class="stat-value">{equipment.bulk.display}</dd>
					</div>

					{#if equipment.hands}
						<div class="stat-item">
							<dt class="stat-label">Hands</dt>
							<dd class="stat-value">{equipment.hands}</dd>
						</div>
					{/if}

					{#if equipment.usage}
						<div class="stat-item">
							<dt class="stat-label">Usage</dt>
							<dd class="stat-value">{equipment.usage}</dd>
						</div>
					{/if}
				</div>
			</div>

			<!-- Weapon-specific stats -->
			{#if isWeapon(equipment)}
				<div class="detail-section">
					<h4>Weapon Properties</h4>
					<div class="weapon-stats">
						<div class="stat-grid">
							<div class="stat-item">
								<dt class="stat-label">Category</dt>
								<dd class="stat-value">{equipment.category}</dd>
							</div>

							<div class="stat-item">
								<dt class="stat-label">Group</dt>
								<dd class="stat-value">{equipment.group}</dd>
							</div>

							<div class="stat-item">
								<dt class="stat-label">Damage</dt>
								<dd class="stat-value">
									{equipment.damage.dice}{equipment.damage.die} {equipment.damage.damageType}
								</dd>
							</div>

							{#if equipment.range}
								<div class="stat-item">
									<dt class="stat-label">Range</dt>
									<dd class="stat-value">{equipment.range} ft</dd>
								</div>
							{/if}

							{#if equipment.reload}
								<div class="stat-item">
									<dt class="stat-label">Reload</dt>
									<dd class="stat-value">{equipment.reload}</dd>
								</div>
							{/if}
						</div>

						{#if equipment.weaponTraits && equipment.weaponTraits.length > 0}
							<div class="weapon-traits">
								<span class="traits-label">Weapon Traits:</span>
								{#each equipment.weaponTraits as trait}
									<span class="trait-badge weapon-trait">{trait}</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Armor-specific stats -->
			{#if isArmor(equipment)}
				<div class="detail-section">
					<h4>Armor Properties</h4>
					<div class="armor-stats">
						<div class="stat-grid">
							<div class="stat-item">
								<dt class="stat-label">Category</dt>
								<dd class="stat-value">{equipment.category}</dd>
							</div>

							<div class="stat-item">
								<dt class="stat-label">AC Bonus</dt>
								<dd class="stat-value">+{equipment.acBonus}</dd>
							</div>

							{#if equipment.dexCap !== undefined}
								<div class="stat-item">
									<dt class="stat-label">Dex Cap</dt>
									<dd class="stat-value">+{equipment.dexCap}</dd>
								</div>
							{/if}

							<div class="stat-item">
								<dt class="stat-label">Check Penalty</dt>
								<dd class="stat-value">{equipment.checkPenalty}</dd>
							</div>

							<div class="stat-item">
								<dt class="stat-label">Speed Penalty</dt>
								<dd class="stat-value">{equipment.speedPenalty} ft</dd>
							</div>

							{#if equipment.strength}
								<div class="stat-item">
									<dt class="stat-label">Min Strength</dt>
									<dd class="stat-value">{equipment.strength}</dd>
								</div>
							{/if}

							<div class="stat-item">
								<dt class="stat-label">Group</dt>
								<dd class="stat-value">{equipment.group}</dd>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Activation -->
			{#if equipment.activate}
				<div class="detail-section">
					<h4>Activation</h4>
					<p class="activation-text">
						<strong>{equipment.activate.actionCost}</strong>
						{equipment.activate.actionType}
					</p>
				</div>
			{/if}

			<!-- Description -->
			<div class="detail-section">
				<h4>Description</h4>
				<RichDescription content={equipment.description} class="equipment-description-content" />
			</div>

			<!-- Traits -->
			{#if equipment.traits && equipment.traits.length > 0}
				<div class="detail-section">
					<h4>Traits</h4>
					<div class="trait-list">
						{#each equipment.traits as trait}
							<span class="trait-badge">{trait}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Source -->
			{#if equipment.source}
				<div class="detail-section source-section">
					<p class="source-text">
						<strong>Source:</strong>
						{equipment.source.title}
						{#if equipment.source.remaster}
							<span class="remaster-badge" title="Remastered content">Remaster</span>
						{/if}
					</p>
				</div>
			{/if}
		</div>

		{#snippet footer()}
			<Button variant="secondary" onclick={handleClose}>Close</Button>
		{/snippet}
	</Modal>
{/if}

<style>
	.equipment-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.equipment-header {
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.equipment-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.meta-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		border-radius: 4px;
		text-transform: capitalize;
	}

	.type-badge {
		background-color: rgba(92, 124, 250, 0.1);
		color: #5c7cfa;
		border: 1px solid rgba(92, 124, 250, 0.3);
	}

	.level-badge {
		background-color: rgba(174, 62, 201, 0.1);
		color: #ae3ec9;
		border: 1px solid rgba(174, 62, 201, 0.3);
	}

	.rarity-badge {
		border: 1px solid currentColor;
	}

	.rarity-badge.rarity-uncommon {
		background-color: rgba(250, 176, 5, 0.1);
		color: #c77700;
	}

	.rarity-badge.rarity-rare {
		background-color: rgba(240, 62, 62, 0.1);
		color: #e03131;
	}

	.rarity-badge.rarity-unique {
		background-color: rgba(174, 62, 201, 0.1);
		color: #ae3ec9;
	}

	.equipment-stats {
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
		padding: 1rem;
	}

	.stat-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary, #666);
		margin: 0;
	}

	.stat-value {
		font-size: 0.875rem;
		color: var(--text-primary, #1a1a1a);
		margin: 0;
		text-transform: capitalize;
	}

	.detail-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.detail-section h4 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		border-bottom: 1px solid var(--border-color, #e0e0e0);
		padding-bottom: 0.25rem;
	}

	.weapon-stats,
	.armor-stats {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.weapon-traits {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.traits-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary, #666);
	}

	.weapon-trait {
		background-color: rgba(240, 62, 62, 0.1);
		color: #e03131;
		border: 1px solid rgba(240, 62, 62, 0.3);
	}

	.activation-text {
		margin: 0;
		color: var(--text-primary, #1a1a1a);
		text-transform: capitalize;
	}

	.trait-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.trait-badge {
		display: inline-block;
		padding: 0.25rem 0.625rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 4px;
		font-size: 0.875rem;
		color: var(--text-secondary, #666);
		text-transform: lowercase;
	}

	.source-section {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}

	.source-text {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary, #666);
	}

	.remaster-badge {
		display: inline-block;
		margin-left: 0.5rem;
		padding: 0.125rem 0.5rem;
		background-color: rgba(55, 178, 77, 0.1);
		color: #2f9e44;
		border: 1px solid rgba(55, 178, 77, 0.3);
		border-radius: 3px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	/* Ensure nested RichDescription styles work */
	.equipment-detail :global(.equipment-description-content) {
		color: var(--text-primary, #1a1a1a);
	}
</style>
