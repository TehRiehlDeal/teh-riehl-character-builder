/**
 * Feat Repository
 *
 * Provides data access methods for feats using SQLite.
 * Maintains the same public API as the previous JSON-based implementation.
 */

import type { Feat } from '../types/app';
import { DatabaseManager, QueryBuilder, QueryCache, CacheKeys } from '../database';

/**
 * Get all feats
 */
export async function getAllFeats(): Promise<Feat[]> {
	return QueryCache.getOrFetch(CacheKeys.all('feat'), () => QueryBuilder.getAll<Feat>('feat'));
}

/**
 * Get a feat by ID
 */
export async function getFeatById(id: string): Promise<Feat | null> {
	return QueryCache.getOrFetch(CacheKeys.byId(id), () => QueryBuilder.getById<Feat>(id));
}

/**
 * Get feats by category
 */
export async function getFeatsByCategory(
	category: 'general' | 'skill' | 'class' | 'ancestry' | 'archetype'
): Promise<Feat[]> {
	return QueryCache.getOrFetch(CacheKeys.byCategory('feat', category), async () => {
		return QueryBuilder.filter<Feat>({
			type: 'feat',
			category
		});
	});
}

/**
 * Get feats by level
 */
export async function getFeatsByLevel(level: number): Promise<Feat[]> {
	return QueryCache.getOrFetch(CacheKeys.byLevel('feat', level), () =>
		QueryBuilder.getByLevel<Feat>('feat', level)
	);
}

/**
 * Get feats by trait
 */
export async function getFeatsByTrait(trait: string): Promise<Feat[]> {
	return QueryCache.getOrFetch(CacheKeys.byTrait('feat', trait), () =>
		QueryBuilder.getByTrait<Feat>('feat', trait)
	);
}

/**
 * Search feats by name (case-insensitive)
 */
export async function searchFeats(query: string): Promise<Feat[]> {
	if (!query || query.trim() === '') return [];
	return QueryBuilder.searchByName<Feat>('feat', query);
}

/**
 * Get feats matching multiple criteria
 */
export async function getFeats(criteria: {
	category?: Feat['category'];
	level?: number;
	trait?: string;
	hasPrerequisites?: boolean;
}): Promise<Feat[]> {
	// Build filter options
	const feats = await QueryBuilder.filter<Feat>({
		type: 'feat',
		category: criteria.category,
		level: criteria.level,
		trait: criteria.trait
	});

	// Filter by prerequisites if specified (requires in-memory filtering)
	if (criteria.hasPrerequisites !== undefined) {
		if (criteria.hasPrerequisites) {
			return feats.filter((feat) => feat.prerequisites.length > 0);
		} else {
			return feats.filter((feat) => feat.prerequisites.length === 0);
		}
	}

	return feats;
}

/**
 * Get feats available at a specific character level
 * (feats with level <= characterLevel)
 */
export async function getFeatsAvailableAtLevel(characterLevel: number): Promise<Feat[]> {
	return QueryBuilder.getAvailableAtLevel<Feat>('feat', characterLevel);
}

/**
 * Clear the feats cache (useful for testing or data updates)
 */
export function clearFeatsCache(): void {
	QueryCache.invalidatePrefix('all:feat');
	QueryCache.invalidatePrefix('id:');
	QueryCache.invalidatePrefix('level:feat');
	QueryCache.invalidatePrefix('cat:feat');
	QueryCache.invalidatePrefix('trait:feat');
}
