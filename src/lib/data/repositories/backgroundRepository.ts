/**
 * Background Repository
 *
 * Provides data access methods for backgrounds using SQLite.
 * Maintains the same public API as the previous JSON-based implementation.
 */

import type { Background } from '../types/app';
import { DatabaseManager, QueryBuilder, QueryCache, CacheKeys } from '../database';

/**
 * Get all backgrounds
 */
export async function getAllBackgrounds(): Promise<Background[]> {
	return QueryCache.getOrFetch(CacheKeys.all('background'), () =>
		QueryBuilder.getAll<Background>('background')
	);
}

/**
 * Get a background by ID
 */
export async function getBackgroundById(id: string): Promise<Background | null> {
	return QueryCache.getOrFetch(CacheKeys.byId(id), () => QueryBuilder.getById<Background>(id));
}

/**
 * Get a background by name (case-insensitive)
 */
export async function getBackgroundByName(name: string): Promise<Background | null> {
	const backgrounds = await getAllBackgrounds();
	const lowerName = name.toLowerCase();
	return backgrounds.find((background) => background.name.toLowerCase() === lowerName) ?? null;
}

/**
 * Get backgrounds by trait
 */
export async function getBackgroundsByTrait(trait: string): Promise<Background[]> {
	return QueryCache.getOrFetch(CacheKeys.byTrait('background', trait), () =>
		QueryBuilder.getByTrait<Background>('background', trait)
	);
}

/**
 * Search backgrounds by name (case-insensitive)
 */
export async function searchBackgrounds(query: string): Promise<Background[]> {
	if (!query || query.trim() === '') return [];
	return QueryBuilder.searchByName<Background>('background', query);
}

/**
 * Get backgrounds matching multiple criteria
 */
export async function getBackgrounds(criteria: {
	trainedSkill?: string;
	hasAbilityBoost?: string;
	hasFreeBoost?: boolean;
}): Promise<Background[]> {
	let backgrounds = await getAllBackgrounds();

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
	const backgrounds = await getAllBackgrounds();
	return backgrounds.filter((background) => background.trainedSkills.includes(skill));
}

/**
 * Get backgrounds that grant a boost to a specific ability
 */
export async function getBackgroundsByAbilityBoost(ability: string): Promise<Background[]> {
	const backgrounds = await getAllBackgrounds();
	return backgrounds.filter((background) =>
		background.boosts.some((boost) => boost.options.includes(ability))
	);
}

/**
 * Get backgrounds with free ability boosts
 */
export async function getBackgroundsWithFreeBoosts(): Promise<Background[]> {
	const backgrounds = await getAllBackgrounds();
	return backgrounds.filter((background) => background.boosts.some((boost) => boost.free));
}

/**
 * Clear the backgrounds cache (useful for testing or data updates)
 */
export function clearBackgroundsCache(): void {
	QueryCache.invalidatePrefix('all:background');
	QueryCache.invalidatePrefix('trait:background');
}
