/**
 * Ancestry Adapter
 *
 * Transforms Foundry VTT PF2e ancestry data into our application schema.
 *
 * Transformation Notes (Apache 2.0 requirement):
 * - Foundry's `_id` is mapped to our `id`
 * - `system.boosts` object (indexed by number) is converted to sorted array of AbilityBoost
 * - `system.flaws` object is converted to sorted array of AbilityFlaw
 * - `system.languages.value` and `additionalLanguages` are restructured
 * - Foundry-specific fields like `folder`, `img`, `items` are excluded
 */

import type { FoundryAncestry } from '../types/foundry';
import type { Ancestry, AbilityBoost, AbilityFlaw } from '../types/app';

/**
 * Transform a Foundry ancestry into our app schema
 */
export function adaptAncestry(foundryAncestry: FoundryAncestry): Ancestry {
	return {
		type: 'ancestry',
		id: foundryAncestry._id,
		name: foundryAncestry.name,
		description: foundryAncestry.system.description.value,
		hp: foundryAncestry.system.hp,
		size: foundryAncestry.system.size,
		speed: foundryAncestry.system.speed,
		boosts: extractBoosts(foundryAncestry),
		flaws: extractFlaws(foundryAncestry),
		languages: foundryAncestry.system.languages.value,
		additionalLanguages: {
			count: foundryAncestry.system.additionalLanguages.count,
			options: foundryAncestry.system.additionalLanguages.value
		},
		vision: foundryAncestry.system.vision,
		traits: foundryAncestry.system.traits.value,
		rarity: foundryAncestry.system.traits.rarity,
		source: {
			title: foundryAncestry.system.publication.title,
			license: foundryAncestry.system.publication.license,
			remaster: foundryAncestry.system.publication.remaster
		},
		rules: foundryAncestry.system.rules
	};
}

/**
 * Extract ability boosts from Foundry format
 *
 * Foundry stores boosts as an object keyed by index (e.g., "0", "1", "2").
 * We convert this to a sorted array of AbilityBoost objects.
 *
 * A boost with multiple options (e.g., ["str", "dex", "con", "int", "wis", "cha"])
 * represents a free choice.
 */
function extractBoosts(foundryAncestry: FoundryAncestry): AbilityBoost[] {
	const boosts: AbilityBoost[] = [];

	// Sort by index to ensure correct order
	const indices = Object.keys(foundryAncestry.system.boosts)
		.map(Number)
		.sort((a, b) => a - b);

	for (const index of indices) {
		const boost = foundryAncestry.system.boosts[index.toString()];

		if (!boost || !boost.value || boost.value.length === 0) {
			continue;
		}

		boosts.push({
			index,
			options: boost.value,
			// If 6 options (all abilities), it's a free boost
			free: boost.value.length === 6
		});
	}

	return boosts;
}

/**
 * Extract ability flaws from Foundry format
 *
 * Similar to boosts, but flaws are typically fixed (not a choice).
 * Most ancestries have no flaws.
 */
function extractFlaws(foundryAncestry: FoundryAncestry): AbilityFlaw[] {
	const flaws: AbilityFlaw[] = [];

	const indices = Object.keys(foundryAncestry.system.flaws)
		.map(Number)
		.sort((a, b) => a - b);

	for (const index of indices) {
		const flaw = foundryAncestry.system.flaws[index.toString()];

		if (!flaw || !flaw.value || flaw.value.length === 0) {
			continue;
		}

		flaws.push({
			index,
			options: flaw.value
		});
	}

	return flaws;
}

/**
 * Adapt multiple ancestries at once
 */
export function adaptAncestries(foundryAncestries: FoundryAncestry[]): Ancestry[] {
	return foundryAncestries.map(adaptAncestry);
}

/**
 * Get ancestry speed
 */
export function getAncestrySpeed(ancestry: Ancestry): number {
	return ancestry.speed;
}

/**
 * Get number of free boosts (boosts with all 6 ability options)
 */
export function getFreeBoostCount(ancestry: Ancestry): number {
	return ancestry.boosts.filter((boost) => boost.free).length;
}

/**
 * Get number of fixed boosts (boosts with limited options)
 */
export function getFixedBoostCount(ancestry: Ancestry): number {
	return ancestry.boosts.filter((boost) => !boost.free).length;
}
