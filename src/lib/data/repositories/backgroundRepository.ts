/**
 * Background Repository
 *
 * Provides data access methods for backgrounds.
 * Uses lazy loading to avoid loading all backgrounds into memory at once.
 */

import type { Background } from '../types/app';
import type { FoundryBackground } from '../types/foundry';
import { adaptBackground } from '../adapters/backgroundAdapter';
import { loadAllData, loadDataById } from '../dataLoader';

/**
 * In-memory cache of loaded backgrounds
 */
let backgroundsCache: Background[] | null = null;

/**
 * Load all backgrounds from raw data files
 */
async function loadBackgrounds(): Promise<Background[]> {
	if (backgroundsCache !== null) {
		return backgroundsCache;
	}

	try {
		const foundryBackgrounds = await loadAllData<FoundryBackground>('backgrounds');
		const backgrounds = foundryBackgrounds.map((bg) => adaptBackground(bg));
		backgroundsCache = backgrounds;
		return backgrounds;
	} catch (error) {
		console.error('Failed to load backgrounds:', error);
		return [];
	}
}

/**
 * Get all backgrounds
 */
export async function getAllBackgrounds(): Promise<Background[]> {
	return loadBackgrounds();
}

/**
 * Get a background by ID
 *
 * This method loads only the specific background file, not all backgrounds
 */
export async function getBackgroundById(id: string): Promise<Background | null> {
	try {
		const foundryBackground = await loadDataById<FoundryBackground>('backgrounds', id);
		if (!foundryBackground) {
			return null;
		}
		return adaptBackground(foundryBackground);
	} catch (error) {
		console.error(`Failed to load background ${id}:`, error);
		return null;
	}
}

/**
 * Get a background by name (case-insensitive)
 */
export async function getBackgroundByName(name: string): Promise<Background | null> {
	const backgrounds = await loadBackgrounds();
	const lowerName = name.toLowerCase();
	return backgrounds.find((background) => background.name.toLowerCase() === lowerName) ?? null;
}

/**
 * Get backgrounds by trait
 */
export async function getBackgroundsByTrait(trait: string): Promise<Background[]> {
	const backgrounds = await loadBackgrounds();
	return backgrounds.filter((background) => background.traits.includes(trait));
}

/**
 * Search backgrounds by name (case-insensitive)
 */
export async function searchBackgrounds(query: string): Promise<Background[]> {
	const backgrounds = await loadBackgrounds();
	const lowerQuery = query.toLowerCase();

	return backgrounds.filter((background) => background.name.toLowerCase().includes(lowerQuery));
}

/**
 * Get backgrounds matching multiple criteria
 */
export async function getBackgrounds(criteria: {
	trainedSkill?: string;
	hasAbilityBoost?: string;
	hasFreeBoost?: boolean;
}): Promise<Background[]> {
	let backgrounds = await loadBackgrounds();

	if (criteria.trainedSkill) {
		backgrounds = backgrounds.filter((background) =>
			background.trainedSkills.includes(criteria.trainedSkill!)
		);
	}

	if (criteria.hasAbilityBoost) {
		backgrounds = backgrounds.filter((background) =>
			background.boosts.some((boost) => boost.options.includes(criteria.hasAbilityBoost!))
		);
	}

	if (criteria.hasFreeBoost !== undefined) {
		backgrounds = backgrounds.filter((background) => {
			const hasFree = background.boosts.some((boost) => boost.free);
			return hasFree === criteria.hasFreeBoost;
		});
	}

	return backgrounds;
}

/**
 * Get backgrounds that train a specific skill
 */
export async function getBackgroundsBySkill(skill: string): Promise<Background[]> {
	const backgrounds = await loadBackgrounds();
	return backgrounds.filter((background) => background.trainedSkills.includes(skill));
}

/**
 * Get backgrounds that grant a boost to a specific ability
 */
export async function getBackgroundsByAbilityBoost(ability: string): Promise<Background[]> {
	const backgrounds = await loadBackgrounds();
	return backgrounds.filter((background) =>
		background.boosts.some((boost) => boost.options.includes(ability))
	);
}

/**
 * Get backgrounds with free ability boosts
 */
export async function getBackgroundsWithFreeBoosts(): Promise<Background[]> {
	const backgrounds = await loadBackgrounds();
	return backgrounds.filter((background) => background.boosts.some((boost) => boost.free));
}

/**
 * Clear the backgrounds cache (useful for testing or data updates)
 */
export function clearBackgroundsCache(): void {
	backgroundsCache = null;
}
