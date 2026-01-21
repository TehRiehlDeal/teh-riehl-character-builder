/**
 * TempHP Rule Element
 *
 * Grants temporary hit points. Temporary HP doesn't stack - you keep the higher value.
 * Common sources: False Life spell, Inspiring Marshal stance, temporary buffs.
 *
 * PF2e Rules:
 * - Temporary HP from different sources don't stack (keep highest)
 * - Temporary HP is lost first before actual HP
 * - Temporary HP doesn't carry over between encounters (typically)
 */

import type { PredicateStatement } from '../predicates';

/**
 * TempHP data from Foundry VTT
 */
export interface TempHPRuleElement {
	key: 'TempHP';

	/** Number of temporary HP to grant */
	value: number | string; // Can be a formula like "@actor.level * 5"

	/** When this temp HP is granted */
	events?: string[]; // e.g., ["turn-start", "effect-start"]

	/** Predicate for conditional application */
	predicate?: PredicateStatement[];

	/** Label/source of the temp HP */
	label?: string;
}

/**
 * Result of processing temp HP
 */
export interface TempHPResult {
	/** Amount of temporary HP */
	value: number;

	/** Source/label */
	source: string;

	/** When it's granted */
	events: string[];

	/** Predicate for conditional application */
	predicate?: PredicateStatement[];
}

/**
 * Context for processing temp HP
 */
export interface TempHPContext {
	source: string;
	level: number;
}

/**
 * Process a TempHP rule element
 */
export function processTempHP(
	ruleElement: TempHPRuleElement,
	context: TempHPContext
): TempHPResult {
	// Resolve value (handle formulas if needed)
	const value = resolveValue(ruleElement.value, context);

	return {
		value,
		source: ruleElement.label ?? context.source,
		events: ruleElement.events ?? ['effect-start'],
		predicate: ruleElement.predicate
	};
}

/**
 * Resolve a temp HP value that might be a formula
 */
function resolveValue(value: number | string, context: TempHPContext): number {
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

	// Try to parse as number
	const parsed = parseInt(value, 10);
	if (!isNaN(parsed)) {
		return parsed;
	}

	console.warn(`Unable to resolve temp HP value: ${value}`);
	return 0;
}

/**
 * Calculate which temp HP source to use (highest value)
 *
 * @param tempHPSources - Array of temp HP sources
 * @returns The temp HP source with the highest value, or null if none
 */
export function calculateActiveTempHP(tempHPSources: TempHPResult[]): TempHPResult | null {
	if (tempHPSources.length === 0) {
		return null;
	}

	// Temp HP doesn't stack - keep the highest
	return tempHPSources.reduce((highest, current) => {
		return current.value > highest.value ? current : highest;
	});
}
