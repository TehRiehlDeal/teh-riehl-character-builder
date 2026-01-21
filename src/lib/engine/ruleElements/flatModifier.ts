import type { Modifier, ModifierType } from '../models/Modifier';
import { createModifier } from '../models/Modifier';

/**
 * FlatModifier Rule Element
 *
 * The most common rule element - adds a flat bonus or penalty to a statistic.
 * Example: Fleet feat adds +5 untyped bonus to speed
 */

/**
 * FlatModifier data from Foundry VTT
 */
export interface FlatModifierRuleElement {
	key: 'FlatModifier';
	selector: string;
	value: number | string; // Can be a formula like "@actor.level"
	type?: ModifierType;
	label?: string;
	predicate?: string[];
	enabled?: boolean;
}

/**
 * Process a FlatModifier rule element into a Modifier
 */
export function processFlatModifier(
	ruleElement: FlatModifierRuleElement,
	context: RuleElementContext
): Modifier | null {
	// Resolve value (handle formulas if needed)
	const value = resolveValue(ruleElement.value, context);

	if (value === null) {
		return null;
	}

	// Default to untyped if no type specified
	const type = ruleElement.type ?? 'untyped';

	// Create label (use rule element label or generate from selector)
	const label = ruleElement.label ?? generateLabel(ruleElement.selector, value);

	return createModifier({
		label,
		source: context.source,
		value,
		type,
		selector: ruleElement.selector,
		predicate: ruleElement.predicate,
		enabled: ruleElement.enabled
	});
}

/**
 * Context for processing rule elements
 */
export interface RuleElementContext {
	/** Source of the rule element (e.g., "Fleet Feat", "Barbarian Rage") */
	source: string;

	/** Character level */
	level: number;

	/** Character data for formula evaluation */
	actor?: {
		level: number;
		abilities?: Record<string, number>;
		[key: string]: unknown;
	};
}

/**
 * Resolve a value that might be a number or a formula
 */
function resolveValue(value: number | string, context: RuleElementContext): number | null {
	if (typeof value === 'number') {
		return value;
	}

	// Handle simple formulas
	// @actor.level -> context.level
	if (value === '@actor.level') {
		return context.level;
	}

	// Handle @actor.level * 2, etc.
	const levelMultiplierMatch = value.match(/^@actor\.level\s*\*\s*(\d+)$/);
	if (levelMultiplierMatch) {
		return context.level * parseInt(levelMultiplierMatch[1], 10);
	}

	// Handle @actor.level / 2, etc.
	const levelDividerMatch = value.match(/^@actor\.level\s*\/\s*(\d+)$/);
	if (levelDividerMatch) {
		return Math.floor(context.level / parseInt(levelDividerMatch[1], 10));
	}

	// If we can't parse it, try to convert to number
	const parsed = parseFloat(value);
	if (!isNaN(parsed)) {
		return parsed;
	}

	console.warn(`Unable to resolve value: ${value}`);
	return null;
}

/**
 * Generate a label from selector and value
 */
function generateLabel(selector: string, value: number): string {
	const sign = value >= 0 ? '+' : '';
	const selectorLabel = selector
		.split('-')
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join(' ');
	return `${sign}${value} ${selectorLabel}`;
}
