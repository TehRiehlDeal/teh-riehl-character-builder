import type { Modifier, ModifierType } from './Modifier';
import { isBonus, isPenalty, shouldApply } from './Modifier';

/**
 * Statistic - Handles a single calculated stat value with modifier stacking
 *
 * Examples: AC, Speed, Attack Bonus, Skill Modifier, Saving Throw
 */
export class Statistic {
	private baseValue: number;
	private modifiers: Modifier[] = [];
	private activeConditions: Set<string> = new Set();

	constructor(
		public readonly name: string,
		baseValue: number = 0
	) {
		this.baseValue = baseValue;
	}

	/**
	 * Set the base value of this statistic
	 */
	setBaseValue(value: number): void {
		this.baseValue = value;
	}

	/**
	 * Get the base value (before modifiers)
	 */
	getBaseValue(): number {
		return this.baseValue;
	}

	/**
	 * Add a modifier to this statistic
	 */
	addModifier(modifier: Modifier): void {
		this.modifiers.push(modifier);
	}

	/**
	 * Remove a modifier by reference
	 */
	removeModifier(modifier: Modifier): void {
		const index = this.modifiers.indexOf(modifier);
		if (index !== -1) {
			this.modifiers.splice(index, 1);
		}
	}

	/**
	 * Remove all modifiers from a specific source
	 */
	removeModifiersBySource(source: string): void {
		this.modifiers = this.modifiers.filter((m) => m.source !== source);
	}

	/**
	 * Clear all modifiers
	 */
	clearModifiers(): void {
		this.modifiers = [];
	}

	/**
	 * Get all modifiers (including inactive ones)
	 */
	getAllModifiers(): readonly Modifier[] {
		return this.modifiers;
	}

	/**
	 * Set active conditions for predicate evaluation
	 */
	setActiveConditions(conditions: string[]): void {
		this.activeConditions = new Set(conditions);
	}

	/**
	 * Add an active condition
	 */
	addCondition(condition: string): void {
		this.activeConditions.add(condition);
	}

	/**
	 * Remove an active condition
	 */
	removeCondition(condition: string): void {
		this.activeConditions.delete(condition);
	}

	/**
	 * Get only the modifiers that should apply based on predicates
	 */
	private getApplicableModifiers(): Modifier[] {
		return this.modifiers.filter((m) => shouldApply(m, this.activeConditions));
	}

	/**
	 * Calculate the total modifier value after applying stacking rules
	 */
	getTotalModifier(): number {
		const applicable = this.getApplicableModifiers();

		// Separate bonuses and penalties
		const bonuses = applicable.filter(isBonus);
		const penalties = applicable.filter(isPenalty);

		// Calculate bonus (highest of each type)
		const bonusValue = this.calculateStackedBonuses(bonuses);

		// Calculate penalties (all stack)
		const penaltyValue = penalties.reduce((sum, m) => sum + m.value, 0);

		return bonusValue + penaltyValue;
	}

	/**
	 * Calculate bonuses with stacking rules applied
	 *
	 * PF2e Rules:
	 * - Status bonuses don't stack (highest wins)
	 * - Circumstance bonuses don't stack (highest wins)
	 * - Item bonuses don't stack (highest wins)
	 * - Untyped bonuses always stack
	 */
	private calculateStackedBonuses(bonuses: Modifier[]): number {
		const byType = new Map<ModifierType, Modifier[]>();

		// Group by type
		for (const bonus of bonuses) {
			if (!byType.has(bonus.type)) {
				byType.set(bonus.type, []);
			}
			byType.get(bonus.type)!.push(bonus);
		}

		let total = 0;

		// For each type, apply stacking rules
		for (const [type, mods] of byType.entries()) {
			if (type === 'untyped') {
				// Untyped bonuses all stack
				total += mods.reduce((sum, m) => sum + m.value, 0);
			} else {
				// Typed bonuses: highest wins
				const highest = Math.max(...mods.map((m) => m.value));
				total += highest;
			}
		}

		return total;
	}

	/**
	 * Get the final calculated value
	 */
	getValue(): number {
		return this.baseValue + this.getTotalModifier();
	}

	/**
	 * Get a breakdown of how the value is calculated
	 */
	getBreakdown(): StatisticBreakdown {
		const applicable = this.getApplicableModifiers();
		const bonuses = applicable.filter(isBonus);
		const penalties = applicable.filter(isPenalty);

		return {
			name: this.name,
			baseValue: this.baseValue,
			totalModifier: this.getTotalModifier(),
			finalValue: this.getValue(),
			applicableModifiers: applicable,
			bonuses: this.getStackedBonusBreakdown(bonuses),
			penalties: penalties
		};
	}

	/**
	 * Get breakdown of bonuses showing which ones are active vs stacked out
	 */
	private getStackedBonusBreakdown(bonuses: Modifier[]): BonusBreakdown[] {
		const byType = new Map<ModifierType, Modifier[]>();

		// Group by type
		for (const bonus of bonuses) {
			if (!byType.has(bonus.type)) {
				byType.set(bonus.type, []);
			}
			byType.get(bonus.type)!.push(bonus);
		}

		const breakdown: BonusBreakdown[] = [];

		for (const [type, mods] of byType.entries()) {
			if (type === 'untyped') {
				// All untyped bonuses apply
				for (const mod of mods) {
					breakdown.push({
						modifier: mod,
						applied: true,
						reason: 'Untyped bonuses stack'
					});
				}
			} else {
				// Only highest typed bonus applies
				const highest = Math.max(...mods.map((m) => m.value));
				for (const mod of mods) {
					breakdown.push({
						modifier: mod,
						applied: mod.value === highest,
						reason:
							mod.value === highest
								? 'Highest bonus of this type'
								: `Suppressed by higher ${type} bonus`
					});
				}
			}
		}

		return breakdown;
	}
}

/**
 * Breakdown of how a statistic is calculated
 */
export interface StatisticBreakdown {
	name: string;
	baseValue: number;
	totalModifier: number;
	finalValue: number;
	applicableModifiers: Modifier[];
	bonuses: BonusBreakdown[];
	penalties: Modifier[];
}

/**
 * Information about a bonus and whether it applies
 */
export interface BonusBreakdown {
	modifier: Modifier;
	applied: boolean;
	reason: string;
}
