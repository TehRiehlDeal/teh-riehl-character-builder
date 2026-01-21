/**
 * Feat Repository
 *
 * Provides data access methods for feats.
 * Uses lazy loading to avoid loading all feats into memory at once.
 */

import type { Feat } from '../types/app';
import type { FoundryFeat } from '../types/foundry';
import { adaptFeat } from '../adapters/featAdapter';
import { loadAllData, loadDataById } from '../dataLoader';

/**
 * In-memory cache of loaded feats
 */
let featsCache: Feat[] | null = null;

/**
 * Load all feats from raw data files
 */
async function loadFeats(): Promise<Feat[]> {
	if (featsCache !== null) {
		return featsCache;
	}

	try {
		const foundryFeats = await loadAllData<FoundryFeat>('feats');
		const feats = foundryFeats.map((feat) => adaptFeat(feat));
		featsCache = feats;
		return feats;
	} catch (error) {
		console.error('Failed to load feats:', error);
		return [];
	}
}

/**
 * Get all feats
 */
export async function getAllFeats(): Promise<Feat[]> {
	return loadFeats();
}

/**
 * Get a feat by ID
 *
 * This method loads only the specific feat file, not all feats
 */
export async function getFeatById(id: string): Promise<Feat | null> {
	try {
		const foundryFeat = await loadDataById<FoundryFeat>('feats', id);
		if (!foundryFeat) {
			return null;
		}
		return adaptFeat(foundryFeat);
	} catch (error) {
		console.error(`Failed to load feat ${id}:`, error);
		return null;
	}
}

/**
 * Get feats by category
 */
export async function getFeatsByCategory(
	category: 'general' | 'skill' | 'class' | 'ancestry' | 'archetype'
): Promise<Feat[]> {
	const feats = await loadFeats();
	return feats.filter((feat) => feat.category === category);
}

/**
 * Get feats by level
 */
export async function getFeatsByLevel(level: number): Promise<Feat[]> {
	const feats = await loadFeats();
	return feats.filter((feat) => feat.level === level);
}

/**
 * Get feats by trait
 */
export async function getFeatsByTrait(trait: string): Promise<Feat[]> {
	const feats = await loadFeats();
	return feats.filter((feat) => feat.traits.includes(trait));
}

/**
 * Search feats by name (case-insensitive)
 */
export async function searchFeats(query: string): Promise<Feat[]> {
	const feats = await loadFeats();
	const lowerQuery = query.toLowerCase();

	return feats.filter((feat) => feat.name.toLowerCase().includes(lowerQuery));
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
	let feats = await loadFeats();

	if (criteria.category) {
		feats = feats.filter((feat) => feat.category === criteria.category);
	}

	if (criteria.level !== undefined) {
		feats = feats.filter((feat) => feat.level === criteria.level);
	}

	if (criteria.trait) {
		const trait = criteria.trait;
		feats = feats.filter((feat) => feat.traits.includes(trait));
	}

	if (criteria.hasPrerequisites !== undefined) {
		if (criteria.hasPrerequisites) {
			feats = feats.filter((feat) => feat.prerequisites.length > 0);
		} else {
			feats = feats.filter((feat) => feat.prerequisites.length === 0);
		}
	}

	return feats;
}

/**
 * Get feats available at a specific character level
 * (feats with level <= characterLevel)
 */
export async function getFeatsAvailableAtLevel(characterLevel: number): Promise<Feat[]> {
	const feats = await loadFeats();
	return feats.filter((feat) => feat.level <= characterLevel);
}

/**
 * Clear the feats cache (useful for testing or data updates)
 */
export function clearFeatsCache(): void {
	featsCache = null;
}
