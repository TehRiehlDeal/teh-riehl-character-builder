/**
 * FastHealing Rule Element
 *
 * Grants automatic healing at the start of each turn.
 * Common sources: Regeneration, Troll features, certain magic items.
 *
 * PF2e Rules:
 * - Fast healing from different sources stack
 * - Happens at the start of your turn
 * - Can't heal above maximum HP
 * - May have conditions that disable it (e.g., fire damage disables troll regeneration)
 */

import type { PredicateStatement } from '../predicates';

/**
 * FastHealing data from Foundry VTT
 */
export interface FastHealingRuleElement {
	key: 'FastHealing';

	/** Amount of healing per turn */
	value: number | string; // Can be a formula

	/** Type of fast healing (for stacking purposes) */
	type?: 'fast-healing' | 'regeneration';

	/** Conditions that disable this healing */
	deactivatedBy?: string[]; // e.g., ["fire-damage", "acid-damage"]

	/** Predicate for conditional application */
	predicate?: PredicateStatement[];

	/** Label/source */
	label?: string;
}

/**
 * Result of processing fast healing
 */
export interface FastHealingResult {
	/** Amount healed per turn */
	value: number;

	/** Type of healing */
	type: 'fast-healing' | 'regeneration';

	/** Source/label */
	source: string;

	/** What deactivates this healing */
	deactivatedBy: string[];

	/** Predicate for conditional application */
	predicate?: PredicateStatement[];

	/** Whether currently active */
	active: boolean;
}

/**
 * Context for processing fast healing
 */
export interface FastHealingContext {
	source: string;
	level: number;
}

/**
 * Process a FastHealing rule element
 */
export function processFastHealing(
	ruleElement: FastHealingRuleElement,
	context: FastHealingContext
): FastHealingResult {
	const value = resolveValue(ruleElement.value, context);

	return {
		value,
		type: ruleElement.type ?? 'fast-healing',
		source: ruleElement.label ?? context.source,
		deactivatedBy: ruleElement.deactivatedBy ?? [],
		predicate: ruleElement.predicate,
		active: true
	};
}

/**
 * Resolve a fast healing value that might be a formula
 */
function resolveValue(value: number | string, context: FastHealingContext): number {
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

	console.warn(`Unable to resolve fast healing value: ${value}`);
	return 0;
}

/**
 * Calculate total fast healing per turn (all sources stack)
 *
 * @param sources - Array of fast healing sources
 * @param damageTypes - Damage types recently taken (to check deactivation)
 * @returns Total healing per turn
 */
export function calculateTotalFastHealing(
	sources: FastHealingResult[],
	recentDamageTypes: string[] = []
): number {
	return sources.reduce((total, source) => {
		// Check if deactivated by recent damage
		const deactivated = source.deactivatedBy.some((type) => recentDamageTypes.includes(type));

		if (!deactivated && source.active) {
			return total + source.value;
		}

		return total;
	}, 0);
}

/**
 * Deactivate fast healing based on damage type
 */
export function deactivateFastHealing(
	source: FastHealingResult,
	damageType: string
): void {
	if (source.deactivatedBy.includes(damageType)) {
		source.active = false;
	}
}

/**
 * Reactivate fast healing (typically at end of turn)
 */
export function reactivateFastHealing(source: FastHealingResult): void {
	source.active = true;
}
