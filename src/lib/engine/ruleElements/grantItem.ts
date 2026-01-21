/**
 * GrantItem Rule Element
 *
 * Grants items (feats, features, spells, etc.) to the character.
 * This is commonly used by class features to automatically grant abilities.
 *
 * Example: A class feature might grant a specific feat automatically
 */

import type { RuleElementContext } from './flatModifier';

/**
 * GrantItem data from Foundry VTT
 */
export interface GrantItemRuleElement {
	key: 'GrantItem';
	/** UUID of the item to grant (e.g., "Compendium.pf2e.feats.Item.Shield Block") */
	uuid?: string;
	/** Alternative: provide item data directly */
	item?: {
		type: string;
		name: string;
		[key: string]: unknown;
	};
	/** Whether the granted item is automatically applied (vs. requiring user action) */
	allowDuplicate?: boolean;
	/** Predicate for when this grant applies */
	predicate?: string[];
	/** Level at which this grant becomes active */
	level?: number;
}

/**
 * Granted item representation
 */
export interface GrantedItem {
	/** Source that granted this item */
	source: string;
	/** UUID reference to the granted item */
	uuid?: string;
	/** Direct item data (if not using UUID) */
	itemData?: {
		type: string;
		name: string;
		[key: string]: unknown;
	};
	/** Whether duplicates are allowed */
	allowDuplicate: boolean;
	/** Predicate conditions */
	predicate?: string[];
	/** Level requirement */
	level?: number;
	/** Whether this grant is currently active */
	enabled: boolean;
}

/**
 * Process a GrantItem rule element
 */
export function processGrantItem(
	ruleElement: GrantItemRuleElement,
	context: RuleElementContext
): GrantedItem | null {
	// Must have either uuid or item data
	if (!ruleElement.uuid && !ruleElement.item) {
		console.warn('GrantItem rule element missing uuid and item data');
		return null;
	}

	// Check level requirement
	if (ruleElement.level !== undefined && context.level < ruleElement.level) {
		return null; // Not yet at required level
	}

	return {
		source: context.source,
		uuid: ruleElement.uuid,
		itemData: ruleElement.item,
		allowDuplicate: ruleElement.allowDuplicate ?? false,
		predicate: ruleElement.predicate,
		level: ruleElement.level,
		enabled: true
	};
}

/**
 * Check if a granted item should apply based on predicates
 */
export function shouldApplyGrantedItem(
	grantedItem: GrantedItem,
	activeConditions: Set<string>
): boolean {
	if (!grantedItem.enabled) {
		return false;
	}

	if (!grantedItem.predicate || grantedItem.predicate.length === 0) {
		return true;
	}

	return grantedItem.predicate.every((condition) => activeConditions.has(condition));
}

/**
 * Get all active granted items
 */
export function getActiveGrantedItems(
	grantedItems: GrantedItem[],
	activeConditions: Set<string>
): GrantedItem[] {
	return grantedItems.filter((item) => shouldApplyGrantedItem(item, activeConditions));
}

/**
 * Check if an item is already granted (for duplicate prevention)
 */
export function isItemAlreadyGranted(
	grantedItems: GrantedItem[],
	uuid: string | undefined
): boolean {
	if (!uuid) {
		return false;
	}

	return grantedItems.some((item) => item.uuid === uuid && !item.allowDuplicate);
}

/**
 * Resolve a granted item UUID to actual item data
 *
 * This is a placeholder for future implementation.
 * In a full implementation, this would load the item from the data repository.
 */
export async function resolveGrantedItem(uuid: string): Promise<unknown | null> {
	// TODO: Implement actual item resolution from repositories
	// This would look up feats, features, spells, etc. by their UUID
	console.warn('resolveGrantedItem not yet implemented:', uuid);
	return null;
}
