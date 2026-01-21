import type { Modifier, ModifierType } from '../models/Modifier';
import { isBonus, isPenalty } from '../models/Modifier';

/**
 * Stacking Rules - Core PF2e modifier stacking logic
 *
 * Rules from Pathfinder 2e:
 * 1. Bonuses of the same type don't stack (only the highest applies)
 *    - Status bonuses don't stack with other status bonuses
 *    - Circumstance bonuses don't stack with other circumstance bonuses
 *    - Item bonuses don't stack with other item bonuses
 * 2. Untyped bonuses always stack
 * 3. All penalties stack (regardless of type)
 * 4. Bonuses and penalties can coexist and offset each other
 */

/**
 * Apply stacking rules to a list of modifiers and return the total value
 */
export function applyStackingRules(modifiers: Modifier[]): number {
	const bonuses = modifiers.filter(isBonus);
	const penalties = modifiers.filter(isPenalty);

	const bonusTotal = calculateBonuses(bonuses);
	const penaltyTotal = calculatePenalties(penalties);

	return bonusTotal + penaltyTotal;
}

/**
 * Calculate total bonus value with stacking rules
 *
 * Groups bonuses by type and applies:
 * - For typed bonuses: only the highest applies
 * - For untyped bonuses: all stack
 */
export function calculateBonuses(bonuses: Modifier[]): number {
	const byType = groupByType(bonuses);
	let total = 0;

	for (const [type, mods] of byType.entries()) {
		if (type === 'untyped') {
			// All untyped bonuses stack
			total += sumModifiers(mods);
		} else {
			// Only the highest typed bonus applies
			total += getHighestValue(mods);
		}
	}

	return total;
}

/**
 * Calculate total penalty value
 *
 * All penalties stack regardless of type
 */
export function calculatePenalties(penalties: Modifier[]): number {
	return sumModifiers(penalties);
}

/**
 * Group modifiers by their type
 */
export function groupByType(modifiers: Modifier[]): Map<ModifierType, Modifier[]> {
	const grouped = new Map<ModifierType, Modifier[]>();

	for (const modifier of modifiers) {
		if (!grouped.has(modifier.type)) {
			grouped.set(modifier.type, []);
		}
		grouped.get(modifier.type)!.push(modifier);
	}

	return grouped;
}

/**
 * Get the highest value from a list of modifiers
 */
export function getHighestValue(modifiers: Modifier[]): number {
	if (modifiers.length === 0) return 0;
	return Math.max(...modifiers.map((m) => m.value));
}

/**
 * Get the lowest value from a list of modifiers (for penalties)
 */
export function getLowestValue(modifiers: Modifier[]): number {
	if (modifiers.length === 0) return 0;
	return Math.min(...modifiers.map((m) => m.value));
}

/**
 * Sum all modifier values
 */
export function sumModifiers(modifiers: Modifier[]): number {
	return modifiers.reduce((sum, m) => sum + m.value, 0);
}

/**
 * Find which bonuses are actually applied vs suppressed by stacking rules
 */
export function getAppliedBonuses(bonuses: Modifier[]): Set<Modifier> {
	const applied = new Set<Modifier>();
	const byType = groupByType(bonuses);

	for (const [type, mods] of byType.entries()) {
		if (type === 'untyped') {
			// All untyped bonuses apply
			mods.forEach((m) => applied.add(m));
		} else {
			// Only the highest bonus of each type applies
			const highest = getHighestValue(mods);
			const highestMods = mods.filter((m) => m.value === highest);
			// If multiple have the same highest value, all apply
			highestMods.forEach((m) => applied.add(m));
		}
	}

	return applied;
}

/**
 * Check if a modifier would stack with existing modifiers
 */
export function wouldStack(newModifier: Modifier, existingModifiers: Modifier[]): boolean {
	// Penalties always stack
	if (isPenalty(newModifier)) {
		return true;
	}

	// Untyped bonuses always stack
	if (newModifier.type === 'untyped') {
		return true;
	}

	// For typed bonuses, check if this would be the highest
	const sameType = existingModifiers.filter(
		(m) => isBonus(m) && m.type === newModifier.type
	);

	if (sameType.length === 0) {
		return true;
	}

	const currentHighest = getHighestValue(sameType);
	return newModifier.value > currentHighest;
}

/**
 * Get a human-readable explanation of why a modifier is/isn't applying
 */
export function getStackingExplanation(
	modifier: Modifier,
	allModifiers: Modifier[]
): string {
	if (isPenalty(modifier)) {
		return 'All penalties stack';
	}

	if (modifier.type === 'untyped') {
		return 'Untyped bonuses stack';
	}

	const sameType = allModifiers.filter(
		(m) => m !== modifier && isBonus(m) && m.type === modifier.type
	);

	if (sameType.length === 0) {
		return `Only ${modifier.type} bonus`;
	}

	const highest = getHighestValue([...sameType, modifier]);

	if (modifier.value === highest) {
		return `Highest ${modifier.type} bonus`;
	} else {
		const higherMods = sameType.filter((m) => m.value > modifier.value);
		const higherSource = higherMods[0]?.source || 'another source';
		return `Suppressed by higher ${modifier.type} bonus from ${higherSource}`;
	}
}

/**
 * Apply stacking rules and return only the modifiers that should apply
 */
export function applyModifierStacking(modifiers: Modifier[]): Modifier[] {
	if (!modifiers || modifiers.length === 0) {
		return [];
	}

	const bonuses = modifiers.filter(isBonus);
	const penalties = modifiers.filter(isPenalty);

	// All penalties apply
	const appliedBonuses = getAppliedBonuses(bonuses);

	return [...Array.from(appliedBonuses), ...penalties];
}
