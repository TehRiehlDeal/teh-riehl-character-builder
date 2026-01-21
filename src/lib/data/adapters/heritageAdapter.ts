/**
 * Heritage Adapter
 *
 * Transforms Foundry VTT PF2e heritage data into our application schema.
 *
 * Transformation Notes (Apache 2.0 requirement):
 * - Foundry's `_id` is mapped to our `id`
 * - `system.ancestry.name` is used to link heritage to ancestry
 * - Foundry-specific fields like `folder`, `img` are excluded
 * - Rules are processed to extract heritage benefits
 */

import type { FoundryHeritage } from '../types/foundry';
import type { Heritage } from '../types/app';
import { processHeritageRules } from '../processors/heritageRuleProcessor';

/**
 * Transform a Foundry heritage into our app schema
 */
export function adaptHeritage(foundryHeritage: FoundryHeritage): Heritage {
	// Some heritages (versatile heritages) may have null ancestry
	const ancestry = foundryHeritage.system.ancestry;

	// Process rules to extract benefits
	const benefits = processHeritageRules(foundryHeritage.system.rules);

	return {
		type: 'heritage',
		id: foundryHeritage._id,
		name: foundryHeritage.name,
		description: foundryHeritage.system.description.value,
		ancestry: ancestry?.name || 'Versatile',
		ancestrySlug: ancestry?.slug || 'versatile',
		traits: foundryHeritage.system.traits.value,
		rarity: foundryHeritage.system.traits.rarity,
		source: {
			title: foundryHeritage.system.publication.title,
			license: foundryHeritage.system.publication.license,
			remaster: foundryHeritage.system.publication.remaster
		},
		rules: foundryHeritage.system.rules,
		benefits
	};
}

/**
 * Adapt multiple heritages at once
 */
export function adaptHeritages(foundryHeritages: FoundryHeritage[]): Heritage[] {
	return foundryHeritages.map(adaptHeritage);
}

/**
 * Filter heritages by ancestry name
 */
export function filterHeritagesByAncestry(heritages: Heritage[], ancestryName: string): Heritage[] {
	return heritages.filter((heritage) =>
		heritage.ancestry.toLowerCase() === ancestryName.toLowerCase()
	);
}

/**
 * Get heritage by ID
 */
export function getHeritageById(heritages: Heritage[], id: string): Heritage | undefined {
	return heritages.find((heritage) => heritage.id === id);
}
