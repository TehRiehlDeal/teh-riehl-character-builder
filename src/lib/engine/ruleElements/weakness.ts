/**
 * Weakness Rule Element
 *
 * Grants weakness to specific damage types, increasing damage taken.
 * Common sources: Racial traits (undead to positive energy), curses, conditions.
 *
 * PF2e Rules:
 * - Weaknesses of the same type don't stack (highest applies)
 * - Applied after resistances
 * - Can have weakness to physical damage (b/p/s) or energy damage
 */

import type { PredicateStatement } from '../predicates';

/**
 * Weakness data from Foundry VTT
 */
export interface WeaknessRuleElement {
	key: 'Weakness';

	/** Damage type(s) this weakness applies to */
	type: string | string[]; // e.g., "fire", "positive", "slashing"

	/** Amount of additional damage */
	value: number | string; // Can be a formula

	/** Predicate for conditional application */
	predicate?: PredicateStatement[];

	/** Label/source */
	label?: string;
}

/**
 * Result of processing weakness
 */
export interface WeaknessResult {
	/** Damage types this applies to */
	types: string[];

	/** Amount of additional damage */
	value: number;

	/** Source/label */
	source: string;

	/** Predicate for conditional application */
	predicate?: PredicateStatement[];
}

/**
 * Context for processing weakness
 */
export interface WeaknessContext {
	source: string;
	level: number;
}

/**
 * Process a Weakness rule element
 */
export function processWeakness(
	ruleElement: WeaknessRuleElement,
	context: WeaknessContext
): WeaknessResult {
	const value = resolveValue(ruleElement.value, context);
	const types = Array.isArray(ruleElement.type) ? ruleElement.type : [ruleElement.type];

	return {
		types,
		value,
		source: ruleElement.label ?? context.source,
		predicate: ruleElement.predicate
	};
}

/**
 * Resolve a weakness value that might be a formula
 */
function resolveValue(value: number | string, context: WeaknessContext): number {
	if (typeof value === 'number') {
		return value;
	}

	// Handle simple formulas
	if (value === '@actor.level') {
		return context.level;
	}

	// Handle @actor.level * N
	const levelMultiplierMatch = value.match(/^@actor\.level\s*\*\s*(\d+)$/);
	if (levelMultiplierMatch) {
		return context.level * parseInt(levelMultiplierMatch[1], 10);
	}

	// Handle @actor.level / N
	const levelDividerMatch = value.match(/^@actor\.level\s*\/\s*(\d+)$/);
	if (levelDividerMatch) {
		return Math.floor(context.level / parseInt(levelDividerMatch[1], 10));
	}

	// Try to parse as number
	const parsed = parseInt(value, 10);
	if (!isNaN(parsed)) {
		return parsed;
	}

	console.warn(`Unable to resolve weakness value: ${value}`);
	return 0;
}

/**
 * Calculate effective weakness against a damage type
 *
 * @param weaknesses - Array of weakness sources
 * @param damageType - Type of damage being taken
 * @returns Highest applicable weakness value
 */
export function calculateWeakness(weaknesses: WeaknessResult[], damageType: string): number {
	let maxWeakness = 0;

	for (const weakness of weaknesses) {
		// Check if this weakness applies to the damage type
		const applies =
			weakness.types.includes(damageType) ||
			(weakness.types.includes('physical') &&
				['bludgeoning', 'piercing', 'slashing'].includes(damageType));

		if (!applies) {
			continue;
		}

		// Take highest weakness (they don't stack)
		maxWeakness = Math.max(maxWeakness, weakness.value);
	}

	return maxWeakness;
}

/**
 * Apply weakness to damage
 *
 * @param damage - Amount of damage before weakness
 * @param weakness - Weakness value
 * @returns Damage after weakness
 */
export function applyWeakness(damage: number, weakness: number): number {
	// Only apply weakness if damage > 0
	return damage > 0 ? damage + weakness : 0;
}
