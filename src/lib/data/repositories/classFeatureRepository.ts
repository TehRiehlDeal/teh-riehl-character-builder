/**
 * Class Feature Repository
 *
 * Provides access to class feature data with caching and search capabilities.
 */

import type { FoundryFeat } from '../types/foundry';
import type { ClassFeature } from '../types/app';
import { adaptClassFeature, adaptClassFeatures } from '../adapters/classFeatureAdapter';

// Cache for all class features
let classFeatureCache: ClassFeature[] | null = null;

/**
 * Load all class features from the raw JSON files
 */
export async function loadAllClassFeatures(): Promise<ClassFeature[]> {
	if (classFeatureCache) {
		return classFeatureCache;
	}

	try {
		// Dynamically import all classfeature JSON files
		const classFeatureModules = import.meta.glob('/src/lib/data/raw/classfeatures/*.json');

		// Load all classfeatures in parallel
		const classFeaturePromises = Object.entries(classFeatureModules).map(
			async ([path, loader]) => {
				const module = (await loader()) as { default: FoundryFeat };
				return module.default;
			}
		);

		const foundryClassFeatures = await Promise.all(classFeaturePromises);

		// Adapt to app schema
		classFeatureCache = adaptClassFeatures(foundryClassFeatures);

		return classFeatureCache;
	} catch (error) {
		console.error('Failed to load class features:', error);
		throw error;
	}
}

/**
 * Get a class feature by ID
 */
export async function getClassFeatureById(id: string): Promise<ClassFeature | null> {
	const classFeatures = await loadAllClassFeatures();
	return classFeatures.find((cf) => cf.id === id) || null;
}

/**
 * Get a class feature by name
 */
export async function getClassFeatureByName(name: string): Promise<ClassFeature | null> {
	const classFeatures = await loadAllClassFeatures();
	return (
		classFeatures.find((cf) => cf.name.toLowerCase() === name.toLowerCase()) || null
	);
}

/**
 * Get all class features for a specific class (by trait)
 */
export async function getClassFeaturesByClass(
	className: string
): Promise<ClassFeature[]> {
	const classFeatures = await loadAllClassFeatures();
	const classNameLower = className.toLowerCase();
	return classFeatures.filter((cf) =>
		cf.traits.some((trait) => trait.toLowerCase() === classNameLower)
	);
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
	classFeatureCache = null;
}
