/**
 * Effect Repository
 *
 * Provides data access methods for effects using SQLite.
 * Maintains the same public API as the previous JSON-based implementation.
 */

import type { Effect } from '../types/app';
import { DatabaseManager, QueryBuilder, QueryCache, CacheKeys } from '../database';

/**
 * Get all effects
 */
export async function getAllEffects(): Promise<Effect[]> {
	return QueryCache.getOrFetch(CacheKeys.all('effect'), () =>
		QueryBuilder.getAll<Effect>('effect')
	);
}

/**
 * Get effect by ID
 */
export async function getEffectById(id: string): Promise<Effect | null> {
	return QueryCache.getOrFetch(CacheKeys.byId(id), () => QueryBuilder.getById<Effect>(id));
}

/**
 * Search effects by name
 */
export async function searchEffects(query: string): Promise<Effect[]> {
	if (!query || query.trim() === '') return [];
	return QueryBuilder.searchByName<Effect>('effect', query);
}

/**
 * Get effects by level
 */
export async function getEffectsByLevel(level: number): Promise<Effect[]> {
	return QueryCache.getOrFetch(CacheKeys.byLevel('effect', level), () =>
		QueryBuilder.getByLevel<Effect>('effect', level)
	);
}

/**
 * Get sustained effects (requires actions to maintain)
 */
export async function getSustainedEffects(): Promise<Effect[]> {
	const effects = await getAllEffects();
	return effects.filter((effect) => effect.duration.sustained === true);
}

/**
 * Clear the effect cache
 */
export function clearEffectCache(): void {
	QueryCache.invalidatePrefix('all:effect');
	QueryCache.invalidatePrefix('level:effect');
}
