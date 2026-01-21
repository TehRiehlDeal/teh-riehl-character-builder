/**
 * Condition Repository
 *
 * Provides data access methods for conditions.
 * Uses lazy loading to avoid loading all conditions into memory at once.
 */

import type { Condition } from '../types/app';
import type { FoundryCondition } from '../types/foundry';
import { adaptCondition } from '../adapters/conditionAdapter';
import { loadAllData, loadDataById } from '../dataLoader';

/**
 * In-memory cache of loaded conditions
 */
let conditionCache: Condition[] | null = null;

/**
 * Load all conditions from raw data files
 */
async function loadConditions(): Promise<Condition[]> {
	if (conditionCache !== null) {
		return conditionCache;
	}

	try {
		// Load all condition data from manifest
		const foundryConditions = await loadAllData<FoundryCondition>('conditions');

		// Adapt to app schema
		const conditions = foundryConditions.map((condition) => adaptCondition(condition));

		conditionCache = conditions;
		return conditions;
	} catch (error) {
		console.error('Failed to load conditions:', error);
		return [];
	}
}

/**
 * Get all conditions
 */
export async function getAllConditions(): Promise<Condition[]> {
	return loadConditions();
}

/**
 * Get condition by ID
 *
 * This method loads only the specific condition file, not all conditions
 */
export async function getConditionById(id: string): Promise<Condition | null> {
	try {
		const foundryCondition = await loadDataById<FoundryCondition>('conditions', id);
		if (!foundryCondition) {
			return null;
		}

		return adaptCondition(foundryCondition);
	} catch (error) {
		console.error(`Failed to load condition ${id}:`, error);
		return null;
	}
}

/**
 * Get valued conditions (conditions with numeric values like Frightened, Drained, etc.)
 */
export async function getValuedConditions(): Promise<Condition[]> {
	const conditions = await loadConditions();
	return conditions.filter((condition) => condition.value?.isValued === true);
}

/**
 * Search conditions by name
 */
export async function searchConditions(query: string): Promise<Condition[]> {
	const conditions = await loadConditions();
	const lowerQuery = query.toLowerCase();

	return conditions.filter((condition) => condition.name.toLowerCase().includes(lowerQuery));
}

/**
 * Get conditions by trait
 */
export async function getConditionsByTrait(trait: string): Promise<Condition[]> {
	const conditions = await loadConditions();
	return conditions.filter((condition) => condition.traits.includes(trait));
}

/**
 * Clear the condition cache
 *
 * Useful for testing or when data is updated
 */
export function clearConditionCache(): void {
	conditionCache = null;
}
