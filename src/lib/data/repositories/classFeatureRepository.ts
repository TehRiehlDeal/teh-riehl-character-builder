/**
 * Class Feature Repository
 *
 * Provides access to class feature data using SQLite.
 * Maintains the same public API as the previous JSON-based implementation.
 */

import type { ClassFeature } from '../types/app';
import { DatabaseManager, QueryBuilder, QueryCache, CacheKeys } from '../database';

/**
 * Load all class features from the database
 */
export async function loadAllClassFeatures(): Promise<ClassFeature[]> {
	return QueryCache.getOrFetch('all:classfeature', async () => {
		return QueryBuilder.filter<ClassFeature>({
			type: 'feat',
			category: 'classfeature'
		});
	});
}

/**
 * Get a class feature by ID
 */
export async function getClassFeatureById(id: string): Promise<ClassFeature | null> {
	return QueryCache.getOrFetch(CacheKeys.byId(id), () => QueryBuilder.getById<ClassFeature>(id));
}

/**
 * Get a class feature by name
 */
export async function getClassFeatureByName(name: string): Promise<ClassFeature | null> {
	const classFeatures = await loadAllClassFeatures();
	return classFeatures.find((cf) => cf.name.toLowerCase() === name.toLowerCase()) || null;
}

/**
 * Get all class features for a specific class (by trait)
 */
export async function getClassFeaturesByClass(className: string): Promise<ClassFeature[]> {
	const classNameLower = className.toLowerCase();

	// Use cached query for class-specific features
	return QueryCache.getOrFetch(`classfeature:class:${classNameLower}`, async () => {
		const classFeatures = await loadAllClassFeatures();
		return classFeatures.filter((cf) =>
			cf.traits.some((trait) => trait.toLowerCase() === classNameLower)
		);
	});
}

/**
 * Get class features by level (for a specific class)
 */
export async function getClassFeaturesByLevel(
	className: string,
	level: number
): Promise<ClassFeature[]> {
	const classFeatures = await getClassFeaturesByClass(className);
	return classFeatures.filter((cf) => cf.level === level);
}

/**
 * Search class features by name or description
 */
export async function searchClassFeatures(query: string): Promise<ClassFeature[]> {
	if (!query || query.trim() === '') {
		return [];
	}

	const classFeatures = await loadAllClassFeatures();
	const queryLower = query.toLowerCase();

	return classFeatures.filter(
		(cf) =>
			cf.name.toLowerCase().includes(queryLower) ||
			cf.description.toLowerCase().includes(queryLower) ||
			cf.traits.some((trait) => trait.toLowerCase().includes(queryLower))
	);
}

/**
 * Clear the cache (useful for testing or when data changes)
 */
export function clearClassFeatureCache(): void {
	QueryCache.invalidatePrefix('all:classfeature');
	QueryCache.invalidatePrefix('classfeature:class:');
}
