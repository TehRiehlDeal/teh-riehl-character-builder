/**
 * Striking Rule Element
 *
 * Adds extra weapon damage dice. Magical weapons can have the striking property:
 * - Striking: +1 damage die
 * - Greater Striking: +2 damage dice
 * - Major Striking: +3 damage dice
 *
 * Examples:
 * - A striking longsword deals 2d8 instead of 1d8
 * - A greater striking greatsword deals 3d12 instead of 1d12
 */

import type { PredicateStatement } from '../predicates';

/**
 * Striking data from Foundry VTT
 */
export interface StrikingRuleElement {
	key: 'Striking';

	/** Number of additional damage dice (1-3) */
	value: number;

	/** Selector for which weapons this applies to */
	selector?: string;

	/** Predicate for conditional application */
	predicate?: PredicateStatement[];
}

/**
 * Result of processing striking
 */
export interface StrikingResult {
	/** Number of extra damage dice */
	extraDice: number;

	/** Selector this applies to */
	selector: string;

	/** Predicate for conditional application */
	predicate?: PredicateStatement[];

	/** Source of the bonus */
	source: string;
}

/**
 * Context for processing striking
 */
export interface StrikingContext {
	source: string;
}

/**
 * Process a Striking rule element
 */
export function processStriking(
	ruleElement: StrikingRuleElement,
	context: StrikingContext
): StrikingResult {
	const extraDice = Math.min(Math.max(ruleElement.value, 1), 3); // Clamp to 1-3
	const selector = ruleElement.selector ?? 'strike-damage';

	return {
		extraDice,
		selector,
		predicate: ruleElement.predicate,
		source: context.source
	};
}

/**
 * Get the label for striking runes
 */
export function getStrikingLabel(extraDice: number): string {
	switch (extraDice) {
		case 1:
			return 'Striking';
		case 2:
			return 'Greater Striking';
		case 3:
			return 'Major Striking';
		default:
			return `+${extraDice} Damage Dice`;
	}
}

/**
 * Calculate total damage dice for a weapon
 *
 * @param baseDice - Base number of damage dice (usually 1)
 * @param strikingBonuses - Array of striking bonuses from various sources
 * @returns Total number of damage dice
 */
export function calculateTotalDamageDice(
	baseDice: number,
	strikingBonuses: StrikingResult[]
): number {
	// Striking bonuses from the same type don't stack (item bonuses)
	// Take the highest striking bonus
	const maxStriking = strikingBonuses.reduce((max, bonus) => {
		return Math.max(max, bonus.extraDice);
	}, 0);

	return baseDice + maxStriking;
}
