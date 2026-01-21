/**
 * Utility functions for handling class feature choices
 */

import type { ClassFeature } from '$lib/data/types/app';
import type { RuleElement } from '$lib/engine/ruleElements/registry';

export interface ClassFeatureChoice {
	label: string;
	value: string;
	description?: string; // For tag-based choices, this will be the full class feature description
	uuid?: string; // For tag-based choices
}

export interface ClassFeatureChoiceInfo {
	hasChoice: boolean;
	choiceFlag?: string; // The flag name for storing the choice
	choices: ClassFeatureChoice[];
	choiceType: 'inline' | 'tag-based' | 'none';
	filterTag?: string; // For tag-based choices
}

/**
 * Extract choice information from a class feature's rules
 */
export function extractChoiceInfo(classFeature: ClassFeature): ClassFeatureChoiceInfo {
	const defaultResult: ClassFeatureChoiceInfo = {
		hasChoice: false,
		choices: [],
		choiceType: 'none'
	};

	if (!classFeature.rules || classFeature.rules.length === 0) {
		return defaultResult;
	}

	// Find the ChoiceSet rule
	const choiceSetRule = classFeature.rules.find(
		(rule: RuleElement) => rule.key === 'ChoiceSet'
	) as any;

	if (!choiceSetRule) {
		return defaultResult;
	}

	const choiceFlag = choiceSetRule.flag;

	// Check if it's inline choices (direct array)
	if (Array.isArray(choiceSetRule.choices)) {
		return {
			hasChoice: true,
			choiceFlag,
			choices: choiceSetRule.choices.map((choice: any) => ({
				label: choice.label,
				value: choice.value
			})),
			choiceType: 'inline'
		};
	}

	// Check if it's tag-based choices (filter object)
	if (choiceSetRule.choices && choiceSetRule.choices.filter) {
		// Extract the tag from the filter
		const filter = choiceSetRule.choices.filter;
		let filterTag: string | undefined;

		// The filter can be an array with various predicates
		// We need to find the tag filter (e.g., "item:tag:alchemist-research-field")
		if (Array.isArray(filter)) {
			for (const filterItem of filter) {
				if (typeof filterItem === 'string' && filterItem.startsWith('item:tag:')) {
					filterTag = filterItem.replace('item:tag:', '');
					break;
				}
			}
		}

		if (filterTag) {
			return {
				hasChoice: true,
				choiceFlag,
				choices: [], // Will be populated with matching class features
				choiceType: 'tag-based',
				filterTag
			};
		}
	}

	return defaultResult;
}

/**
 * Find all class features matching a specific tag
 */
export function findClassFeaturesByTag(
	allClassFeatures: ClassFeature[],
	tag: string
): ClassFeature[] {
	return allClassFeatures.filter((cf) =>
		cf.traits.some((t) => t.toLowerCase() === tag.toLowerCase())
	);
}

/**
 * Get complete choice information including tag-based choices
 */
export async function getCompleteChoiceInfo(
	classFeature: ClassFeature,
	allClassFeatures?: ClassFeature[]
): Promise<ClassFeatureChoiceInfo> {
	const choiceInfo = extractChoiceInfo(classFeature);

	if (choiceInfo.choiceType === 'tag-based' && choiceInfo.filterTag && allClassFeatures) {
		// Find all class features matching the tag
		const matchingFeatures = findClassFeaturesByTag(allClassFeatures, choiceInfo.filterTag);

		// Convert to choice format
		choiceInfo.choices = matchingFeatures.map((cf) => ({
			label: cf.name,
			value: cf.id,
			description: cf.description,
			uuid: `Compendium.pf2e.classfeatures.Item.${cf.name}`
		}));
	}

	return choiceInfo;
}

/**
 * Convert a class feature name to camelCase key
 * E.g., "Field Discovery" → "fieldDiscovery"
 */
function nameToCamelCase(name: string): string {
	return name
		.split(/\s+/)
		.map((word, index) => {
			if (index === 0) {
				return word.toLowerCase();
			}
			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
		})
		.join('');
}

/**
 * Extract feature mappings from a class feature's ActiveEffectLike rules
 * Returns a map of camelCase keys to specialized UUIDs
 */
export function extractFeatureMappings(classFeature: ClassFeature): Record<string, string> {
	const mappings: Record<string, string> = {};

	if (!classFeature.rules || classFeature.rules.length === 0) {
		return mappings;
	}

	// Find ActiveEffectLike rules that contain feature mappings
	for (const rule of classFeature.rules) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ruleAny = rule as any;
		if (ruleAny.key === 'ActiveEffectLike' && typeof ruleAny.value === 'object' && ruleAny.value !== null) {
			// The value object contains mappings like { fieldDiscovery: "UUID...", ... }
			Object.entries(ruleAny.value).forEach(([key, uuid]) => {
				if (typeof uuid === 'string' && uuid.startsWith('Compendium.')) {
					mappings[key] = uuid;
				}
			});
		}
	}

	return mappings;
}

/**
 * Resolve a generic class feature to its specialized version based on player selections
 *
 * @param genericFeature - The generic class feature from the class progression
 * @param classFeatureSelections - Map of choice flags to selected class feature IDs
 * @param allClassFeatures - All available class features
 * @returns The specialized class feature if found, otherwise the original
 */
export function resolveSpecializedClassFeature<T extends { name: string; uuid: string }>(
	genericFeature: T,
	classFeatureSelections: Record<string, string>,
	allClassFeatures: ClassFeature[]
): T {
	// For each selection, check if it has mappings that apply to this feature
	for (const [choiceFlag, selectedFeatureId] of Object.entries(classFeatureSelections)) {
		// Find the selected class feature
		const selectedFeature = allClassFeatures.find((cf) => cf.id === selectedFeatureId);
		if (!selectedFeature) continue;

		// Extract feature mappings from the selected feature
		const mappings = extractFeatureMappings(selectedFeature);
		if (Object.keys(mappings).length === 0) continue;

		// Convert generic feature name to camelCase key
		const camelKey = nameToCamelCase(genericFeature.name);

		// Check if there's a specialized version
		if (mappings[camelKey]) {
			const specializedUuid = mappings[camelKey];

			// Extract the name from the UUID (format: "Compendium.pf2e.classfeatures.Item.Name Here")
			const nameParts = specializedUuid.split('.');
			const specializedName = nameParts[nameParts.length - 1];

			return {
				...genericFeature,
				name: specializedName,
				uuid: specializedUuid
			} as T;
		}
	}

	// No specialized version found, return original
	return genericFeature;
}
