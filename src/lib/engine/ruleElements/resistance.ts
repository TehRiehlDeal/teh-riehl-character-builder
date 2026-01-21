/**
 * Resistance Rule Element
 *
 * Grants resistance to specific damage types, reducing damage taken.
 * Common sources: Racial traits, magic items, spells, class features.
 *
 * PF2e Rules:
 * - Resistances of the same type don't stack (highest applies)
 * - Applied after all damage modifiers are calculated
 * - Can have resistance to physical damage (b/p/s) or energy damage (fire, cold, etc.)
 * - "Resistance all" applies to all damage types
 */

import type { PredicateStatement } from '../predicates';

/**
 * Resistance data from Foundry VTT
 */
export interface ResistanceRuleElement {
	key: 'Resistance';

	/** Damage type(s) this resistance applies to */
	type: string | string[]; // e.g., "fire", "physical", "all"

	/** Amount of resistance */
	value: number | string; // Can be a formula

	/** Exceptions to the resistance */
	exceptions?: string[]; // e.g., ["adamantine"] for DR/adamantine

	/** Predicate for conditional application */
	predicate?: PredicateStatement[];

	/** Label/source */
	label?: string;
}

/**
 * Result of processing resistance
 */
export interface ResistanceResult {
	/** Damage types this applies to */
	types: string[];

	/** Amount of resistance */
	value: number;

	/** Source/label */
	source: string;

	/** Exceptions (damage sources that bypass this resistance) */
	exceptions: string[];

	/** Predicate for conditional application */
	predicate?: PredicateStatement[];
}

/**
 * Context for processing resistance
 */
export interface ResistanceContext {
	source: string;
	level: number;
}

/**
 * Process a Resistance rule element
 */
export function processResistance(
	ruleElement: ResistanceRuleElement,
	context: ResistanceContext
): ResistanceResult {
	const value = resolveValue(ruleElement.value, context);
	const types = Array.isArray(ruleElement.type) ? ruleElement.type : [ruleElement.type];

	return {
		types,
		value,
		source: ruleElement.label ?? context.source,
		exceptions: ruleElement.exceptions ?? [],
		predicate: ruleElement.predicate
	};
}

/**
 * Resolve a resistance value that might be a formula
 */
function resolveValue(value: number | string, context: ResistanceContext): number {
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

	console.warn(`Unable to resolve resistance value: ${value}`);
	return 0;
}

/**
 * Calculate effective resistance against a damage type
 *
 * @param resistances - Array of resistance sources
 * @param damageType - Type of damage being taken
 * @param damageSource - Source of damage (for checking exceptions)
 * @returns Highest applicable resistance value
 */
export function calculateResistance(
	resistances: ResistanceResult[],
	damageType: string,
	damageSource?: string
): number {
	let maxResistance = 0;

	for (const resistance of resistances) {
		// Check if this resistance applies to the damage type
		const applies =
			resistance.types.includes(damageType) ||
			resistance.types.includes('all') ||
			(resistance.types.includes('physical') &&
				['bludgeoning', 'piercing', 'slashing'].includes(damageType));

		if (!applies) {
			continue;
		}

		// Check if damage source bypasses this resistance
		if (damageSource && resistance.exceptions.includes(damageSource)) {
			continue;
		}

		// Take highest resistance (they don't stack)
		maxResistance = Math.max(maxResistance, resistance.value);
	}

	return maxResistance;
}

/**
 * Apply resistance to damage
 *
 * @param damage - Amount of damage before resistance
 * @param resistance - Resistance value
 * @returns Damage after resistance (minimum 0)
 */
export function applyResistance(damage: number, resistance: number): number {
	return Math.max(0, damage - resistance);
}
