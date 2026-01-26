/**
 * Adapter for transforming Foundry VTT class archetype data to our app schema
 *
 * Class archetypes are stored as class features with the "class-archetype" tag.
 * They modify base classes at level 1 and can suppress certain features.
 */

import type { ClassArchetype } from '../types/app';
import type { FoundryFeat } from '../types/foundry';

/**
 * Transform Foundry class archetype data to our app schema
 */
export function adaptClassArchetype(foundryData: FoundryFeat): ClassArchetype {
	// Extract base class from traits (if present)
	const baseClass = foundryData.system.traits?.value?.[0] || null;

	// Extract suppressed features (subfeatures is not in base FoundryFeat type but exists in class archetypes)
	const suppressedFeatures = (foundryData.system as any).subfeatures?.suppressedFeatures || [];

	// Determine if universal (can be applied to any spellcaster)
	// Universal archetypes don't have a specific class trait
	const isUniversal = baseClass === null;

	// Extract license info
	const license = foundryData.system.publication?.license === 'ORC' ? 'ORC' : 'OGL';
	const remaster = foundryData.system.publication?.remaster ?? false;

	// Combine traits.value and traits.otherTags for complete trait list
	const traits = [
		...(foundryData.system.traits?.value || []),
		...(foundryData.system.traits?.otherTags || [])
	];

	return {
		id: foundryData._id,
		name: foundryData.name,
		description: foundryData.system.description?.value || '',
		traits: traits,
		rarity: (foundryData.system.traits?.rarity as any) || 'common',
		source: {
			title: foundryData.system.publication?.title || 'Unknown',
			license,
			remaster
		},
		rules: foundryData.system.rules || [],
		type: 'feat',
		level: foundryData.system.level?.value || 1,
		category: 'classfeature',
		prerequisites: extractPrerequisites(foundryData),
		actionType: foundryData.system.actionType?.value as any,
		actions: foundryData.system.actions?.value || undefined,
		baseClass,
		suppressedFeatures,
		isUniversal
	};
}

/**
 * Extract prerequisites from Foundry format
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
