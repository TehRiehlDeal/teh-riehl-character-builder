/**
 * Class Feature Adapter
 *
 * Transforms Foundry VTT PF2e class feature data into our application schema.
 *
 * Transformation Notes (Apache 2.0 requirement):
 * - Class features are stored as feat-type items with category "classfeature"
 * - Uses the same structure as feats but restricted to classfeature category
 * - Foundry's `_id` is mapped to our `id`
 * - Prerequisites are flattened from array of objects to array of strings
 * - Action count and type are extracted from Foundry's separate fields
 */

import type { FoundryFeat } from '../types/foundry';
import type { ClassFeature } from '../types/app';

/**
 * Transform a Foundry class feature (feat with category "classfeature") into our app schema
 */
export function adaptClassFeature(foundryFeat: FoundryFeat): ClassFeature {
	if (foundryFeat.system.category !== 'classfeature') {
		throw new Error(`Expected category 'classfeature' but got '${foundryFeat.system.category}'`);
	}

	// Combine traits.value and traits.otherTags for complete trait list
	const traits = [
		...foundryFeat.system.traits.value,
		...(foundryFeat.system.traits.otherTags || [])
	];

	const classFeature: ClassFeature = {
		type: 'feat',
		id: foundryFeat._id,
		name: foundryFeat.name,
		description: foundryFeat.system.description.value,
		level: foundryFeat.system.level.value,
		category: 'classfeature',
		prerequisites: foundryFeat.system.prerequisites.value.map((p) => p.value || ''),
		traits: traits,
		rarity: foundryFeat.system.traits.rarity,
		source: {
			title: foundryFeat.system.publication.title,
			license: foundryFeat.system.publication.license,
			remaster: foundryFeat.system.publication.remaster
		},
		rules: foundryFeat.system.rules
	};

	// Add action type if present
	if (foundryFeat.system.actionType?.value) {
		classFeature.actionType = foundryFeat.system.actionType.value;
	}

	// Add action count if present
	if (foundryFeat.system.actions?.value) {
		classFeature.actions = foundryFeat.system.actions.value;
	}

	return classFeature;
}

/**
 * Adapt multiple class features at once
 */
export function adaptClassFeatures(foundryFeats: FoundryFeat[]): ClassFeature[] {
	return foundryFeats.filter((f) => f.system.category === 'classfeature').map(adaptClassFeature);
}

/**
 * Check if a Foundry feat is a class feature
 */
export function isClassFeature(foundryFeat: FoundryFeat): boolean {
	return foundryFeat.system.category === 'classfeature';
}
