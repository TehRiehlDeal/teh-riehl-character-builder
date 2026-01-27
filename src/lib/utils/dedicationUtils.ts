/**
 * Dedication Utilities
 *
 * Utilities for handling dedication feats and their granted class features.
 * Dedication feats (especially multiclass dedications) often grant class features
 * that have their own ChoiceSet rules (e.g., Cleric Dedication grants Deity selection).
 */

import type { Feat, ClassFeature } from '$lib/data/types/app';
import { getFeatById } from '$lib/data/repositories/featRepository';

/**
 * Granted feature information extracted from a feat's GrantItem rules
 */
export interface GrantedFeature {
	uuid: string; // Compendium UUID
	name: string; // Extracted name
	id: string; // Extracted ID
}

/**
 * Extract granted class features from a feat's rules
 */
export function extractGrantedFeatures(feat: Feat): GrantedFeature[] {
	const grantedFeatures: GrantedFeature[] = [];

	if (!feat.rules || feat.rules.length === 0) {
		return grantedFeatures;
	}

	for (const rule of feat.rules) {
		// Look for GrantItem rules that grant class features
		if (rule.key === 'GrantItem' && rule.uuid && typeof rule.uuid === 'string') {
			// Skip template references (e.g., {item|flags.pf2e.rulesSelections.deity})
			if (rule.uuid.includes('{item|flags')) {
				continue;
			}

			// Check if this grants a class feature
			// Class features are typically in Compendium.pf2e.classfeatures.Item.*
			if (rule.uuid.includes('classfeatures')) {
				const parts = rule.uuid.split('.');
				const id = parts[parts.length - 1];
				const name = id.replace(/[_-]/g, ' ');

				grantedFeatures.push({
					uuid: rule.uuid,
					name,
					id
				});
			}
		}
	}

	return grantedFeatures;
}

/**
 * Check if a feat is a dedication feat
 */
export function isDedicationFeat(feat: Feat): boolean {
	return feat.traits?.includes('dedication') ?? false;
}

/**
 * Check if a feat is a multiclass dedication
 */
export function isMulticlassDedication(feat: Feat): boolean {
	return (
		feat.traits?.includes('dedication') &&
		feat.traits?.includes('multiclass')
	) ?? false;
}

/**
 * Extract the class name from a multiclass dedication feat
 * E.g., "Wizard Dedication" -> "Wizard"
 */
export function extractDedicationClassName(feat: Feat): string | null {
	if (!isMulticlassDedication(feat)) {
		return null;
	}

	// Remove "Dedication" from the name
	const name = feat.name.replace(/\s+Dedication$/i, '').trim();
	return name || null;
}

/**
 * Parse a Compendium UUID to extract the ID
 * E.g., "Compendium.pf2e.classfeatures.Item.DutW12WMFPHBoLTH" -> "DutW12WMFPHBoLTH"
 */
export function parseCompendiumUUID(uuid: string): string | null {
	const parts = uuid.split('.');
	return parts.length > 0 ? parts[parts.length - 1] : null;
}

/**
 * Check if a feat grants any class features with choices
 */
export async function hasGrantedFeatureChoices(feat: Feat): Promise<boolean> {
	const grantedFeatures = extractGrantedFeatures(feat);

	if (grantedFeatures.length === 0) {
		return false;
	}

	// Check if any granted features have ChoiceSet rules
	for (const feature of grantedFeatures) {
		const featureId = parseCompendiumUUID(feature.uuid);
		if (!featureId) continue;

		// Load the feature to check its rules
		const loadedFeature = await getFeatById(featureId);
		if (!loadedFeature) continue;

		// Check if it has ChoiceSet rules
		if (loadedFeature.rules && Array.isArray(loadedFeature.rules)) {
			const hasChoices = loadedFeature.rules.some((rule: any) => rule.key === 'ChoiceSet');
			if (hasChoices) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Extract choice information from a dedication feat and its granted features
 */
export interface DedicationChoice {
	flag: string;
	prompt: string;
	itemType?: string;
	filter?: any[];
	choices?: Array<{ label: string; value: string; predicate?: any }>;
	isDirect?: boolean; // True if the choice is directly in the feat (e.g., Oracle), false if in a granted feature (e.g., Cleric)
	sourceFeatureId?: string; // ID of the granted feature (if isDirect is false)
}

export async function extractDedicationChoices(feat: Feat): Promise<DedicationChoice[]> {
	const result: DedicationChoice[] = [];

	// First, check for direct ChoiceSet rules in the feat itself (e.g., Oracle Dedication)
	if (feat.rules && Array.isArray(feat.rules)) {
		for (const rule of feat.rules) {
			if (rule.key === 'ChoiceSet') {
				const choice: DedicationChoice = {
					flag: rule.flag || 'unknown',
					prompt: rule.prompt || 'Make a choice',
					isDirect: true
				};

				// Handle itemType-based choices
				if (rule.choices?.itemType) {
					choice.itemType = rule.choices.itemType;
					choice.filter = rule.choices.filter || [];
				}
				// Handle filter-based choices (Oracle mystery uses just filter without itemType)
				else if (rule.choices?.filter) {
					choice.filter = rule.choices.filter;
				}
				// Handle array-based choices
				else if (Array.isArray(rule.choices)) {
					choice.choices = rule.choices.map((c: any) => ({
						label: c.label || c.value,
						value: c.value,
						predicate: c.predicate
					}));
				}

				result.push(choice);
			}
		}
	}

	// Then, check granted features for ChoiceSet rules (e.g., Cleric Dedication)
	const grantedFeatures = extractGrantedFeatures(feat);

	for (const feature of grantedFeatures) {
		const featureId = parseCompendiumUUID(feature.uuid);
		if (!featureId) continue;

		const loadedFeature = await getFeatById(featureId);
		if (!loadedFeature || !loadedFeature.rules) continue;

		for (const rule of loadedFeature.rules) {
			if (rule.key === 'ChoiceSet') {
				const choice: DedicationChoice = {
					flag: rule.flag || 'unknown',
					prompt: rule.prompt || 'Make a choice',
					isDirect: false,
					sourceFeatureId: featureId
				};

				// Handle itemType-based choices
				if (rule.choices?.itemType) {
					choice.itemType = rule.choices.itemType;
					choice.filter = rule.choices.filter || [];
				}
				// Handle filter-based choices
				else if (rule.choices?.filter) {
					choice.filter = rule.choices.filter;
				}
				// Handle array-based choices
				else if (Array.isArray(rule.choices)) {
					choice.choices = rule.choices.map((c: any) => ({
						label: c.label || c.value,
						value: c.value,
						predicate: c.predicate
					}));
				}

				result.push(choice);
			}
		}
	}

	return result;
}
