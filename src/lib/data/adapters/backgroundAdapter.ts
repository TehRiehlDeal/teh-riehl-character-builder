/**
 * Background Adapter
 *
 * Transforms Foundry VTT PF2e background data into our application schema.
 *
 * Transformation Notes (Apache 2.0 requirement):
 * - Foundry's `_id` is mapped to our `id`
 * - `system.boosts` object (indexed by number) is converted to sorted array of AbilityBoost
 * - `system.trainedSkills.value` contains regular skills
 * - `system.trainedSkills.lore` contains lore skills (handled separately)
 * - `items` object contains granted feats - excluded from background data (features loaded separately)
 * - Foundry-specific fields like `folder`, `img` are excluded
 */

import type { FoundryBackground } from '../types/foundry';
import type { Background, AbilityBoost } from '../types/app';

/**
 * Transform a Foundry background into our app schema
 */
export function adaptBackground(foundryBackground: FoundryBackground): Background {
	return {
		type: 'background',
		id: foundryBackground._id,
		name: foundryBackground.name,
		description: foundryBackground.system.description.value,
		boosts: extractBoosts(foundryBackground),
		trainedSkills: foundryBackground.system.trainedSkills.value,
		traits: foundryBackground.system.traits.value,
		rarity: foundryBackground.system.traits.rarity,
		source: {
			title: foundryBackground.system.publication.title,
			license: foundryBackground.system.publication.license,
			remaster: foundryBackground.system.publication.remaster
		},
		rules: foundryBackground.system.rules
	};
}

/**
 * Extract ability boosts from Foundry format
 *
 * Foundry stores boosts as an object keyed by index (e.g., "0", "1").
 * Typically backgrounds have:
 * - Boost 0: 2 specific ability options (e.g., Int or Wis)
 * - Boost 1: Free boost (all 6 abilities)
 */
function extractBoosts(foundryBackground: FoundryBackground): AbilityBoost[] {
	const boosts: AbilityBoost[] = [];

	// Sort by index to ensure correct order
	const indices = Object.keys(foundryBackground.system.boosts)
		.map(Number)
		.sort((a, b) => a - b);

	for (const index of indices) {
		const boost = foundryBackground.system.boosts[index.toString()];

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
 * Adapt multiple backgrounds at once
 */
export function adaptBackgrounds(foundryBackgrounds: FoundryBackground[]): Background[] {
	return foundryBackgrounds.map(adaptBackground);
}

/**
 * Get number of ability boosts granted
 */
export function getBoostCount(background: Background): number {
	return background.boosts.length;
}

/**
 * Get number of free boosts (boosts with all 6 ability options)
 */
export function getFreeBoostCount(background: Background): number {
	return background.boosts.filter((boost) => boost.free).length;
}

/**
 * Get trained skills granted
 */
export function getTrainedSkills(background: Background): string[] {
	return background.trainedSkills;
}
