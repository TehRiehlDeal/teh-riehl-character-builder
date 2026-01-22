/**
 * Equipment Repository
 *
 * Provides data access methods for equipment using SQLite.
 * Maintains the same public API as the previous JSON-based implementation.
 */

import type { Equipment, Weapon, Armor } from '../types/app';
import { DatabaseManager, QueryBuilder, QueryCache, CacheKeys } from '../database';

/**
 * Get all equipment
 */
export async function getAllEquipment(): Promise<Equipment[]> {
	return QueryCache.getOrFetch(CacheKeys.all('equipment'), () =>
		QueryBuilder.getAll<Equipment>('equipment')
	);
}

/**
 * Get equipment by ID
 */
export async function getEquipmentById(id: string): Promise<Equipment | null> {
	return QueryCache.getOrFetch(CacheKeys.byId(id), () => QueryBuilder.getById<Equipment>(id));
}

/**
 * Get all weapons
 */
export async function getWeapons(): Promise<Weapon[]> {
	return QueryCache.getOrFetch(CacheKeys.byCategory('equipment', 'weapon'), async () => {
		return QueryBuilder.filter<Weapon>({
			type: 'equipment',
			equipmentType: 'weapon'
		});
	});
}

/**
 * Get all armor
 */
export async function getArmor(): Promise<Armor[]> {
	return QueryCache.getOrFetch(CacheKeys.byCategory('equipment', 'armor'), async () => {
		return QueryBuilder.filter<Armor>({
			type: 'equipment',
			equipmentType: 'armor'
		});
	});
}

/**
 * Get equipment by type
 */
export async function getEquipmentByType(
	equipmentType: 'weapon' | 'armor' | 'shield' | 'consumable' | 'adventuring-gear' | 'other'
): Promise<Equipment[]> {
	return QueryCache.getOrFetch(CacheKeys.byCategory('equipment', equipmentType), async () => {
		return QueryBuilder.filter<Equipment>({
			type: 'equipment',
			equipmentType
		});
	});
}

/**
 * Get weapons by category (simple, martial, advanced, unarmed)
 */
export async function getWeaponsByCategory(
	category: 'simple' | 'martial' | 'advanced' | 'unarmed'
): Promise<Weapon[]> {
	return QueryBuilder.filter<Weapon>({
		type: 'equipment',
		equipmentType: 'weapon',
		category
	});
}

/**
 * Get armor by category (unarmored, light, medium, heavy)
 */
export async function getArmorByCategory(
	category: 'unarmored' | 'light' | 'medium' | 'heavy'
): Promise<Armor[]> {
	return QueryBuilder.filter<Armor>({
		type: 'equipment',
		equipmentType: 'armor',
		category
	});
}

/**
 * Get equipment by level
 */
export async function getEquipmentByLevel(level: number): Promise<Equipment[]> {
	return QueryCache.getOrFetch(CacheKeys.byLevel('equipment', level), () =>
		QueryBuilder.getByLevel<Equipment>('equipment', level)
	);
}

/**
 * Get equipment by trait
 */
export async function getEquipmentByTrait(trait: string): Promise<Equipment[]> {
	return QueryCache.getOrFetch(CacheKeys.byTrait('equipment', trait), () =>
		QueryBuilder.getByTrait<Equipment>('equipment', trait)
	);
}

/**
 * Search equipment by name
 */
export async function searchEquipment(query: string): Promise<Equipment[]> {
	if (!query || query.trim() === '') return [];
	return QueryBuilder.searchByName<Equipment>('equipment', query);
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
	// Use SQL filters for basic criteria
	let equipment = await QueryBuilder.filter<Equipment>({
		type: 'equipment',
		equipmentType: filters.equipmentType,
		level: filters.level,
		minLevel: filters.minLevel,
		maxLevel: filters.maxLevel,
		trait: filters.trait,
		rarity: filters.rarity
	});

	// Apply in-memory filters for weapon/armor category (stored in JSON)
	if (filters.weaponCategory) {
		equipment = equipment.filter(
			(item) =>
				item.equipmentType === 'weapon' && (item as Weapon).category === filters.weaponCategory
		);
	}

	if (filters.armorCategory) {
		equipment = equipment.filter(
			(item) =>
				item.equipmentType === 'armor' && (item as Armor).category === filters.armorCategory
		);
	}

	return equipment;
}

/**
 * Clear the equipment cache
 */
export function clearEquipmentCache(): void {
	QueryCache.invalidatePrefix('all:equipment');
	QueryCache.invalidatePrefix('cat:equipment');
	QueryCache.invalidatePrefix('level:equipment');
	QueryCache.invalidatePrefix('trait:equipment');
}
