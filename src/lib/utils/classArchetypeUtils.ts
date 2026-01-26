/**
 * Utilities for handling class archetype features
 */

import type { ClassArchetype } from '$lib/data/types/app';

export interface GrantedItem {
	uuid: string;
	level: number; // Level at which this is granted (1 = immediate)
	flag?: string;
	isDynamic: boolean; // True if UUID contains template variables
}

/**
 * Extract items granted by a class archetype
 * Parses GrantItem rules to determine what features/feats are auto-granted
 */
export function extractGrantedItems(archetype: ClassArchetype): GrantedItem[] {
	const grantedItems: GrantedItem[] = [];

	for (const rule of archetype.rules) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ruleAny = rule as any;

		if (ruleAny.key === 'GrantItem' && ruleAny.uuid) {
			// Check if UUID contains template variables (dynamic grants)
			const isDynamic = ruleAny.uuid.includes('{') || ruleAny.uuid.includes('|');

			// Determine level from predicate
			let level = 1; // Default to immediate grant
			if (ruleAny.predicate && Array.isArray(ruleAny.predicate)) {
				for (const pred of ruleAny.predicate) {
					if (pred.gte && Array.isArray(pred.gte) && pred.gte[0] === 'self:level') {
						level = pred.gte[1];
						break;
					}
				}
			}

			grantedItems.push({
				uuid: ruleAny.uuid,
				level,
				flag: ruleAny.flag,
				isDynamic
			});
		}
	}

	return grantedItems;
}

/**
 * Extract the item name from a Compendium UUID
 * @example "Compendium.pf2e.classfeatures.Item.School of Thassilonian Rune Magic" -> "School of Thassilonian Rune Magic"
 */
export function extractItemNameFromUUID(uuid: string): string | null {
	if (!uuid.includes('Compendium.')) {
		return null;
	}

	const parts = uuid.split('.');
	// Format: Compendium.pf2e.collection.Item.Name Here
	if (parts.length >= 5) {
		return parts.slice(4).join('.');
	}

	return null;
}

/**
 * Check if a granted item is a dedication feat
 */
export function isDedicationFeat(grantedItem: GrantedItem): boolean {
	return grantedItem.uuid.includes('Dedication');
}

/**
 * Check if a granted item is a class feature
 */
export function isClassFeature(grantedItem: GrantedItem): boolean {
	return grantedItem.uuid.includes('classfeatures');
}

/**
 * Get all items granted at a specific level
 */
export function getGrantedItemsAtLevel(
	archetype: ClassArchetype,
	level: number
): GrantedItem[] {
	const allGranted = extractGrantedItems(archetype);
	return allGranted.filter((item) => item.level === level);
}

/**
 * Get dedication feat granted by archetype (usually at level 2)
 */
export function getDedicationFeat(archetype: ClassArchetype): GrantedItem | null {
	const granted = extractGrantedItems(archetype);
	const dedication = granted.find((item) => isDedicationFeat(item));
	return dedication || null;
}

/**
 * Get immediate class features granted by archetype (level 1)
 */
export function getImmediateClassFeatures(archetype: ClassArchetype): GrantedItem[] {
	const granted = extractGrantedItems(archetype);
	return granted.filter((item) => item.level === 1 && isClassFeature(item) && !item.isDynamic);
}
