import type { RuleElementContext } from './flatModifier';

/**
 * BaseSpeed Rule Element
 *
 * Sets or modifies a character's base speed.
 * Example: Ancestry might set base speed to 25 feet, or a feat might add +5 feet
 *
 * Note: This is different from a FlatModifier because it can SET the base value,
 * not just add to it.
 */

/**
 * BaseSpeed data from Foundry VTT
 */
export interface BaseSpeedRuleElement {
	key: 'BaseSpeed';
	/** Selector for the speed type (e.g., "land", "fly", "swim", "burrow") */
	selector?: string;
	/** The speed value */
	value: number;
	/** Label for this speed */
	label?: string;
	/** Predicate for when this applies */
	predicate?: string[];
}

/**
 * Speed data
 */
export interface Speed {
	type: string;
	value: number;
	source: string;
	predicate?: string[];
}

/**
 * Process a BaseSpeed rule element
 */
export function processBaseSpeed(
	ruleElement: BaseSpeedRuleElement,
	context: RuleElementContext
): Speed {
	const type = ruleElement.selector ?? 'land';

	return {
		type,
		value: ruleElement.value,
		source: context.source,
		predicate: ruleElement.predicate
	};
}

/**
 * Get the final speed value from multiple speed sources
 *
 * For base speeds, the highest value typically wins (unlike modifiers which add)
 */
export function calculateSpeed(speeds: Speed[], activeConditions: Set<string>): number {
	const applicable = speeds.filter((s) => shouldApplySpeed(s, activeConditions));

	if (applicable.length === 0) {
		return 0;
	}

	// Return the highest base speed
	return Math.max(...applicable.map((s) => s.value));
}

/**
 * Get all speed types available to the character
 */
export function getSpeedTypes(speeds: Speed[]): Map<string, number> {
	const speedMap = new Map<string, number>();

	// Group by type
	const byType = new Map<string, Speed[]>();
	for (const speed of speeds) {
		if (!byType.has(speed.type)) {
			byType.set(speed.type, []);
		}
		byType.get(speed.type)!.push(speed);
	}

	// For each type, take the highest value
	for (const [type, speedList] of byType.entries()) {
		const maxSpeed = Math.max(...speedList.map((s) => s.value));
		speedMap.set(type, maxSpeed);
	}

	return speedMap;
}

/**
 * Check if a speed should apply based on predicates
 */
function shouldApplySpeed(speed: Speed, activeConditions: Set<string>): boolean {
	if (!speed.predicate || speed.predicate.length === 0) {
		return true;
	}

	return speed.predicate.every((condition) => activeConditions.has(condition));
}

/**
 * Format speeds for display
 * Example: "30 feet, fly 60 feet"
 */
export function formatSpeeds(speeds: Map<string, number>): string {
	const parts: string[] = [];

	for (const [type, value] of speeds.entries()) {
		if (type === 'land') {
			parts.unshift(`${value} feet`); // Land speed first
		} else {
			parts.push(`${type} ${value} feet`);
		}
	}

	return parts.join(', ');
}
