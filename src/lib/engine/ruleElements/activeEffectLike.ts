/**
 * ActiveEffectLike Rule Element
 *
 * Modifies character properties using a flexible property path system.
 * Can add, subtract, multiply, override, or upgrade values.
 *
 * Example: Set a skill rank, modify recovery DC, add temporary HP
 */

import type { RuleElementContext } from './flatModifier';

/**
 * ActiveEffectLike data from Foundry VTT
 */
export interface ActiveEffectLikeRuleElement {
	key: 'ActiveEffectLike';
	/** Property path to modify (e.g., "system.skills.athletics.rank") */
	path: string;
	/** How to apply the value */
	mode: 'add' | 'subtract' | 'multiply' | 'override' | 'upgrade' | 'downgrade';
	/** Value to apply */
	value: number | string;
	/** Phase when this effect is applied (for ordering) */
	phase?: 'applyAEs' | 'beforeDerived' | 'afterDerived' | 'beforeRoll';
	/** Priority within the phase (lower = earlier) */
	priority?: number;
	/** Predicate for when this effect applies */
	predicate?: string[];
}

/**
 * Processed property modification
 */
export interface PropertyModification {
	/** Source of this modification */
	source: string;
	/** Property path to modify */
	path: string;
	/** Mode of modification */
	mode: 'add' | 'subtract' | 'multiply' | 'override' | 'upgrade' | 'downgrade';
	/** Value to apply */
	value: number;
	/** Application phase */
	phase: string;
	/** Priority (for ordering) */
	priority: number;
	/** Predicate conditions */
	predicate?: string[];
	/** Whether this modification is active */
	enabled: boolean;
}

/**
 * Process an ActiveEffectLike rule element
 */
export function processActiveEffectLike(
	ruleElement: ActiveEffectLikeRuleElement,
	context: RuleElementContext
): PropertyModification | null {
	// Resolve value (could be a formula or number)
	const value = resolveValue(ruleElement.value, context);

	if (value === null) {
		return null;
	}

	// Parse property path to resolve any placeholders
	const resolvedPath = resolvePath(ruleElement.path, context);

	return {
		source: context.source,
		path: resolvedPath,
		mode: ruleElement.mode,
		value,
		phase: ruleElement.phase ?? 'applyAEs',
		priority: ruleElement.priority ?? 100,
		predicate: ruleElement.predicate,
		enabled: true
	};
}

/**
 * Resolve a value that might be a number or a formula
 */
function resolveValue(value: number | string, context: RuleElementContext): number | null {
	if (typeof value === 'number') {
		return value;
	}

	// Handle @actor.level
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
	const parsed = parseFloat(value);
	if (!isNaN(parsed)) {
		return parsed;
	}

	console.warn(`Unable to resolve value: ${value}`);
	return null;
}

/**
 * Resolve a property path with placeholders
 *
 * Placeholders:
 * - {item|...} - Reference to item data or rule selections
 * - @actor.level - Character level
 *
 * Example: "system.skills.{item|flags.pf2e.rulesSelections.fighterSkill}.rank"
 * If fighterSkill = "acrobatics", resolves to: "system.skills.acrobatics.rank"
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function resolvePath(path: string, _context: RuleElementContext): string {
	// For now, we just return the path as-is
	// Full implementation would resolve {item|...} placeholders
	// This requires access to character data and rule selections

	// Simple placeholder: remove {item|...} syntax for now
	// In a full implementation, this would look up the value
	const simplified = path.replace(/\{item\|[^}]+\}/g, '(placeholder)');

	return simplified;
}

/**
 * Apply a property modification to a character object
 *
 * This is a helper for applying the modification.
 * In the full app, this would be integrated with character state management.
 */
export function applyPropertyModification(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	target: any,
	modification: PropertyModification
): void {
	if (!modification.enabled) {
		return;
	}

	// In a real implementation, this would:
	// 1. Parse the path (e.g., "system.skills.athletics.rank")
	// 2. Navigate to the property
	// 3. Apply the modification based on mode

	// This is a placeholder implementation
	console.log(
		`Would apply ${modification.mode} ${modification.value} to ${modification.path} from ${modification.source}`
	);

	// Example of what a real implementation might look like:
	// const keys = modification.path.split('.');
	// let current = target;
	// for (let i = 0; i < keys.length - 1; i++) {
	//   current = current[keys[i]];
	// }
	// const finalKey = keys[keys.length - 1];
	// const currentValue = current[finalKey] ?? 0;
	// current[finalKey] = applyMode(currentValue, modification.value, modification.mode);
}

/**
 * Apply a modification mode to a value
 *
 * This is a helper function for the full implementation of applyPropertyModification.
 * Currently unused but kept for reference.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _applyMode(current: number, value: number, mode: string): number {
	switch (mode) {
		case 'add':
			return current + value;
		case 'subtract':
			return current - value;
		case 'multiply':
			return current * value;
		case 'override':
			return value;
		case 'upgrade':
			return Math.max(current, value);
		case 'downgrade':
			return Math.min(current, value);
		default:
			return current;
	}
}

/**
 * Sort modifications by phase and priority
 */
export function sortModifications(modifications: PropertyModification[]): PropertyModification[] {
	const phaseOrder = {
		applyAEs: 1,
		beforeDerived: 2,
		afterDerived: 3,
		beforeRoll: 4
	};

	return [...modifications].sort((a, b) => {
		// Sort by phase first
		const phaseA = phaseOrder[a.phase as keyof typeof phaseOrder] ?? 999;
		const phaseB = phaseOrder[b.phase as keyof typeof phaseOrder] ?? 999;

		if (phaseA !== phaseB) {
			return phaseA - phaseB;
		}

		// Then by priority
		return a.priority - b.priority;
	});
}

/**
 * Check if a modification should apply based on predicates
 */
export function shouldApplyModification(
	modification: PropertyModification,
	activeConditions: Set<string>
): boolean {
	if (!modification.enabled) {
		return false;
	}

	if (!modification.predicate || modification.predicate.length === 0) {
		return true;
	}

	return modification.predicate.every((condition) => activeConditions.has(condition));
}

/**
 * Get all active modifications
 */
export function getActiveModifications(
	modifications: PropertyModification[],
	activeConditions: Set<string>
): PropertyModification[] {
	return modifications.filter((mod) => shouldApplyModification(mod, activeConditions));
}
