<script lang="ts">
	/**
	 * AnimalCompanionSheet Component
	 *
	 * Displays and manages an animal companion.
	 * PF2e Rules:
	 * - Young (levels 1-3): Basic stats
	 * - Mature (levels 4-6): Better stats, size increase
	 * - Specialization (level 7+): Choose Nimble or Savage
	 */

	export interface CompanionType {
		id: string;
		name: string;
		size: string;
		speed: number;
		attack: string;
		attackDamage: string;
		attackType: string; // bludgeoning, piercing, slashing
		specialAbility?: string;
		support: string; // Support benefit
		advanced: string; // Advanced maneuver
	}

	type CompanionMaturity = 'young' | 'mature' | 'specialized';
	type Specialization = 'nimble' | 'savage' | null;

	interface Props {
		/** Character level (determines companion growth) */
		masterLevel: number;

		/** Companion name */
		name?: string;

		/** Companion type */
		companionType: CompanionType;

		/** Chosen specialization (level 7+) */
		specialization?: Specialization;

		/** Whether the sheet is interactive */
		interactive?: boolean;
	}

	let {
		masterLevel,
		name = 'Animal Companion',
		companionType,
		specialization = null,
		interactive = true
	}: Props = $props();

	// Determine maturity level
	const maturity = $derived.by((): CompanionMaturity => {
		if (masterLevel >= 7) return 'specialized';
		if (masterLevel >= 4) return 'mature';
		return 'young';
	});

	// Calculate stats based on maturity
	const stats = $derived.by(() => {
		const base = {
			ac: 15 + masterLevel,
			hp: 4 + masterLevel * 3,
			perception: masterLevel + 2,
			fortitude: masterLevel + 3,
			reflex: masterLevel + 3,
			will: masterLevel + 1,
			attackBonus: masterLevel + 2,
			speed: companionType.speed
		};

		if (maturity === 'mature') {
			base.hp += 10;
			base.ac += 2;
			base.attackBonus += 2;
		}

		if (maturity === 'specialized') {
			base.hp += 20;
			base.ac += 4;
			base.attackBonus += 4;

			if (specialization === 'nimble') {
				base.speed += 10;
				base.reflex += 1;
			} else if (specialization === 'savage') {
				base.attackBonus += 2;
				base.fortitude += 1;
			}
		}

		return base;
	});

	const size = $derived(maturity === 'young' ? companionType.size : 'Medium or Large');

	// Example companion types
	const exampleTypes: CompanionType[] = [
		{
			id: 'bear',
			name: 'Bear',
			size: 'Small',
			speed: 35,
			attack: 'jaws',
			attackDamage: '1d8',
			attackType: 'piercing',
			support: 'Your bear mauls your enemies when you create an opening. Until the start of your next turn, each time you hit a creature, your bear can make a Strike against that creature as a reaction.',
			advanced: 'The bear makes a Strike against an adjacent creature. If it hits, the creature is knocked prone.'
		},
		{
			id: 'bird',
			name: 'Bird',
			size: 'Small',
			speed: 10,
			attack: 'jaws',
			attackDamage: '1d6',
			attackType: 'piercing',
			specialAbility: 'Fly Speed 60 feet',
			support: 'Your bird pecks at your foes\' eyes when you create an opening. Until the start of your next turn, your Strikes that deal damage to a creature grant your bird a reaction. Your bird can use this reaction to attempt to Strike that creature, with a –5 penalty.',
			advanced: 'The bird Flies up to its fly Speed and makes a Strike at the end of that movement.'
		},
		{
			id: 'cat',
			name: 'Cat',
			size: 'Small',
			speed: 40,
			attack: 'jaws',
			attackDamage: '1d6',
			attackType: 'piercing',
			support: 'Your cat throws your enemies off-balance when you create an opening. Until the start of your next turn, your Strikes that deal damage to a creature grant your cat a reaction. Your cat can use the reaction to Stride and must end that Stride adjacent to the triggering creature.',
			advanced: 'The cat pounces on an adjacent foe, making a Strike with a +2 circumstance bonus. If the cat hits, the target is flat-footed until the end of your next turn.'
		},
		{
			id: 'horse',
			name: 'Horse',
			size: 'Medium',
			speed: 40,
			attack: 'hoof',
			attackDamage: '1d8',
			attackType: 'bludgeoning',
			specialAbility: 'Mount: You can ride your horse (DC 5 to Command)',
			support: 'Your horse adds momentum to your charge. Until the start of your next turn, if you moved at least 10 feet, your Strikes deal +2 damage.',
			advanced: 'The horse Strides up to its Speed and makes a Strike at any point during that movement.'
		},
		{
			id: 'snake',
			name: 'Snake',
			size: 'Small',
			speed: 30,
			attack: 'jaws',
			attackDamage: '1d8',
			attackType: 'piercing',
			specialAbility: 'Climb Speed 30 feet, Swim Speed 30 feet',
			support: 'Your snake holds your enemies with its coils, interfering with reactions. Until the start of your next turn, any creature you hit becomes flat-footed.',
			advanced: 'The snake makes a Strike. If it hits, the target takes persistent poison damage equal to half your level (minimum 1).'
		}
	];
</script>

<div class="companion-sheet">
	<div class="sheet-header">
		<div class="companion-info">
			<h3 class="companion-name">{name}</h3>
			<span class="companion-type">{companionType.name}</span>
			<span class="maturity-badge maturity-{maturity}">{maturity}</span>
		</div>
	</div>

	<!-- Stats Block -->
	<div class="stats-block">
		<div class="stat-row">
			<div class="stat-item">
				<span class="stat-label">Size</span>
				<span class="stat-value">{size}</span>
			</div>

			<div class="stat-item">
				<span class="stat-label">Speed</span>
				<span class="stat-value">{stats.speed} ft</span>
			</div>

			<div class="stat-item">
				<span class="stat-label">AC</span>
				<span class="stat-value">{stats.ac}</span>
			</div>

			<div class="stat-item">
				<span class="stat-label">HP</span>
				<span class="stat-value">{stats.hp}</span>
			</div>
		</div>

		<div class="saves-row">
			<div class="stat-item">
				<span class="stat-label">Perception</span>
				<span class="stat-value">+{stats.perception}</span>
			</div>

			<div class="stat-item">
				<span class="stat-label">Fortitude</span>
				<span class="stat-value">+{stats.fortitude}</span>
			</div>

			<div class="stat-item">
				<span class="stat-label">Reflex</span>
				<span class="stat-value">+{stats.reflex}</span>
			</div>

			<div class="stat-item">
				<span class="stat-label">Will</span>
				<span class="stat-value">+{stats.will}</span>
			</div>
		</div>
	</div>

	<!-- Attack -->
	<div class="attack-section">
		<h4 class="section-title">Attack</h4>
		<div class="attack-info">
			<div class="attack-name">
				<strong>{companionType.attack}</strong>
				<span class="attack-bonus">+{stats.attackBonus}</span>
			</div>
			<div class="attack-damage">
				<strong>Damage:</strong>
				{companionType.attackDamage} {companionType.attackType}
			</div>
		</div>
	</div>

	<!-- Special Abilities -->
	{#if companionType.specialAbility}
		<div class="special-section">
			<h4 class="section-title">Special Ability</h4>
			<p class="special-text">{companionType.specialAbility}</p>
		</div>
	{/if}

	<!-- Actions -->
	<div class="actions-section">
		<div class="action-item">
			<h4 class="action-title">
				<span class="action-icon">◆</span>
				Support
			</h4>
			<p class="action-description">{companionType.support}</p>
		</div>

		{#if maturity !== 'young'}
			<div class="action-item">
				<h4 class="action-title">
					<span class="action-icon">◆◆</span>
					Advanced Maneuver
				</h4>
				<p class="action-description">{companionType.advanced}</p>
			</div>
		{/if}
	</div>

	<!-- Specialization (Level 7+) -->
	{#if masterLevel >= 7}
		<div class="specialization-section">
			<h4 class="section-title">Specialization</h4>
			{#if !specialization}
				<p class="spec-note">Choose Nimble or Savage specialization for your companion.</p>
			{:else}
				<div class="spec-active">
					<strong>{specialization === 'nimble' ? 'Nimble' : 'Savage'}:</strong>
					{#if specialization === 'nimble'}
						Your companion's Speed increases by 10 feet, and it gains a +1 circumstance bonus to Reflex saves.
					{:else}
						Your companion gains +2 to attack rolls and a +1 circumstance bonus to Fortitude saves.
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Maturity Info -->
	<div class="maturity-info">
		<strong>Maturity Level:</strong>
		{#if maturity === 'young'}
			<span>Young (Levels 1-3)</span>
		{:else if maturity === 'mature'}
			<span>Mature (Levels 4-6) - Improved stats and advanced maneuvers unlocked</span>
		{:else}
			<span>Specialized (Level 7+) - Choose a specialization for additional benefits</span>
		{/if}
	</div>
</div>

<style>
	.companion-sheet {
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

	.companion-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.companion-name {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.companion-type {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
		padding: 0.375rem 0.75rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 6px;
	}

	.maturity-badge {
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: white;
	}

	.maturity-young {
		background-color: #6c757d;
	}

	.maturity-mature {
		background-color: var(--link-color, #5c7cfa);
	}

	.maturity-specialized {
		background-color: var(--success-color, #28a745);
	}

	.stats-block {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
	}

	.stat-row,
	.saves-row {
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

	.attack-section,
	.special-section,
	.specialization-section {
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
	}

	.section-title {
		margin: 0 0 0.75rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.attack-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.9375rem;
	}

	.attack-name {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-transform: capitalize;
	}

	.attack-bonus {
		padding: 0.25rem 0.5rem;
		background-color: var(--link-color, #5c7cfa);
		color: white;
		border-radius: 4px;
		font-weight: 600;
	}

	.attack-damage {
		color: var(--text-secondary, #666666);
	}

	.special-text {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--text-secondary, #666666);
	}

	.actions-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.action-item {
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border-left: 4px solid var(--link-color, #5c7cfa);
		border-radius: 6px;
	}

	.action-title {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.action-icon {
		color: var(--link-color, #5c7cfa);
		font-size: 1.125rem;
	}

	.action-description {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--text-secondary, #666666);
	}

	.spec-note {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		font-style: italic;
	}

	.spec-active {
		padding: 0.75rem;
		background-color: rgba(40, 167, 69, 0.1);
		border: 2px solid var(--success-color, #28a745);
		border-radius: 6px;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.maturity-info {
		padding: 1rem;
		background-color: rgba(92, 124, 250, 0.05);
		border: 2px solid var(--link-color, #5c7cfa);
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.maturity-info strong {
		color: var(--text-primary, #1a1a1a);
	}

	.maturity-info span {
		color: var(--text-secondary, #666666);
	}

	/* Mobile */
	@media (max-width: 640px) {
		.stat-row,
		.saves-row {
			grid-template-columns: repeat(2, 1fr);
		}

		.companion-info {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
