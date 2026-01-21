/**
 * Immunity Rule Element
 *
 * Grants immunity to specific damage types, conditions, or effects.
 * Common sources: Racial traits (constructs immune to poison), spells, high-level features.
 *
 * PF2e Rules:
 * - Immunity completely negates the specified damage/effect
 * - Can be immunity to damage types, conditions, or specific effects
 * - Immunity supersedes resistance and weakness
 */

import type { PredicateStatement } from '../predicates';

/**
 * Immunity data from Foundry VTT
 */
export interface ImmunityRuleElement {
	key: 'Immunity';

	/** Type of immunity */
	type: 'damage' | 'condition' | 'effect' | 'critical-hits' | 'precision-damage';

	/** What the character is immune to */
	value: string | string[]; // e.g., "fire", "poison", "bleed", "paralyzed"

	/** Predicate for conditional application */
	predicate?: PredicateStatement[];

	/** Label/source */
	label?: string;
}

/**
 * Result of processing immunity
 */
export interface ImmunityResult {
	/** Type of immunity */
	type: 'damage' | 'condition' | 'effect' | 'critical-hits' | 'precision-damage';

	/** What is being immunized */
	values: string[];

	/** Source/label */
	source: string;

	/** Predicate for conditional application */
	predicate?: PredicateStatement[];
}

/**
 * Context for processing immunity
 */
export interface ImmunityContext {
	source: string;
}

/**
 * Process an Immunity rule element
 */
export function processImmunity(
	ruleElement: ImmunityRuleElement,
	context: ImmunityContext
): ImmunityResult {
	const values = Array.isArray(ruleElement.value) ? ruleElement.value : [ruleElement.value];

	return {
		type: ruleElement.type,
		values,
		source: ruleElement.label ?? context.source,
		predicate: ruleElement.predicate
	};
}

/**
 * Check if immune to a specific damage type
 *
 * @param immunities - Array of immunity sources
 * @param damageType - Type of damage
 * @returns true if immune
 */
export function isImmuneToDamage(immunities: ImmunityResult[], damageType: string): boolean {
	return immunities.some(
		(immunity) => immunity.type === 'damage' && immunity.values.includes(damageType)
	);
}

/**
 * Check if immune to a specific condition
 *
 * @param immunities - Array of immunity sources
 * @param condition - Condition name
 * @returns true if immune
 */
export function isImmuneToCondition(immunities: ImmunityResult[], condition: string): boolean {
	return immunities.some(
		(immunity) => immunity.type === 'condition' && immunity.values.includes(condition)
	);
}

/**
 * Check if immune to critical hits
 *
 * @param immunities - Array of immunity sources
 * @returns true if immune to critical hits
 */
export function isImmuneToCriticalHits(immunities: ImmunityResult[]): boolean {
	return immunities.some((immunity) => immunity.type === 'critical-hits');
}

/**
 * Check if immune to precision damage
 *
 * @param immunities - Array of immunity sources
 * @returns true if immune to precision damage
 */
export function isImmuneToPrecisionDamage(immunities: ImmunityResult[]): boolean {
	return immunities.some((immunity) => immunity.type === 'precision-damage');
}

/**
 * Apply immunities to damage
 *
 * @param damage - Amount of damage
 * @param damageType - Type of damage
 * @param immunities - Array of immunity sources
 * @returns Damage after immunities (0 if immune)
 */
export function applyImmunities(
	damage: number,
	damageType: string,
	immunities: ImmunityResult[]
): number {
	if (isImmuneToDamage(immunities, damageType)) {
		return 0;
	}
	return damage;
}
