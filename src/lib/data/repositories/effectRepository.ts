/**
 * Effect Repository
 *
 * Provides data access methods for effects (temporary buffs/debuffs).
 * Uses lazy loading to avoid loading all effects into memory at once.
 */

import type { Effect } from '../types/app';
import type { FoundryEffect } from '../types/foundry';
import { adaptEffect } from '../adapters/effectAdapter';
import { loadAllData, loadDataById } from '../dataLoader';

/**
 * In-memory cache of loaded effects
 */
let effectCache: Effect[] | null = null;

/**
 * Load all effects from raw data files
 */
async function loadEffects(): Promise<Effect[]> {
	if (effectCache !== null) {
		return effectCache;
	}

	try {
		// Load all effect data from manifest
		const foundryEffects = await loadAllData<FoundryEffect>('effects');

		// Adapt to app schema
		const effects = foundryEffects.map((effect) => adaptEffect(effect));

		effectCache = effects;
		return effects;
	} catch (error) {
		console.error('Failed to load effects:', error);
		return [];
	}
}

/**
 * Get all effects
 */
export async function getAllEffects(): Promise<Effect[]> {
	return loadEffects();
}

/**
 * Get effect by ID
 *
 * This method loads only the specific effect file, not all effects
 */
export async function getEffectById(id: string): Promise<Effect | null> {
	try {
		const foundryEffect = await loadDataById<FoundryEffect>('effects', id);
		if (!foundryEffect) {
			return null;
		}

		return adaptEffect(foundryEffect);
	} catch (error) {
		console.error(`Failed to load effect ${id}:`, error);
		return null;
	}
}

/**
 * Search effects by name
 */
export async function searchEffects(query: string): Promise<Effect[]> {
	const effects = await loadEffects();
	const lowerQuery = query.toLowerCase();

	return effects.filter((effect) => effect.name.toLowerCase().includes(lowerQuery));
}

/**
 * Get effects by level
 */
export async function getEffectsByLevel(level: number): Promise<Effect[]> {
	const effects = await loadEffects();
	return effects.filter((effect) => effect.level === level);
}

/**
 * Get sustained effects (requires actions to maintain)
 */
export async function getSustainedEffects(): Promise<Effect[]> {
	const effects = await loadEffects();
	return effects.filter((effect) => effect.duration.sustained === true);
}

/**
 * Clear the effect cache
 *
 * Useful for testing or when data is updated
 */
export function clearEffectCache(): void {
	effectCache = null;
}
