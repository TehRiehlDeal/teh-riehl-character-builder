import type { RuleElementContext } from './flatModifier';

/**
 * DamageDice Rule Element
 *
 * Adds or modifies damage dice for weapons or spells.
 * Example: Striking rune adds extra weapon damage dice
 */

/**
 * DamageDice data from Foundry VTT
 */
export interface DamageDiceRuleElement {
	key: 'DamageDice';
	selector: string;
	/** Number of dice to add */
	diceNumber?: number;
	/** Die size (e.g., "d6", "d8") */
	dieSize?: string;
	/** Damage type (e.g., "fire", "cold", "slashing") */
	damageType?: string;
	/** Category (e.g., "persistent", "splash") */
	category?: string;
	/** Override the base damage instead of adding */
	override?: {
		diceNumber?: number;
		dieSize?: string;
	};
	/** Predicate for when this applies */
	predicate?: string[];
}

/**
 * Damage dice modification
 */
export interface DamageDice {
	source: string;
	selector: string;
	diceNumber: number;
	dieSize: string;
	damageType: string;
	category?: string;
	predicate?: string[];
	enabled?: boolean;
}

/**
 * Process a DamageDice rule element
 */
export function processDamageDice(
	ruleElement: DamageDiceRuleElement,
	context: RuleElementContext
): DamageDice | null {
	// If override is specified, use those values
	if (ruleElement.override) {
		return {
			source: context.source,
			selector: ruleElement.selector,
			diceNumber: ruleElement.override.diceNumber ?? 1,
			dieSize: ruleElement.override.dieSize ?? 'd6',
			damageType: ruleElement.damageType ?? 'untyped',
			category: ruleElement.category,
			predicate: ruleElement.predicate,
			enabled: true
		};
	}

	// Otherwise, it's an additive modification
	return {
		source: context.source,
		selector: ruleElement.selector,
		diceNumber: ruleElement.diceNumber ?? 1,
		dieSize: ruleElement.dieSize ?? 'd6',
		damageType: ruleElement.damageType ?? 'untyped',
		category: ruleElement.category,
		predicate: ruleElement.predicate,
		enabled: true
	};
}

/**
 * Calculate total damage dice from multiple sources
 */
export function calculateDamageDice(damageDice: DamageDice[]): Map<string, DicePool> {
	const pools = new Map<string, DicePool>();

	for (const dice of damageDice) {
		if (!dice.enabled) continue;

		const key = `${dice.dieSize}-${dice.damageType}`;

		if (!pools.has(key)) {
			pools.set(key, {
				diceNumber: 0,
				dieSize: dice.dieSize,
				damageType: dice.damageType,
				sources: []
			});
		}

		const pool = pools.get(key)!;
		pool.diceNumber += dice.diceNumber;
		pool.sources.push(dice.source);
	}

	return pools;
}

/**
 * A pool of damage dice of the same size and type
 */
export interface DicePool {
	diceNumber: number;
	dieSize: string;
	damageType: string;
	sources: string[];
}

/**
 * Format damage dice for display
 * Example: "2d6 fire + 1d4 cold"
 */
export function formatDamageDice(pools: Map<string, DicePool>): string {
	const parts: string[] = [];

	for (const pool of pools.values()) {
		const dice = `${pool.diceNumber}${pool.dieSize}`;
		const type = pool.damageType !== 'untyped' ? ` ${pool.damageType}` : '';
		parts.push(`${dice}${type}`);
	}

	return parts.join(' + ');
}

/**
 * Check if damage dice should apply based on predicates
 */
export function shouldApplyDamageDice(
	damageDice: DamageDice,
	activeConditions: Set<string>
): boolean {
	if (!damageDice.predicate || damageDice.predicate.length === 0) {
		return true;
	}

	return damageDice.predicate.every((condition) => activeConditions.has(condition));
}
