/**
 * Feat Adapter
 *
 * Transforms Foundry VTT PF2e feat data into our application schema.
 *
 * Transformation Notes (Apache 2.0 requirement):
 * - Foundry's `_id` is mapped to our `id`
 * - `system.description.value` is mapped to `description`
 * - `system.prerequisites.value[]` array is flattened to string array
 * - `system.rules[]` is passed through as-is (already matches our RuleElement types)
 * - Foundry-specific fields like `folder`, `img` are excluded
 */

import type { FoundryFeat } from '../types/foundry';
import type { Feat } from '../types/app';

/**
 * Transform a Foundry feat into our app schema
 */
export function adaptFeat(foundryFeat: FoundryFeat): Feat {
	return {
		type: 'feat',
		id: foundryFeat._id,
		name: foundryFeat.name,
		description: foundryFeat.system.description.value,
		level: foundryFeat.system.level.value,
		category: foundryFeat.system.category,
		prerequisites: extractPrerequisites(foundryFeat),
		traits: foundryFeat.system.traits.value,
		rarity: foundryFeat.system.traits.rarity,
		actionType: extractActionType(foundryFeat),
		actions: extractActions(foundryFeat),
		source: {
			title: foundryFeat.system.publication.title,
			license: foundryFeat.system.publication.license,
			remaster: foundryFeat.system.publication.remaster
		},
		rules: foundryFeat.system.rules
	};
}

/**
 * Extract prerequisites from Foundry format
 *
 * Foundry stores prerequisites as an array of objects with optional `value` fields.
 * We flatten this to a simple string array.
 */
function extractPrerequisites(foundryFeat: FoundryFeat): string[] {
	if (!foundryFeat.system.prerequisites?.value) {
		return [];
	}

	return foundryFeat.system.prerequisites.value
		.map((prereq) => {
			// Handle both string and object formats
			if (typeof prereq === 'string') {
				return prereq;
			}
			return prereq.value || '';
		})
		.filter((prereq) => prereq.length > 0);
}

/**
 * Extract action type, excluding 'passive'
 *
 * If the action type is 'passive', we return undefined since passive abilities
 * don't have an associated action cost.
 */
function extractActionType(
	foundryFeat: FoundryFeat
): 'action' | 'reaction' | 'free' | 'passive' | undefined {
	const actionType = foundryFeat.system.actionType.value;

	if (!actionType || actionType === 'passive') {
		return undefined;
	}

	return actionType;
}

/**
 * Extract number of actions required
 *
 * Returns undefined if no actions are required (passive abilities)
 */
function extractActions(foundryFeat: FoundryFeat): number | undefined {
	const actions = foundryFeat.system.actions.value;

	if (actions === null || actions === undefined) {
		return undefined;
	}

	return actions;
}

/**
 * Adapt multiple feats at once
 */
export function adaptFeats(foundryFeats: FoundryFeat[]): Feat[] {
	return foundryFeats.map(adaptFeat);
}

/**
 * Filter feats by category
 */
export function filterFeatsByCategory(
	feats: Feat[],
	category: Feat['category']
): Feat[] {
	return feats.filter((feat) => feat.category === category);
}

/**
 * Filter feats by level
 */
export function filterFeatsByLevel(feats: Feat[], level: number): Feat[] {
	return feats.filter((feat) => feat.level === level);
}

/**
 * Check if a feat has prerequisites
 */
export function hasPrerequisites(feat: Feat): boolean {
	return feat.prerequisites.length > 0;
}
