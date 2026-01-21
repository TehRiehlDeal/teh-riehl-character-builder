/**
 * RollOption Rule Element
 *
 * Adds a roll option (flag) that can be checked by predicates.
 * Roll options enable conditional logic - other rule elements can check for these
 * options to determine if they should apply.
 *
 * Examples:
 * - A stance adds "stance:mountain-stance" roll option
 * - A condition adds "condition:frightened" roll option
 * - An effect adds "effect:bless" roll option
 */

import type { PredicateStatement } from '../predicates';

/**
 * RollOption data from Foundry VTT
 */
export interface RollOptionRuleElement {
	key: 'RollOption';

	/** The roll option to add (e.g., "stance:mountain-stance") */
	option: string;

	/** Domain this option applies to (e.g., "all", "attack", "damage") */
	domain?: string;

	/** Whether this option is toggleable by the user */
	toggleable?: boolean;

	/** Default toggle state (if toggleable) */
	value?: boolean;

	/** Label for the toggle (if toggleable) */
	label?: string;

	/** Predicate determining when this option is active */
	predicate?: PredicateStatement[];

	/** Whether this option is always active */
	alwaysActive?: boolean;
}

/**
 * Result of processing a RollOption rule element
 */
export interface RollOptionResult {
	/** The roll option to add */
	option: string;

	/** Domain this option applies to */
	domain: string;

	/** Whether this option is toggleable */
	toggleable: boolean;

	/** Current toggle state (if toggleable) */
	enabled: boolean;

	/** Label for the toggle */
	label?: string;

	/** Predicate for conditional activation */
	predicate?: PredicateStatement[];
}

/**
 * Process a RollOption rule element
 */
export function processRollOption(ruleElement: RollOptionRuleElement): RollOptionResult {
	return {
		option: ruleElement.option,
		domain: ruleElement.domain ?? 'all',
		toggleable: ruleElement.toggleable ?? false,
		enabled: ruleElement.value ?? ruleElement.alwaysActive ?? true,
		label: ruleElement.label,
		predicate: ruleElement.predicate
	};
}

/**
 * Check if a roll option should be active given a context
 */
export function isRollOptionActive(
	rollOption: RollOptionResult,
	predicateContext: { options: Set<string>; [key: string]: unknown }
): boolean {
	// If toggleable and disabled, not active
	if (rollOption.toggleable && !rollOption.enabled) {
		return false;
	}

	// If has predicate, evaluate it
	if (rollOption.predicate) {
		// Note: Full predicate evaluation would be done by the predicate system
		// This is a simplified check - in practice, would use evaluatePredicate
		return true;
	}

	return true;
}

/**
 * Toggle a roll option on/off
 */
export function toggleRollOption(rollOption: RollOptionResult, enabled: boolean): void {
	if (rollOption.toggleable) {
		rollOption.enabled = enabled;
	}
}
