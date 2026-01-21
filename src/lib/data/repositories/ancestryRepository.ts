/**
 * Ancestry Repository
 *
 * Provides data access methods for ancestries.
 * Uses lazy loading to avoid loading all ancestries into memory at once.
 */

import type { Ancestry } from '../types/app';
import type { FoundryAncestry } from '../types/foundry';
import { adaptAncestry } from '../adapters/ancestryAdapter';
import { loadAllData, loadDataById } from '../dataLoader';

/**
 * In-memory cache of loaded ancestries
 */
let ancestriesCache: Ancestry[] | null = null;

/**
 * Load all ancestries from raw data files
 */
async function loadAncestries(): Promise<Ancestry[]> {
	if (ancestriesCache !== null) {
		return ancestriesCache;
	}

	try {
		const foundryAncestries = await loadAllData<FoundryAncestry>('ancestries');
		const ancestries = foundryAncestries.map((ancestry) => adaptAncestry(ancestry));
		ancestriesCache = ancestries;
		return ancestries;
	} catch (error) {
		console.error('Failed to load ancestries:', error);
		return [];
	}
}

/**
 * Get all ancestries
 */
export async function getAllAncestries(): Promise<Ancestry[]> {
	return loadAncestries();
}

/**
 * Get an ancestry by ID
 *
 * This method loads only the specific ancestry file, not all ancestries
 */
export async function getAncestryById(id: string): Promise<Ancestry | null> {
	try {
		const foundryAncestry = await loadDataById<FoundryAncestry>('ancestries', id);
		if (!foundryAncestry) {
			return null;
		}
		return adaptAncestry(foundryAncestry);
	} catch (error) {
		console.error(`Failed to load ancestry ${id}:`, error);
		return null;
	}
}

/**
 * Get an ancestry by name (case-insensitive)
 */
export async function getAncestryByName(name: string): Promise<Ancestry | null> {
	const ancestries = await loadAncestries();
	const lowerName = name.toLowerCase();
	return ancestries.find((ancestry) => ancestry.name.toLowerCase() === lowerName) ?? null;
}

/**
 * Get ancestries by trait
 */
export async function getAncestriesByTrait(trait: string): Promise<Ancestry[]> {
	const ancestries = await loadAncestries();
	return ancestries.filter((ancestry) => ancestry.traits.includes(trait));
}

/**
 * Search ancestries by name (case-insensitive)
 */
export async function searchAncestries(query: string): Promise<Ancestry[]> {
	const ancestries = await loadAncestries();
	const lowerQuery = query.toLowerCase();

	return ancestries.filter((ancestry) => ancestry.name.toLowerCase().includes(lowerQuery));
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
	let ancestries = await loadAncestries();

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

	if (criteria.trait) {
		const trait = criteria.trait;
		ancestries = ancestries.filter((ancestry) => ancestry.traits.includes(trait));
	}

	return ancestries;
}

/**
 * Get ancestries with darkvision
 */
export async function getAncestriesWithDarkvision(): Promise<Ancestry[]> {
	const ancestries = await loadAncestries();
	return ancestries.filter((ancestry) => ancestry.vision === 'darkvision');
}

/**
 * Get ancestries with low-light vision
 */
export async function getAncestriesWithLowLightVision(): Promise<Ancestry[]> {
	const ancestries = await loadAncestries();
	return ancestries.filter((ancestry) => ancestry.vision === 'low-light-vision');
}

/**
 * Get ancestries by size
 */
export async function getAncestriesBySize(
	size: 'tiny' | 'sm' | 'med' | 'lg' | 'huge' | 'grg'
): Promise<Ancestry[]> {
	const ancestries = await loadAncestries();
	return ancestries.filter((ancestry) => ancestry.size === size);
}

/**
 * Clear the ancestries cache (useful for testing or data updates)
 */
export function clearAncestriesCache(): void {
	ancestriesCache = null;
}
