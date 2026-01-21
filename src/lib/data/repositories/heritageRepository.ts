/**
 * Heritage Repository
 *
 * Provides data access methods for heritages.
 * Uses lazy loading to avoid loading all heritages into memory at once.
 */

import type { Heritage } from '../types/app';
import type { FoundryHeritage } from '../types/foundry';
import { adaptHeritage } from '../adapters/heritageAdapter';
import { loadAllData, loadDataById } from '../dataLoader';

/**
 * In-memory cache of loaded heritages
 */
let heritagesCache: Heritage[] | null = null;

/**
 * Load all heritages from raw data files
 */
async function loadHeritages(): Promise<Heritage[]> {
	if (heritagesCache !== null) {
		return heritagesCache;
	}

	try {
		const foundryHeritages = await loadAllData<FoundryHeritage>('heritages');
		const heritages = foundryHeritages.map((heritage) => adaptHeritage(heritage));
		heritagesCache = heritages;
		return heritages;
	} catch (error) {
		console.error('Failed to load heritages:', error);
		return [];
	}
}

/**
 * Get all heritages
 */
export async function getAllHeritages(): Promise<Heritage[]> {
	return loadHeritages();
}

/**
 * Get a heritage by ID
 *
 * This method loads only the specific heritage file, not all heritages
 */
export async function getHeritageById(id: string): Promise<Heritage | null> {
	try {
		const foundryHeritage = await loadDataById<FoundryHeritage>('heritages', id);
		if (!foundryHeritage) {
			return null;
		}
		return adaptHeritage(foundryHeritage);
	} catch (error) {
		console.error(`Failed to load heritage ${id}:`, error);
		return null;
	}
}

/**
 * Get heritages by ancestry name (case-insensitive)
 */
export async function getHeritagesByAncestry(ancestryName: string): Promise<Heritage[]> {
	const heritages = await loadHeritages();
	const lowerAncestryName = ancestryName.toLowerCase();
	return heritages.filter((heritage) => heritage.ancestry.toLowerCase() === lowerAncestryName);
}

/**
 * Get heritages by ancestry slug
 */
export async function getHeritagesByAncestrySlug(ancestrySlug: string): Promise<Heritage[]> {
	const heritages = await loadHeritages();
	const lowerSlug = ancestrySlug.toLowerCase();
	return heritages.filter((heritage) => heritage.ancestrySlug.toLowerCase() === lowerSlug);
}

/**
 * Get a heritage by name (case-insensitive)
 */
export async function getHeritageByName(name: string): Promise<Heritage | null> {
	const heritages = await loadHeritages();
	const lowerName = name.toLowerCase();
	return heritages.find((heritage) => heritage.name.toLowerCase() === lowerName) ?? null;
}

/**
 * Get heritages by trait
 */
export async function getHeritagesByTrait(trait: string): Promise<Heritage[]> {
	const heritages = await loadHeritages();
	return heritages.filter((heritage) => heritage.traits.includes(trait));
}

/**
 * Search heritages by name (case-insensitive)
 */
export async function searchHeritages(query: string): Promise<Heritage[]> {
	const heritages = await loadHeritages();
	const lowerQuery = query.toLowerCase();

	return heritages.filter((heritage) => heritage.name.toLowerCase().includes(lowerQuery));
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
	let heritages = await loadHeritages();

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
	heritagesCache = null;
}
