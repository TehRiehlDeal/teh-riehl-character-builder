/**
 * Heritage Repository
 *
 * Provides data access methods for heritages using SQLite.
 * Maintains the same public API as the previous JSON-based implementation.
 */

import type { Heritage } from '../types/app';
import { DatabaseManager, QueryBuilder, QueryCache, CacheKeys } from '../database';

/**
 * Get all heritages
 */
export async function getAllHeritages(): Promise<Heritage[]> {
	return QueryCache.getOrFetch(CacheKeys.all('heritage'), () =>
		QueryBuilder.getAll<Heritage>('heritage')
	);
}

/**
 * Get a heritage by ID
 */
export async function getHeritageById(id: string): Promise<Heritage | null> {
	return QueryCache.getOrFetch(CacheKeys.byId(id), () => QueryBuilder.getById<Heritage>(id));
}

/**
 * Get heritages by ancestry name (case-insensitive)
 */
export async function getHeritagesByAncestry(ancestryName: string): Promise<Heritage[]> {
	const heritages = await getAllHeritages();
	const lowerAncestryName = ancestryName.toLowerCase();
	return heritages.filter((heritage) => heritage.ancestry.toLowerCase() === lowerAncestryName);
}

/**
 * Get heritages by ancestry slug
 */
export async function getHeritagesByAncestrySlug(ancestrySlug: string): Promise<Heritage[]> {
	return QueryCache.getOrFetch(CacheKeys.byAncestry(ancestrySlug), async () => {
		return QueryBuilder.filter<Heritage>({
			type: 'heritage',
			ancestrySlug
		});
	});
}

/**
 * Get a heritage by name (case-insensitive)
 */
export async function getHeritageByName(name: string): Promise<Heritage | null> {
	const heritages = await getAllHeritages();
	const lowerName = name.toLowerCase();
	return heritages.find((heritage) => heritage.name.toLowerCase() === lowerName) ?? null;
}

/**
 * Get heritages by trait
 */
export async function getHeritagesByTrait(trait: string): Promise<Heritage[]> {
	return QueryCache.getOrFetch(CacheKeys.byTrait('heritage', trait), () =>
		QueryBuilder.getByTrait<Heritage>('heritage', trait)
	);
}

/**
 * Search heritages by name (case-insensitive)
 */
export async function searchHeritages(query: string): Promise<Heritage[]> {
	if (!query || query.trim() === '') return [];
	return QueryBuilder.searchByName<Heritage>('heritage', query);
}

/**
 * Get heritages matching multiple criteria
 */
export async function getHeritages(criteria: {
	ancestry?: string;
	ancestrySlug?: string;
	trait?: string;
	rarity?: Heritage['rarity'];
}): Promise<Heritage[]> {
	// Use SQL filters when possible
	if (criteria.ancestrySlug && !criteria.trait && !criteria.rarity && !criteria.ancestry) {
		return getHeritagesByAncestrySlug(criteria.ancestrySlug);
	}

	let heritages = await getAllHeritages();

	if (criteria.ancestry) {
		const lowerAncestry = criteria.ancestry.toLowerCase();
		heritages = heritages.filter((heritage) => heritage.ancestry.toLowerCase() === lowerAncestry);
	}

	if (criteria.ancestrySlug) {
		const lowerSlug = criteria.ancestrySlug.toLowerCase();
		heritages = heritages.filter((heritage) => heritage.ancestrySlug.toLowerCase() === lowerSlug);
	}

	if (criteria.trait) {
		const trait = criteria.trait;
		heritages = heritages.filter((heritage) => heritage.traits.includes(trait));
	}

	if (criteria.rarity) {
		heritages = heritages.filter((heritage) => heritage.rarity === criteria.rarity);
	}

	return heritages;
}

/**
 * Get versatile heritages (heritages that work with any ancestry)
 */
export async function getVersatileHeritages(): Promise<Heritage[]> {
	// Versatile heritages typically have the "versatile" trait
	return getHeritagesByTrait('versatile');
}

/**
 * Clear the heritages cache (useful for testing or data updates)
 */
export function clearHeritagesCache(): void {
	QueryCache.invalidatePrefix('all:heritage');
	QueryCache.invalidatePrefix('trait:heritage');
	QueryCache.invalidatePrefix('ancestry:');
}
