/**
 * WeaponPotency Rule Element
 *
 * Applies a potency bonus to weapon attack rolls and damage.
 * This is typically from magical weapons (+1/+2/+3 weapons) or temporary effects.
 *
 * Examples:
 * - +1 weapon grants +1 item bonus to attack and damage
 * - +2 weapon grants +2 item bonus to attack and damage
 * - +3 weapon grants +3 item bonus to attack and damage
 */

import type { Modifier } from '../models/Modifier';
import { createModifier } from '../models/Modifier';

/**
 * WeaponPotency data from Foundry VTT
 */
export interface WeaponPotencyRuleElement {
	key: 'WeaponPotency';

	/** Potency bonus value (+1, +2, or +3) */
	value: number;

	/** Selector for which weapons this applies to */
	selector?: string;

	/** Predicate for conditional application */
	predicate?: string[];
}

/**
 * Context for processing weapon potency
 */
export interface WeaponPotencyContext {
	source: string;
	level: number;
}

/**
 * Result of processing weapon potency
 */
export interface WeaponPotencyResult {
	/** Attack bonus modifier */
	attackModifier: Modifier;

	/** Damage bonus modifier */
	damageModifier: Modifier;
}

/**
 * Process a WeaponPotency rule element
 */
export function processWeaponPotency(
	ruleElement: WeaponPotencyRuleElement,
	context: WeaponPotencyContext
): WeaponPotencyResult {
	const potency = Math.min(Math.max(ruleElement.value, 1), 3); // Clamp to 1-3
	const selector = ruleElement.selector ?? 'strike-attack-roll';
	const damageSelector = selector.replace('attack-roll', 'damage');

	// Create attack bonus modifier
	const attackModifier = createModifier({
		label: `+${potency} Weapon Potency`,
		source: context.source,
		value: potency,
		type: 'item',
		selector: selector,
		predicate: ruleElement.predicate
	});

	// Create damage bonus modifier
	const damageModifier = createModifier({
		label: `+${potency} Weapon Potency`,
		source: context.source,
		value: potency,
		type: 'item',
		selector: damageSelector,
		predicate: ruleElement.predicate
	});

	return {
		attackModifier,
		damageModifier
	};
}
