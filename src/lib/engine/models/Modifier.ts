/**
 * Modifier Type
 *
 * PF2e Rules:
 * - Status, Circumstance, and Item bonuses do NOT stack (highest wins)
 * - Untyped bonuses always stack
 * - All penalties stack
 */
export type ModifierType = 'status' | 'circumstance' | 'item' | 'untyped';

/**
 * Modifier - The atomic unit of the calculation engine
 *
 * Represents a single bonus or penalty from a feat, class feature, spell, etc.
 */
export interface Modifier {
	/** Display label (e.g., "Fleet", "Cover", "Bless") */
	label: string;

	/** Source of the modifier (e.g., "Barbarian Class Feature", "Fleet Feat") */
	source: string;

	/** Numeric value (positive for bonuses, negative for penalties) */
	value: number;

	/** Modifier type for stacking rules */
	type: ModifierType;

	/** What this modifier applies to (e.g., 'speed', 'ac', 'fortitude') */
	selector: string;

	/**
	 * Optional predicate - conditions that must be true for this modifier to apply
	 * Example: ['raging'] means this only applies when the character has the Rage effect
	 */
	predicate?: string[];

	/** Whether this modifier is currently enabled (for user-toggled abilities) */
	enabled?: boolean;

	/** Whether this is always active (true) or conditional (false) */
	alwaysActive?: boolean;

	/** Optional description for additional context (e.g., explaining reductions/calculations) */
	description?: string;
}

/**
 * Create a new modifier
 */
export function createModifier(params: {
	label: string;
	source: string;
	value: number;
	type: ModifierType;
	selector: string;
	predicate?: string[];
	enabled?: boolean;
	alwaysActive?: boolean;
	description?: string;
}): Modifier {
	return {
		label: params.label,
		source: params.source,
		value: params.value,
		type: params.type,
		selector: params.selector,
		predicate: params.predicate,
		enabled: params.enabled ?? true,
		alwaysActive: params.alwaysActive ?? (params.predicate === undefined),
		description: params.description
	};
}

/**
 * Check if a modifier is a bonus (positive value)
 */
export function isBonus(modifier: Modifier): boolean {
	return modifier.value > 0;
}

/**
 * Check if a modifier is a penalty (negative value)
 */
export function isPenalty(modifier: Modifier): boolean {
	return modifier.value < 0;
}

/**
 * Check if a modifier should apply based on its predicate and active conditions
 */
export function shouldApply(modifier: Modifier, activeConditions: Set<string>): boolean {
	if (!modifier.enabled) {
		return false;
	}

	if (!modifier.predicate || modifier.predicate.length === 0) {
		return true;
	}

	// All predicates must be satisfied
	return modifier.predicate.every((condition) => activeConditions.has(condition));
}
