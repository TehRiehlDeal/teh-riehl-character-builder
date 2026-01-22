/**
 * Class Repository
 *
 * Provides data access methods for classes using SQLite.
 * Maintains the same public API as the previous JSON-based implementation.
 */

import type { Class } from '../types/app';
import { DatabaseManager, QueryBuilder, QueryCache, CacheKeys } from '../database';

/**
 * Get all classes
 */
export async function getAllClasses(): Promise<Class[]> {
	return QueryCache.getOrFetch(CacheKeys.all('class'), () => QueryBuilder.getAll<Class>('class'));
}

/**
 * Get a class by ID
 */
export async function getClassById(id: string): Promise<Class | null> {
	return QueryCache.getOrFetch(CacheKeys.byId(id), () => QueryBuilder.getById<Class>(id));
}

/**
 * Get a class by name (case-insensitive)
 */
export async function getClassByName(name: string): Promise<Class | null> {
	const classes = await getAllClasses();
	const lowerName = name.toLowerCase();
	return classes.find((cls) => cls.name.toLowerCase() === lowerName) ?? null;
}

/**
 * Get classes by key ability
 */
export async function getClassesByKeyAbility(ability: string): Promise<Class[]> {
	const classes = await getAllClasses();
	return classes.filter((cls) => cls.keyAbility.includes(ability));
}

/**
 * Search classes by name (case-insensitive)
 */
export async function searchClasses(query: string): Promise<Class[]> {
	if (!query || query.trim() === '') return [];
	return QueryBuilder.searchByName<Class>('class', query);
}

/**
 * Get classes matching multiple criteria
 */
export async function getClasses(criteria: {
	minHP?: number;
	maxHP?: number;
	keyAbility?: string;
	hasHeavyArmor?: boolean;
	hasMartialWeapons?: boolean;
}): Promise<Class[]> {
	let classes = await getAllClasses();

	if (criteria.minHP !== undefined) {
		classes = classes.filter((cls) => cls.hp >= criteria.minHP!);
	}

	if (criteria.maxHP !== undefined) {
		classes = classes.filter((cls) => cls.hp <= criteria.maxHP!);
	}

	if (criteria.keyAbility) {
		classes = classes.filter((cls) => cls.keyAbility.includes(criteria.keyAbility!));
	}

	if (criteria.hasHeavyArmor !== undefined) {
		classes = classes.filter(
			(cls) => (cls.proficiencies.defenses.heavy > 0) === criteria.hasHeavyArmor
		);
	}

	if (criteria.hasMartialWeapons !== undefined) {
		classes = classes.filter(
			(cls) => (cls.proficiencies.attacks.martial > 0) === criteria.hasMartialWeapons
		);
	}

	return classes;
}

/**
 * Get classes with high HP (10 or more)
 */
export async function getHighHPClasses(): Promise<Class[]> {
	const classes = await getAllClasses();
	return classes.filter((cls) => cls.hp >= 10);
}

/**
 * Get classes with heavy armor proficiency
 */
export async function getClassesWithHeavyArmor(): Promise<Class[]> {
	const classes = await getAllClasses();
	return classes.filter((cls) => cls.proficiencies.defenses.heavy > 0);
}

/**
 * Get classes with martial weapon proficiency
 */
export async function getClassesWithMartialWeapons(): Promise<Class[]> {
	const classes = await getAllClasses();
	return classes.filter((cls) => cls.proficiencies.attacks.martial > 0);
}

/**
 * Get classes with expert or better perception
 */
export async function getClassesWithExpertPerception(): Promise<Class[]> {
	const classes = await getAllClasses();
	return classes.filter((cls) => cls.proficiencies.perception >= 2);
}

/**
 * Get number of feat slots at a specific level for a class
 */
export async function getFeatSlotsAtLevel(
	classId: string,
	level: number
): Promise<{
	ancestry: boolean;
	class: boolean;
	general: boolean;
	skill: boolean;
} | null> {
	const cls = await getClassById(classId);
	if (!cls) return null;

	return {
		ancestry: cls.featSlots.ancestry.includes(level),
		class: cls.featSlots.class.includes(level),
		general: cls.featSlots.general.includes(level),
		skill: cls.featSlots.skill.includes(level)
	};
}

/**
 * Clear the classes cache (useful for testing or data updates)
 */
export function clearClassesCache(): void {
	QueryCache.invalidatePrefix('all:class');
}
