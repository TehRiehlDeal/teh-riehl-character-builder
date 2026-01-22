/**
 * Condition Repository
 *
 * Provides data access methods for conditions using SQLite.
 * Maintains the same public API as the previous JSON-based implementation.
 */

import type { Condition } from '../types/app';
import { DatabaseManager, QueryBuilder, QueryCache, CacheKeys } from '../database';

/**
 * Get all conditions
 */
export async function getAllConditions(): Promise<Condition[]> {
	return QueryCache.getOrFetch(CacheKeys.all('condition'), () =>
		QueryBuilder.getAll<Condition>('condition')
	);
}

/**
 * Get condition by ID
 */
export async function getConditionById(id: string): Promise<Condition | null> {
	return QueryCache.getOrFetch(CacheKeys.byId(id), () => QueryBuilder.getById<Condition>(id));
}

/**
 * Get valued conditions (conditions with numeric values like Frightened, Drained, etc.)
 */
export async function getValuedConditions(): Promise<Condition[]> {
	const conditions = await getAllConditions();
	return conditions.filter((condition) => condition.value?.isValued === true);
}

/**
 * Search conditions by name
 */
export async function searchConditions(query: string): Promise<Condition[]> {
	if (!query || query.trim() === '') return [];
	return QueryBuilder.searchByName<Condition>('condition', query);
}

/**
 * Get conditions by trait
 */
export async function getConditionsByTrait(trait: string): Promise<Condition[]> {
	return QueryCache.getOrFetch(CacheKeys.byTrait('condition', trait), () =>
		QueryBuilder.getByTrait<Condition>('condition', trait)
	);
}

/**
 * Clear the condition cache
 */
export function clearConditionCache(): void {
	QueryCache.invalidatePrefix('all:condition');
	QueryCache.invalidatePrefix('trait:condition');
}
