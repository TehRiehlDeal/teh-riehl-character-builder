/**
 * Equipment Repository
 *
 * Provides data access methods for equipment (weapons, armor, and other items).
 * Uses lazy loading to avoid loading all equipment into memory at once.
 */

import type { Equipment, Weapon, Armor } from '../types/app';
import type { FoundryWeapon, FoundryArmor, FoundryEquipment } from '../types/foundry';
import { adaptWeapon, adaptArmor, adaptEquipment } from '../adapters/equipmentAdapter';
import { loadAllData, loadDataById, loadDataByFilter } from '../dataLoader';

/**
 * In-memory cache of loaded equipment
 */
let equipmentCache: Equipment[] | null = null;

/**
 * Load all equipment from raw data files
 */
async function loadEquipment(): Promise<Equipment[]> {
	if (equipmentCache !== null) {
		return equipmentCache;
	}

	try {
		// Load all equipment data from manifest
		const foundryEquipment = await loadAllData<
			FoundryWeapon | FoundryArmor | FoundryEquipment
		>('equipment');

		// Adapt based on type
		const equipment = foundryEquipment.map((item) => {
			if (item.type === 'weapon') {
				return adaptWeapon(item as FoundryWeapon);
			} else if (item.type === 'armor') {
				return adaptArmor(item as FoundryArmor);
			} else {
				return adaptEquipment(item as FoundryEquipment);
			}
		});

		equipmentCache = equipment;
		return equipment;
	} catch (error) {
		console.error('Failed to load equipment:', error);
		return [];
	}
}

/**
 * Get all equipment
 */
export async function getAllEquipment(): Promise<Equipment[]> {
	return loadEquipment();
}

/**
 * Get equipment by ID
 *
 * This method loads only the specific equipment file, not all equipment
 */
export async function getEquipmentById(id: string): Promise<Equipment | null> {
	try {
		const foundryItem = await loadDataById<FoundryWeapon | FoundryArmor | FoundryEquipment>(
			'equipment',
			id
		);
		if (!foundryItem) {
			return null;
		}

		// Adapt based on type
		if (foundryItem.type === 'weapon') {
			return adaptWeapon(foundryItem as FoundryWeapon);
		} else if (foundryItem.type === 'armor') {
			return adaptArmor(foundryItem as FoundryArmor);
		} else {
			return adaptEquipment(foundryItem as FoundryEquipment);
		}
	} catch (error) {
		console.error(`Failed to load equipment ${id}:`, error);
		return null;
	}
}

/**
 * Get all weapons
 */
export async function getWeapons(): Promise<Weapon[]> {
	const equipment = await loadEquipment();
	return equipment.filter((item) => item.equipmentType === 'weapon') as Weapon[];
}

/**
 * Get all armor
 */
export async function getArmor(): Promise<Armor[]> {
	const equipment = await loadEquipment();
	return equipment.filter((item) => item.equipmentType === 'armor') as Armor[];
}

/**
 * Get equipment by type
 */
export async function getEquipmentByType(
	equipmentType: 'weapon' | 'armor' | 'shield' | 'consumable' | 'adventuring-gear' | 'other'
): Promise<Equipment[]> {
	const equipment = await loadEquipment();
	return equipment.filter((item) => item.equipmentType === equipmentType);
}

/**
 * Get weapons by category (simple, martial, advanced, unarmed)
 */
export async function getWeaponsByCategory(
	category: 'simple' | 'martial' | 'advanced' | 'unarmed'
): Promise<Weapon[]> {
	const weapons = await getWeapons();
	return weapons.filter((weapon) => weapon.category === category);
}

/**
 * Get armor by category (unarmored, light, medium, heavy)
 */
export async function getArmorByCategory(
	category: 'unarmored' | 'light' | 'medium' | 'heavy'
): Promise<Armor[]> {
	const armor = await getArmor();
	return armor.filter((a) => a.category === category);
}

/**
 * Get equipment by level
 */
export async function getEquipmentByLevel(level: number): Promise<Equipment[]> {
	const equipment = await loadEquipment();
	return equipment.filter((item) => item.level === level);
}

/**
 * Get equipment by trait
 */
export async function getEquipmentByTrait(trait: string): Promise<Equipment[]> {
	const equipment = await loadEquipment();
	return equipment.filter((item) => item.traits.includes(trait));
}

/**
 * Search equipment by name
 */
export async function searchEquipment(query: string): Promise<Equipment[]> {
	const equipment = await loadEquipment();
	const lowerQuery = query.toLowerCase();

	return equipment.filter((item) => item.name.toLowerCase().includes(lowerQuery));
}

/**
 * Filter equipment by multiple criteria
 */
export async function filterEquipment(filters: {
	equipmentType?: 'weapon' | 'armor' | 'shield' | 'consumable' | 'adventuring-gear' | 'other';
	level?: number;
	minLevel?: number;
	maxLevel?: number;
	trait?: string;
	rarity?: 'common' | 'uncommon' | 'rare' | 'unique';
	weaponCategory?: 'simple' | 'martial' | 'advanced' | 'unarmed';
	armorCategory?: 'unarmored' | 'light' | 'medium' | 'heavy';
}): Promise<Equipment[]> {
	let equipment = await loadEquipment();

	if (filters.equipmentType) {
		equipment = equipment.filter((item) => item.equipmentType === filters.equipmentType);
	}

	if (filters.level !== undefined) {
		equipment = equipment.filter((item) => item.level === filters.level);
	}

	if (filters.minLevel !== undefined) {
		equipment = equipment.filter((item) => item.level >= filters.minLevel!);
	}

	if (filters.maxLevel !== undefined) {
		equipment = equipment.filter((item) => item.level <= filters.maxLevel!);
	}

	if (filters.trait) {
		equipment = equipment.filter((item) => item.traits.includes(filters.trait!));
	}

	if (filters.rarity) {
		equipment = equipment.filter((item) => item.rarity === filters.rarity);
	}

	if (filters.weaponCategory) {
		equipment = equipment.filter(
			(item) => item.equipmentType === 'weapon' && (item as Weapon).category === filters.weaponCategory
		);
	}

	if (filters.armorCategory) {
		equipment = equipment.filter(
			(item) => item.equipmentType === 'armor' && (item as Armor).category === filters.armorCategory
		);
	}

	return equipment;
}

/**
 * Clear the equipment cache
 *
 * Useful for testing or when data is updated
 */
export function clearEquipmentCache(): void {
	equipmentCache = null;
}
