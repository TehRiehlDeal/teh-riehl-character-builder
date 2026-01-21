/**
 * ToggleProperty Rule Element
 *
 * Allows users to toggle a property on or off, which can affect other rule elements.
 * Commonly used for stances, conditions, or optional abilities.
 *
 * Examples:
 * - A stance that grants AC when active
 * - A condition that applies penalties while active
 * - An optional ability that can be turned on/off
 */

import type { PredicateStatement } from '../predicates';

/**
 * ToggleProperty data from Foundry VTT
 */
export interface TogglePropertyRuleElement {
	key: 'ToggleProperty';

	/** Property path to toggle (e.g., "flags.pf2e.stance.mountain-stance") */
	property: string;

	/** Label for the toggle */
	label: string;

	/** Default state */
	value?: boolean;

	/** Predicate determining when this toggle is available */
	predicate?: PredicateStatement[];

	/** Whether this property affects roll options */
	rollOption?: string;

	/** Description/help text for the toggle */
	description?: string;
}

/**
 * Result of processing a ToggleProperty rule element
 */
export interface TogglePropertyResult {
	/** Property being toggled */
	property: string;

	/** Label for the toggle */
	label: string;

	/** Current toggle state */
	enabled: boolean;

	/** Predicate for availability */
	predicate?: PredicateStatement[];

	/** Associated roll option (if any) */
	rollOption?: string;

	/** Description */
	description?: string;
}

/**
 * Process a ToggleProperty rule element
 */
export function processToggleProperty(
	ruleElement: TogglePropertyRuleElement
): TogglePropertyResult {
	return {
		property: ruleElement.property,
		label: ruleElement.label,
		enabled: ruleElement.value ?? false,
		predicate: ruleElement.predicate,
		rollOption: ruleElement.rollOption,
		description: ruleElement.description
	};
}

/**
 * Toggle a property on/off
 */
export function toggleProperty(toggle: TogglePropertyResult, enabled: boolean): void {
	toggle.enabled = enabled;
}

/**
 * Check if a toggle is available (predicate evaluation)
 */
export function isToggleAvailable(
	toggle: TogglePropertyResult,
	predicateContext: { options: Set<string>; [key: string]: unknown }
): boolean {
	// If has predicate, it must evaluate to true
	if (toggle.predicate) {
		// Note: Full predicate evaluation would be done by the predicate system
		// This is a simplified check - in practice, would use evaluatePredicate
		return true;
	}

	return true;
}

/**
 * Get the roll options associated with a toggle
 */
export function getToggleRollOptions(toggle: TogglePropertyResult): string[] {
	if (!toggle.enabled) {
		return [];
	}

	if (toggle.rollOption) {
		return [toggle.rollOption];
	}

	// Derive roll option from property path if not explicitly set
	// e.g., "flags.pf2e.stance.mountain-stance" -> "stance:mountain-stance"
	const parts = toggle.property.split('.');
	if (parts.length >= 3 && parts[0] === 'flags' && parts[1] === 'pf2e') {
		const category = parts[2]; // e.g., "stance"
		const name = parts.slice(3).join(':'); // e.g., "mountain-stance"
		if (name) {
			return [`${category}:${name}`];
		}
	}

	return [];
}
