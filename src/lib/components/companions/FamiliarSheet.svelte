<script lang="ts">
	import Button from '../common/Button.svelte';

	/**
	 * FamiliarSheet Component
	 *
	 * Displays and manages a character's familiar.
	 * PF2e Rules:
	 * - Familiars start with 2 abilities
	 * - Gain 1 ability per master level after 1st
	 * - Have Tiny size, AC 13 + level, 5 HP per master level
	 * - Use master's saves
	 */

	export interface FamiliarAbility {
		id: string;
		name: string;
		description: string;
		isMasterAbility?: boolean; // Requires master to have specific ability
	}

	interface Props {
		/** Character level (determines familiar abilities) */
		masterLevel: number;

		/** Familiar name */
		name?: string;

		/** Familiar type (e.g., "Raven", "Cat", "Owl") */
		familiarType?: string;

		/** Selected abilities */
		selectedAbilities?: FamiliarAbility[];

		/** Callback when abilities change */
		// eslint-disable-next-line no-unused-vars
		onAbilitiesChange?: (abilities: FamiliarAbility[]) => void;

		/** Whether the sheet is interactive */
		interactive?: boolean;
	}

	let {
		masterLevel,
		name = 'Familiar',
		familiarType = 'Unspecified',
		selectedAbilities = [],
		onAbilitiesChange,
		interactive = true
	}: Props = $props();

	// Calculate familiar stats
	const maxAbilities = $derived(2 + Math.max(0, masterLevel - 1));
	const hp = $derived(5 * masterLevel);
	const ac = $derived(13 + masterLevel);
	const perception = $derived(masterLevel);

	// Common familiar abilities
	const availableAbilities: FamiliarAbility[] = [
		{
			id: 'amphibious',
			name: 'Amphibious',
			description: 'Your familiar can breathe in water and gains a swim Speed equal to its land Speed.'
		},
		{
			id: 'burrower',
			name: 'Burrower',
			description: 'Your familiar gains a burrow Speed of 5 feet, allowing it to dig through dirt.'
		},
		{
			id: 'climber',
			name: 'Climber',
			description: 'Your familiar gains a climb Speed equal to its Speed.'
		},
		{
			id: 'darkvision',
			name: 'Darkvision',
			description: 'Your familiar gains darkvision.'
		},
		{
			id: 'fast-movement',
			name: 'Fast Movement',
			description: 'Your familiar\'s Speed increases by 10 feet.'
		},
		{
			id: 'flier',
			name: 'Flier',
			description: 'Your familiar gains a fly Speed of 25 feet.'
		},
		{
			id: 'manual-dexterity',
			name: 'Manual Dexterity',
			description: 'Your familiar can use manipulate actions and carry items using its limbs or mouth.'
		},
		{
			id: 'scent',
			name: 'Scent',
			description: 'Your familiar gains imprecise scent with a range of 30 feet.'
		},
		{
			id: 'speech',
			name: 'Speech',
			description: 'Your familiar can speak with you and any creatures that speak your languages.'
		},
		{
			id: 'touch-telepathy',
			name: 'Touch Telepathy',
			description: 'Your familiar can communicate telepathically with you via touch. It understands and answers simple questions.'
		},
		{
			id: 'valet',
			name: 'Valet',
			description: 'Your familiar can retrieve stored items for you, and it has 4 light Bulk storage.'
		}
	];

	function toggleAbility(ability: FamiliarAbility) {
		if (!interactive) return;

		const index = selectedAbilities.findIndex((a) => a.id === ability.id);
		let newAbilities: FamiliarAbility[];

		if (index >= 0) {
			// Remove ability
			newAbilities = selectedAbilities.filter((a) => a.id !== ability.id);
		} else {
			// Add ability if under limit
			if (selectedAbilities.length < maxAbilities) {
				newAbilities = [...selectedAbilities, ability];
			} else {
				return; // Can't add more
			}
		}

		onAbilitiesChange?.(newAbilities);
	}

	function isSelected(abilityId: string): boolean {
		return selectedAbilities.some((a) => a.id === abilityId);
	}
</script>

<div class="familiar-sheet">
	<div class="sheet-header">
		<div class="familiar-info">
			<h3 class="familiar-name">{name}</h3>
			<span class="familiar-type">{familiarType}</span>
		</div>

		<div class="ability-counter">
			<span class="counter-label">Abilities</span>
			<span class="counter-value">{selectedAbilities.length}/{maxAbilities}</span>
		</div>
	</div>

	<!-- Stats -->
	<div class="familiar-stats">
		<div class="stat-block">
			<div class="stat-item">
				<span class="stat-label">Size</span>
				<span class="stat-value">Tiny</span>
			</div>

			<div class="stat-item">
				<span class="stat-label">AC</span>
				<span class="stat-value">{ac}</span>
			</div>

			<div class="stat-item">
				<span class="stat-label">HP</span>
				<span class="stat-value">{hp}</span>
			</div>

			<div class="stat-item">
				<span class="stat-label">Perception</span>
				<span class="stat-value">+{perception}</span>
			</div>

			<div class="stat-item">
				<span class="stat-label">Speed</span>
				<span class="stat-value">25 ft</span>
			</div>
		</div>

		<div class="stat-note">
			<strong>Saves:</strong> Uses master's saving throw modifiers
		</div>
	</div>

	<!-- Abilities -->
	<div class="abilities-section">
		<h4 class="section-title">Abilities</h4>
		<p class="section-description">
			Select up to {maxAbilities} abilities for your familiar. You can change these during daily preparations.
		</p>

		<div class="abilities-grid">
			{#each availableAbilities as ability}
				{@const selected = isSelected(ability.id)}
				<button
					class="ability-card"
					class:selected
					class:disabled={!selected && selectedAbilities.length >= maxAbilities}
					onclick={() => toggleAbility(ability)}
					disabled={!interactive}
					aria-pressed={selected}
				>
					<div class="ability-header">
						<span class="ability-name">{ability.name}</span>
						{#if selected}
							<span class="check-icon" aria-hidden="true">✓</span>
						{/if}
					</div>
					<p class="ability-description">{ability.description}</p>
				</button>
			{/each}
		</div>
	</div>

	<!-- Selected Abilities Summary -->
	{#if selectedAbilities.length > 0}
		<div class="selected-summary">
			<h4 class="summary-title">Active Abilities</h4>
			<div class="selected-list">
				{#each selectedAbilities as ability}
					<div class="selected-item">
						<strong>{ability.name}:</strong>
						{ability.description}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.familiar-sheet {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1.5rem;
		background-color: var(--surface-1, #ffffff);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
	}

	.sheet-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.familiar-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.familiar-name {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.familiar-type {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
		text-transform: capitalize;
	}

	.ability-counter {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.25rem;
		padding: 0.75rem 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 6px;
	}

	.counter-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--text-secondary, #666666);
		letter-spacing: 0.5px;
	}

	.counter-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--link-color, #5c7cfa);
	}

	.familiar-stats {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
	}

	.stat-block {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 1rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		text-align: center;
	}

	.stat-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--text-secondary, #666666);
		letter-spacing: 0.5px;
	}

	.stat-value {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.stat-note {
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		font-style: italic;
	}

	.abilities-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.section-description {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
	}

	.abilities-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}

	.ability-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.ability-card:hover:not(:disabled):not(.disabled) {
		border-color: var(--link-color, #5c7cfa);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.ability-card.selected {
		background-color: rgba(92, 124, 250, 0.1);
		border-color: var(--link-color, #5c7cfa);
	}

	.ability-card.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.ability-card:disabled {
		cursor: default;
	}

	.ability-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.ability-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.check-icon {
		font-size: 1.25rem;
		color: var(--link-color, #5c7cfa);
		font-weight: 700;
	}

	.ability-description {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--text-secondary, #666666);
	}

	.selected-summary {
		padding: 1rem;
		background-color: rgba(92, 124, 250, 0.05);
		border: 2px solid var(--link-color, #5c7cfa);
		border-radius: 8px;
	}

	.summary-title {
		margin: 0 0 0.75rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.selected-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.selected-item {
		padding: 0.75rem;
		background-color: var(--surface-1, #ffffff);
		border-radius: 6px;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.selected-item strong {
		color: var(--text-primary, #1a1a1a);
	}

	/* Mobile */
	@media (max-width: 640px) {
		.abilities-grid {
			grid-template-columns: 1fr;
		}

		.stat-block {
			grid-template-columns: repeat(2, 1fr);
		}

		.sheet-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.ability-counter {
			width: 100%;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}
	}
</style>
