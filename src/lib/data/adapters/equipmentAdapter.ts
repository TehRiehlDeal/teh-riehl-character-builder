/**
 * Equipment Adapter
 *
 * Transforms Foundry VTT PF2e equipment data into our application schema.
 *
 * Transformation Notes (Apache 2.0 requirement):
 * - Foundry's `_id` is mapped to our `id`
 * - `system.description.value` is mapped to `description`
 * - Price is converted from object format { gp: 10, sp: 5 } to copper pieces
 * - Bulk is extracted and formatted as display string
 * - Weapon and armor types have specialized adapters
 * - `system.rules[]` is passed through as-is (already matches our RuleElement types)
 * - Foundry-specific fields like `folder`, `img` are excluded
 */

import type { FoundryWeapon, FoundryArmor, FoundryEquipment } from '../types/foundry';
import type { Equipment, Weapon, Armor } from '../types/app';

/**
 * Transform a Foundry weapon into our app schema
 */
export function adaptWeapon(foundryWeapon: FoundryWeapon): Weapon {
	return {
		type: 'equipment',
		equipmentType: 'weapon',
		id: foundryWeapon._id,
		name: foundryWeapon.name,
		description: foundryWeapon.system.description.value,
		level: foundryWeapon.system.level.value,
		category: foundryWeapon.system.category,
		group: foundryWeapon.system.group,
		damage: {
			dice: foundryWeapon.system.damage.dice,
			die: foundryWeapon.system.damage.die,
			damageType: foundryWeapon.system.damage.damageType
		},
		range: foundryWeapon.system.range ?? undefined,
		reload: foundryWeapon.system.reload.value ?? undefined,
		price: convertPrice(foundryWeapon.system.price.value),
		bulk: convertBulk(foundryWeapon.system.bulk.value),
		hands: extractHands(foundryWeapon.system.usage.value),
		usage: foundryWeapon.system.usage.value,
		traits: foundryWeapon.system.traits.value,
		weaponTraits: foundryWeapon.system.traits.value,
		rarity: foundryWeapon.system.traits.rarity,
		source: {
			title: foundryWeapon.system.publication.title,
			license: foundryWeapon.system.publication.license,
			remaster: foundryWeapon.system.publication.remaster
		},
		rules: foundryWeapon.system.rules
	};
}

/**
 * Transform a Foundry armor into our app schema
 */
export function adaptArmor(foundryArmor: FoundryArmor): Armor {
	return {
		type: 'equipment',
		equipmentType: 'armor',
		id: foundryArmor._id,
		name: foundryArmor.name,
		description: foundryArmor.system.description.value,
		level: foundryArmor.system.level.value,
		category: foundryArmor.system.category,
		group: foundryArmor.system.group,
		acBonus: foundryArmor.system.acBonus,
		dexCap: foundryArmor.system.dexCap,
		checkPenalty: foundryArmor.system.checkPenalty,
		speedPenalty: foundryArmor.system.speedPenalty,
		strength: foundryArmor.system.strength,
		price: convertPrice(foundryArmor.system.price.value),
		bulk: convertBulk(foundryArmor.system.bulk.value),
		traits: foundryArmor.system.traits.value,
		rarity: foundryArmor.system.traits.rarity,
		source: {
			title: foundryArmor.system.publication.title,
			license: foundryArmor.system.publication.license,
			remaster: foundryArmor.system.publication.remaster
		},
		rules: foundryArmor.system.rules
	};
}

/**
 * Transform a Foundry equipment item into our app schema
 */
export function adaptEquipment(foundryEquipment: FoundryEquipment): Equipment {
	const equipmentType = mapEquipmentType(foundryEquipment.type);

	return {
		type: 'equipment',
		equipmentType,
		id: foundryEquipment._id,
		name: foundryEquipment.name,
		description: foundryEquipment.system.description?.value || '',
		level: foundryEquipment.system.level?.value ?? 0,
		price: convertPrice(foundryEquipment.system.price?.value || {}),
		bulk: convertBulk(foundryEquipment.system.bulk?.value ?? 0),
		usage: foundryEquipment.system.usage?.value,
		traits: foundryEquipment.system.traits?.value || [],
		rarity: foundryEquipment.system.traits?.rarity || 'common',
		source: {
			title: foundryEquipment.system.publication?.title || 'Unknown',
			license: foundryEquipment.system.publication?.license || 'OGL',
			remaster: foundryEquipment.system.publication?.remaster || false
		},
		rules: foundryEquipment.system.rules || []
	};
}

/**
 * Convert Foundry price object to our price format
 *
 * Foundry uses { gp: 10, sp: 5, cp: 2 } format
 * We convert to total copper pieces and create display string
 */
function convertPrice(priceObj: Record<string, number>): {
	value: number;
	display: string;
} {
	let copperValue = 0;

	// Convert to copper pieces
	copperValue += (priceObj.pp || 0) * 1000; // Platinum
	copperValue += (priceObj.gp || 0) * 100; // Gold
	copperValue += (priceObj.sp || 0) * 10; // Silver
	copperValue += priceObj.cp || 0; // Copper

	// Create display string
	const display = formatPriceDisplay(priceObj);

	return {
		value: copperValue,
		display
	};
}

/**
 * Format price for display
 */
function formatPriceDisplay(priceObj: Record<string, number>): string {
	const parts: string[] = [];

	if (priceObj.pp) parts.push(`${priceObj.pp} pp`);
	if (priceObj.gp) parts.push(`${priceObj.gp} gp`);
	if (priceObj.sp) parts.push(`${priceObj.sp} sp`);
	if (priceObj.cp) parts.push(`${priceObj.cp} cp`);

	return parts.join(', ') || '0 cp';
}

/**
 * Convert bulk value to our format
 */
function convertBulk(bulkValue: number): {
	value: number;
	display: string;
} {
	let display: string;

	if (bulkValue === 0) {
		display = '—';
	} else if (bulkValue < 1) {
		display = 'L';
	} else {
		display = bulkValue.toString();
	}

	return {
		value: bulkValue,
		display
	};
}

/**
 * Extract number of hands from usage string
 */
function extractHands(usage: string): number {
	if (usage.includes('two-hand') || usage.includes('held-in-two-hands')) {
		return 2;
	}
	if (usage.includes('one-hand') || usage.includes('held-in-one-hand')) {
		return 1;
	}
	return 1; // Default to one hand
}

/**
 * Map Foundry equipment type to our equipment type
 */
function mapEquipmentType(
	foundryType: 'equipment' | 'consumable' | 'shield'
): 'consumable' | 'shield' | 'adventuring-gear' | 'other' {
	if (foundryType === 'consumable') return 'consumable';
	if (foundryType === 'shield') return 'shield';
	return 'adventuring-gear';
}

/**
 * Adapt multiple weapons at once
 */
export function adaptWeapons(foundryWeapons: FoundryWeapon[]): Weapon[] {
	return foundryWeapons.map(adaptWeapon);
}

/**
 * Adapt multiple armors at once
 */
export function adaptArmors(foundryArmors: FoundryArmor[]): Armor[] {
	return foundryArmors.map(adaptArmor);
}

/**
 * Adapt multiple equipment items at once
 */
export function adaptEquipments(foundryEquipments: FoundryEquipment[]): Equipment[] {
	return foundryEquipments.map(adaptEquipment);
}
