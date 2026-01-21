/**
 * ActorTraits Rule Element
 *
 * Adds or removes traits from a character.
 * Traits are descriptive tags that can affect rules interactions.
 *
 * Common uses:
 * - Adding "humanoid" trait
 * - Adding alignment traits (good, evil, lawful, chaotic)
 * - Adding size traits
 * - Removing traits (e.g., polymorph removing "humanoid")
 *
 * Traits can be checked by predicates and affect various mechanics.
 */

import type { PredicateStatement } from '../predicates';

/**
 * ActorTraits data from Foundry VTT
 */
export interface ActorTraitsRuleElement {
	key: 'ActorTraits';

	/** Traits to add */
	add?: string[];

	/** Traits to remove */
	remove?: string[];

	/** Predicate for conditional application */
	predicate?: PredicateStatement[];
}

/**
 * Result of processing actor traits
 */
export interface ActorTraitsResult {
	/** Traits to add */
	add: string[];

	/** Traits to remove */
	remove: string[];

	/** Source of the trait modification */
	source: string;

	/** Predicate for conditional application */
	predicate?: PredicateStatement[];
}

/**
 * Context for processing actor traits
 */
export interface ActorTraitsContext {
	source: string;
}

/**
 * Process an ActorTraits rule element
 */
export function processActorTraits(
	ruleElement: ActorTraitsRuleElement,
	context: ActorTraitsContext
): ActorTraitsResult {
	return {
		add: ruleElement.add ?? [],
		remove: ruleElement.remove ?? [],
		source: context.source,
		predicate: ruleElement.predicate
	};
}

/**
 * Apply trait modifications to a character's trait list
 *
 * @param baseTraits - Character's base traits
 * @param traitModifiers - Array of trait modification sources
 * @returns Final list of traits
 */
export function calculateFinalTraits(
	baseTraits: string[],
	traitModifiers: ActorTraitsResult[]
): string[] {
	// Start with base traits
	const traits = new Set(baseTraits);

	// Apply all modifications in order
	for (const modifier of traitModifiers) {
		// Remove traits
		for (const trait of modifier.remove) {
			traits.delete(trait.toLowerCase());
		}

		// Add traits
		for (const trait of modifier.add) {
			traits.add(trait.toLowerCase());
		}
	}

	return Array.from(traits).sort();
}

/**
 * Check if a character has a specific trait
 *
 * @param traits - Character's traits
 * @param trait - Trait to check for
 * @returns true if character has the trait
 */
export function hasTrait(traits: string[], trait: string): boolean {
	return traits.some((t) => t.toLowerCase() === trait.toLowerCase());
}

/**
 * Check if a character has any of the specified traits
 *
 * @param traits - Character's traits
 * @param checkTraits - Traits to check for
 * @returns true if character has at least one of the traits
 */
export function hasAnyTrait(traits: string[], checkTraits: string[]): boolean {
	return checkTraits.some((trait) => hasTrait(traits, trait));
}

/**
 * Check if a character has all of the specified traits
 *
 * @param traits - Character's traits
 * @param checkTraits - Traits to check for
 * @returns true if character has all of the traits
 */
export function hasAllTraits(traits: string[], checkTraits: string[]): boolean {
	return checkTraits.every((trait) => hasTrait(traits, trait));
}

/**
 * Get trait category (e.g., "alignment", "size", "type")
 */
export function getTraitCategory(trait: string): string | null {
	const alignmentTraits = ['lawful', 'chaotic', 'good', 'evil', 'neutral'];
	const sizeTraits = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];
	const creatureTypes = [
		'aberration',
		'animal',
		'astral',
		'beast',
		'celestial',
		'construct',
		'dragon',
		'elemental',
		'ethereal',
		'fey',
		'fiend',
		'fungus',
		'humanoid',
		'monitor',
		'ooze',
		'plant',
		'spirit',
		'undead'
	];

	const lowerTrait = trait.toLowerCase();

	if (alignmentTraits.includes(lowerTrait)) {
		return 'alignment';
	}
	if (sizeTraits.includes(lowerTrait)) {
		return 'size';
	}
	if (creatureTypes.includes(lowerTrait)) {
		return 'creature-type';
	}

	return null;
}
