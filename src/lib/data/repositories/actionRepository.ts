/**
 * Action Repository
 *
 * Provides data access methods for actions using SQLite.
 * Maintains the same public API as the previous JSON-based implementation.
 */

import type { Action } from '../types/app';
import { DatabaseManager, QueryBuilder, QueryCache, CacheKeys } from '../database';

/**
 * Get all actions
 */
export async function getAllActions(): Promise<Action[]> {
	return QueryCache.getOrFetch(CacheKeys.all('action'), () =>
		QueryBuilder.getAll<Action>('action')
	);
}

/**
 * Get action by ID
 */
export async function getActionById(id: string): Promise<Action | null> {
	return QueryCache.getOrFetch(CacheKeys.byId(id), () => QueryBuilder.getById<Action>(id));
}

/**
 * Get actions by action type
 */
export async function getActionsByType(
	actionType: 'action' | 'reaction' | 'free' | 'passive'
): Promise<Action[]> {
	// actionType is stored in the JSON data
	const actions = await getAllActions();
	return actions.filter((action) => action.actionType === actionType);
}

/**
 * Search actions by name
 */
export async function searchActions(query: string): Promise<Action[]> {
	if (!query || query.trim() === '') return [];
	return QueryBuilder.searchByName<Action>('action', query);
}

/**
 * Get actions by trait
 */
export async function getActionsByTrait(trait: string): Promise<Action[]> {
	return QueryCache.getOrFetch(CacheKeys.byTrait('action', trait), () =>
		QueryBuilder.getByTrait<Action>('action', trait)
	);
}

/**
 * Clear the action cache
 */
export function clearActionCache(): void {
	QueryCache.invalidatePrefix('all:action');
	QueryCache.invalidatePrefix('trait:action');
}
