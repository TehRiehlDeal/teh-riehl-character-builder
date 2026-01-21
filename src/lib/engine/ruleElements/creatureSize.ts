/**
 * CreatureSize Rule Element
 *
 * Modifies a creature's size category.
 * Common sources: Enlarge/Reduce Person spells, polymorph effects, size-changing items.
 *
 * PF2e Size Categories:
 * - Tiny
 * - Small
 * - Medium (default for most PCs)
 * - Large
 * - Huge
 * - Gargantuan
 *
 * Size affects: Reach, space occupied, bulk capacity, some skill checks
 */

import type { PredicateStatement } from '../predicates';

/**
 * PF2e size categories
 */
export type SizeCategory = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

/**
 * CreatureSize data from Foundry VTT
 */
export interface CreatureSizeRuleElement {
	key: 'CreatureSize';

	/** Target size */
	value?: SizeCategory;

	/** Relative size change (+1 = one size larger, -1 = one size smaller) */
	resizeBy?: number;

	/** Maximum size (can't grow larger than this) */
	maximumSize?: SizeCategory;

	/** Minimum size (can't shrink smaller than this) */
	minimumSize?: SizeCategory;

	/** Predicate for conditional application */
	predicate?: PredicateStatement[];
}

/**
 * Result of processing creature size
 */
export interface CreatureSizeResult {
	/** New size (if absolute) */
	size?: SizeCategory;

	/** Relative size change */
	resizeBy: number;

	/** Size limits */
	maximumSize?: SizeCategory;
	minimumSize?: SizeCategory;

	/** Source of the size change */
	source: string;

	/** Predicate for conditional application */
	predicate?: PredicateStatement[];
}

/**
 * Context for processing creature size
 */
export interface CreatureSizeContext {
	source: string;
	currentSize: SizeCategory;
}

/**
 * Size order for calculations
 */
const SIZE_ORDER: SizeCategory[] = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];

/**
 * Process a CreatureSize rule element
 */
export function processCreatureSize(
	ruleElement: CreatureSizeRuleElement,
	context: CreatureSizeContext
): CreatureSizeResult {
	return {
		size: ruleElement.value,
		resizeBy: ruleElement.resizeBy ?? 0,
		maximumSize: ruleElement.maximumSize,
		minimumSize: ruleElement.minimumSize,
		source: context.source,
		predicate: ruleElement.predicate
	};
}

/**
 * Calculate final size given base size and size modifiers
 *
 * @param baseSize - Character's base size
 * @param sizeModifiers - Array of size-changing effects
 * @returns Final size category
 */
export function calculateFinalSize(
	baseSize: SizeCategory,
	sizeModifiers: CreatureSizeResult[]
): SizeCategory {
	let currentSize = baseSize;

	for (const modifier of sizeModifiers) {
		// If absolute size is specified, use it
		if (modifier.size) {
			currentSize = modifier.size;
			continue;
		}

		// Apply relative size change
		if (modifier.resizeBy !== 0) {
			currentSize = resizeCreature(currentSize, modifier.resizeBy);
		}

		// Apply size limits
		if (modifier.maximumSize) {
			const maxIndex = SIZE_ORDER.indexOf(modifier.maximumSize);
			const currentIndex = SIZE_ORDER.indexOf(currentSize);
			if (currentIndex > maxIndex) {
				currentSize = modifier.maximumSize;
			}
		}

		if (modifier.minimumSize) {
			const minIndex = SIZE_ORDER.indexOf(modifier.minimumSize);
			const currentIndex = SIZE_ORDER.indexOf(currentSize);
			if (currentIndex < minIndex) {
				currentSize = modifier.minimumSize;
			}
		}
	}

	return currentSize;
}

/**
 * Resize a creature by a relative amount
 *
 * @param currentSize - Current size
 * @param change - Number of size categories to change (+1 = larger, -1 = smaller)
 * @returns New size category
 */
export function resizeCreature(currentSize: SizeCategory, change: number): SizeCategory {
	const currentIndex = SIZE_ORDER.indexOf(currentSize);
	const newIndex = Math.max(0, Math.min(SIZE_ORDER.length - 1, currentIndex + change));
	return SIZE_ORDER[newIndex];
}

/**
 * Get space occupied by a creature of the given size (in feet)
 */
export function getSpaceForSize(size: SizeCategory): number {
	switch (size) {
		case 'tiny':
			return 2.5; // Less than 5 feet
		case 'small':
		case 'medium':
			return 5;
		case 'large':
			return 10;
		case 'huge':
			return 15;
		case 'gargantuan':
			return 20;
	}
}

/**
 * Get reach for a creature of the given size (in feet)
 */
export function getReachForSize(size: SizeCategory): number {
	switch (size) {
		case 'tiny':
		case 'small':
		case 'medium':
			return 5;
		case 'large':
			return 10;
		case 'huge':
			return 15;
		case 'gargantuan':
			return 20;
	}
}
