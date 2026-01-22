/**
 * Spell Repository
 *
 * Provides data access methods for spells using SQLite.
 * Maintains the same public API as the previous JSON-based implementation.
 */

import type { Spell } from '../types/app';
import { DatabaseManager, QueryBuilder, QueryCache, CacheKeys } from '../database';

/**
 * Get all spells
 */
export async function getAllSpells(): Promise<Spell[]> {
	return QueryCache.getOrFetch(CacheKeys.all('spell'), () => QueryBuilder.getAll<Spell>('spell'));
}

/**
 * Get a spell by ID
 */
export async function getSpellById(id: string): Promise<Spell | null> {
	return QueryCache.getOrFetch(CacheKeys.byId(id), () => QueryBuilder.getById<Spell>(id));
}

/**
 * Get spells by level
 */
export async function getSpellsByLevel(level: number): Promise<Spell[]> {
	return QueryCache.getOrFetch(CacheKeys.byLevel('spell', level), () =>
		QueryBuilder.getByLevel<Spell>('spell', level)
	);
}

/**
 * Get spells by tradition (arcane, divine, primal, occult)
 */
export async function getSpellsByTradition(tradition: string): Promise<Spell[]> {
	return QueryCache.getOrFetch(CacheKeys.byTradition(tradition), async () => {
		return QueryBuilder.filter<Spell>({
			type: 'spell',
			tradition
		});
	});
}

/**
 * Get spells by type (standard, focus, ritual)
 */
export async function getSpellsByType(
	spellType: 'standard' | 'focus' | 'ritual'
): Promise<Spell[]> {
	// spellType is stored in the JSON data, so we need to filter in memory
	const spells = await getAllSpells();
	return spells.filter((spell) => spell.spellType === spellType);
}

/**
 * Get spells by trait
 */
export async function getSpellsByTrait(trait: string): Promise<Spell[]> {
	return QueryCache.getOrFetch(CacheKeys.byTrait('spell', trait), () =>
		QueryBuilder.getByTrait<Spell>('spell', trait)
	);
}

/**
 * Search spells by name
 */
export async function searchSpells(query: string): Promise<Spell[]> {
	if (!query || query.trim() === '') return [];
	return QueryBuilder.searchByName<Spell>('spell', query);
}

/**
 * Get cantrips
 */
export async function getCantrips(): Promise<Spell[]> {
	return getSpellsByLevel(0);
}

/**
 * Filter spells by multiple criteria
 */
export async function filterSpells(filters: {
	level?: number;
	tradition?: string;
	spellType?: 'standard' | 'focus' | 'ritual';
	trait?: string;
	minLevel?: number;
	maxLevel?: number;
}): Promise<Spell[]> {
	// Use SQL filters for supported criteria
	let spells = await QueryBuilder.filter<Spell>({
		type: 'spell',
		level: filters.level,
		tradition: filters.tradition,
		trait: filters.trait,
		minLevel: filters.minLevel,
		maxLevel: filters.maxLevel
	});

	// Apply in-memory filter for spellType (stored in JSON)
	if (filters.spellType) {
		spells = spells.filter((spell) => spell.spellType === filters.spellType);
	}

	return spells;
}

/**
 * Clear the spell cache
 */
export function clearSpellCache(): void {
	QueryCache.invalidatePrefix('all:spell');
	QueryCache.invalidatePrefix('level:spell');
	QueryCache.invalidatePrefix('tradition:');
	QueryCache.invalidatePrefix('trait:spell');
}
