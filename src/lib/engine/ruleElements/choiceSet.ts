/**
 * ChoiceSet Rule Element
 *
 * Presents choices to the user during character creation or leveling.
 * The user's selection is stored and can be referenced by other rule elements.
 *
 * Example: Fighter chooses between Acrobatics or Athletics for trained proficiency
 */

import type { RuleElementContext } from './flatModifier';

/**
 * ChoiceSet data from Foundry VTT
 */
export interface ChoiceSetRuleElement {
	key: 'ChoiceSet';
	/** Unique identifier for this choice (used to reference the selection) */
	flag?: string;
	/** Prompt text to show the user */
	prompt?: string;
	/** Whether to adjust the item name based on the choice */
	adjustName?: boolean;
	/** Available choices */
	choices: Choice[];
	/** Whether the user can select multiple options */
	allowedDrops?: {
		label?: string;
		predicate?: string[];
	};
	/** Predicate for when this choice is available */
	predicate?: string[];
	/** Number of choices to make (default: 1) */
	selection?: number;
}

/**
 * A single choice option
 */
export interface Choice {
	/** Display label for this choice */
	label: string;
	/** Value to store when this choice is selected */
	value: string;
	/** Optional predicate for when this choice is available */
	predicate?: string[];
	/** Optional image/icon */
	img?: string;
}

/**
 * Processed choice set for UI presentation
 */
export interface ChoiceSetPrompt {
	/** Source of this choice */
	source: string;
	/** Unique identifier for storing the selection */
	flag: string;
	/** Prompt to display to the user */
	prompt: string;
	/** Available choices */
	choices: Choice[];
	/** Number of selections required */
	selectionCount: number;
	/** Whether this adjusts the parent item's name */
	adjustName: boolean;
	/** User's current selection(s) */
	selection?: string | string[];
}

/**
 * Process a ChoiceSet rule element
 */
export function processChoiceSet(
	ruleElement: ChoiceSetRuleElement,
	context: RuleElementContext
): ChoiceSetPrompt | null {
	if (!ruleElement.choices || ruleElement.choices.length === 0) {
		console.warn('ChoiceSet has no choices');
		return null;
	}

	// Generate a flag if not provided
	const flag = ruleElement.flag || `choice-${context.source.toLowerCase().replace(/\s+/g, '-')}`;

	return {
		source: context.source,
		flag,
		prompt: ruleElement.prompt || 'Make a selection',
		choices: ruleElement.choices,
		selectionCount: ruleElement.selection ?? 1,
		adjustName: ruleElement.adjustName ?? false,
		selection: undefined // Will be filled in by user
	};
}

/**
 * Filter available choices based on predicates
 */
export function getAvailableChoices(
	choiceSet: ChoiceSetPrompt,
	activeConditions: Set<string>
): Choice[] {
	return choiceSet.choices.filter((choice) => {
		if (!choice.predicate || choice.predicate.length === 0) {
			return true;
		}
		return choice.predicate.every((condition) => activeConditions.has(condition));
	});
}

/**
 * Validate a user's selection
 */
export function validateSelection(
	choiceSet: ChoiceSetPrompt,
	selection: string | string[]
): boolean {
	const selections = Array.isArray(selection) ? selection : [selection];

	// Check selection count
	if (selections.length !== choiceSet.selectionCount) {
		return false;
	}

	// Check all selections are valid choices
	const validValues = new Set(choiceSet.choices.map((c) => c.value));
	return selections.every((s) => validValues.has(s));
}

/**
 * Apply a user's selection to a choice set
 */
export function applySelection(
	choiceSet: ChoiceSetPrompt,
	selection: string | string[]
): ChoiceSetPrompt {
	return {
		...choiceSet,
		selection
	};
}

/**
 * Get the display label for a selected value
 */
export function getSelectionLabel(choiceSet: ChoiceSetPrompt, value: string): string | null {
	const choice = choiceSet.choices.find((c) => c.value === value);
	return choice?.label ?? null;
}

/**
 * Check if a choice set has been completed
 */
export function isChoiceSetComplete(choiceSet: ChoiceSetPrompt): boolean {
	if (!choiceSet.selection) {
		return false;
	}

	const selections = Array.isArray(choiceSet.selection)
		? choiceSet.selection
		: [choiceSet.selection];

	return selections.length === choiceSet.selectionCount;
}

/**
 * Get all incomplete choice sets
 */
export function getIncompleteChoiceSets(choiceSets: ChoiceSetPrompt[]): ChoiceSetPrompt[] {
	return choiceSets.filter((cs) => !isChoiceSetComplete(cs));
}

/**
 * Storage format for user selections
 *
 * This would be stored in character data as:
 * character.ruleSelections = { "fighterSkill": "acrobatics", ... }
 */
export type RuleSelections = Record<string, string | string[]>;

/**
 * Get a selection value by flag name
 */
export function getSelection(selections: RuleSelections, flag: string): string | string[] | null {
	return selections[flag] ?? null;
}

/**
 * Set a selection value
 */
export function setSelection(
	selections: RuleSelections,
	flag: string,
	value: string | string[]
): RuleSelections {
	return {
		...selections,
		[flag]: value
	};
}
