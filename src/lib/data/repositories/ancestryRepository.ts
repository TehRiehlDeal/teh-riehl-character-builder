/**
 * Ancestry Repository
 *
 * Provides data access methods for ancestries using SQLite.
 * Maintains the same public API as the previous JSON-based implementation.
 */

import type { Ancestry } from '../types/app';
import { DatabaseManager, QueryBuilder, QueryCache, CacheKeys } from '../database';

/**
 * Get all ancestries
 */
export async function getAllAncestries(): Promise<Ancestry[]> {
	return QueryCache.getOrFetch(CacheKeys.all('ancestry'), () =>
		QueryBuilder.getAll<Ancestry>('ancestry')
	);
}

/**
 * Get an ancestry by ID
 */
export async function getAncestryById(id: string): Promise<Ancestry | null> {
	return QueryCache.getOrFetch(CacheKeys.byId(id), () => QueryBuilder.getById<Ancestry>(id));
}

/**
 * Get an ancestry by name (case-insensitive)
 */
export async function getAncestryByName(name: string): Promise<Ancestry | null> {
	const ancestries = await getAllAncestries();
	const lowerName = name.toLowerCase();
	return ancestries.find((ancestry) => ancestry.name.toLowerCase() === lowerName) ?? null;
}

/**
 * Get ancestries by trait
 */
export async function getAncestriesByTrait(trait: string): Promise<Ancestry[]> {
	return QueryCache.getOrFetch(CacheKeys.byTrait('ancestry', trait), () =>
		QueryBuilder.getByTrait<Ancestry>('ancestry', trait)
	);
}

/**
 * Search ancestries by name (case-insensitive)
 */
export async function searchAncestries(query: string): Promise<Ancestry[]> {
	if (!query || query.trim() === '') return [];
	return QueryBuilder.searchByName<Ancestry>('ancestry', query);
}

/**
 * Get ancestries matching multiple criteria
 */
export async function getAncestries(criteria: {
	minSpeed?: number;
	maxSpeed?: number;
	size?: Ancestry['size'];
	vision?: Ancestry['vision'];
	trait?: string;
}): Promise<Ancestry[]> {
	// Start with trait filter if specified, otherwise get all
	let ancestries: Ancestry[];
	if (criteria.trait) {
		ancestries = await getAncestriesByTrait(criteria.trait);
	} else {
		ancestries = await getAllAncestries();
	}

	// Apply in-memory filters for properties stored in JSON
	if (criteria.minSpeed !== undefined) {
		ancestries = ancestries.filter((ancestry) => ancestry.speed >= criteria.minSpeed!);
	}

	if (criteria.maxSpeed !== undefined) {
		ancestries = ancestries.filter((ancestry) => ancestry.speed <= criteria.maxSpeed!);
	}

	if (criteria.size) {
		ancestries = ancestries.filter((ancestry) => ancestry.size === criteria.size);
	}

	if (criteria.vision) {
		ancestries = ancestries.filter((ancestry) => ancestry.vision === criteria.vision);
	}

	return ancestries;
}

/**
 * Get ancestries with darkvision
 */
export async function getAncestriesWithDarkvision(): Promise<Ancestry[]> {
	const ancestries = await getAllAncestries();
	return ancestries.filter((ancestry) => ancestry.vision === 'darkvision');
}

/**
 * Get ancestries with low-light vision
 */
export async function getAncestriesWithLowLightVision(): Promise<Ancestry[]> {
	const ancestries = await getAllAncestries();
	return ancestries.filter((ancestry) => ancestry.vision === 'low-light-vision');
}

/**
 * Get ancestries by size
 */
export async function getAncestriesBySize(
	size: 'tiny' | 'sm' | 'med' | 'lg' | 'huge' | 'grg'
): Promise<Ancestry[]> {
	const ancestries = await getAllAncestries();
	return ancestries.filter((ancestry) => ancestry.size === size);
}

/**
 * Clear the ancestries cache (useful for testing or data updates)
 */
export function clearAncestriesCache(): void {
	QueryCache.invalidatePrefix('all:ancestry');
	QueryCache.invalidatePrefix('trait:ancestry');
}
