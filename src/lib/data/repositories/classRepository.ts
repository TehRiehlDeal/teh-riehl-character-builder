/**
 * Class Repository
 *
 * Provides data access methods for classes.
 * Uses lazy loading to avoid loading all classes into memory at once.
 */

import type { Class } from '../types/app';
import type { FoundryClass } from '../types/foundry';
import { adaptClass } from '../adapters/classAdapter';
import { loadAllData, loadDataById } from '../dataLoader';

/**
 * In-memory cache of loaded classes
 */
let classesCache: Class[] | null = null;

/**
 * Load all classes from raw data files
 */
async function loadClasses(): Promise<Class[]> {
	if (classesCache !== null) {
		return classesCache;
	}

	try {
		const foundryClasses = await loadAllData<FoundryClass>('classes');
		const classes = foundryClasses.map((cls) => adaptClass(cls));
		classesCache = classes;
		return classes;
	} catch (error) {
		console.error('Failed to load classes:', error);
		return [];
	}
}

/**
 * Get all classes
 */
export async function getAllClasses(): Promise<Class[]> {
	return loadClasses();
}

/**
 * Get a class by ID
 *
 * This method loads only the specific class file, not all classes
 */
export async function getClassById(id: string): Promise<Class | null> {
	try {
		const foundryClass = await loadDataById<FoundryClass>('classes', id);
		if (!foundryClass) {
			return null;
		}
		return adaptClass(foundryClass);
	} catch (error) {
		console.error(`Failed to load class ${id}:`, error);
		return null;
	}
}

/**
 * Get a class by name (case-insensitive)
 */
export async function getClassByName(name: string): Promise<Class | null> {
	const classes = await loadClasses();
	const lowerName = name.toLowerCase();
	return classes.find((cls) => cls.name.toLowerCase() === lowerName) ?? null;
}

/**
 * Get classes by key ability
 */
export async function getClassesByKeyAbility(ability: string): Promise<Class[]> {
	const classes = await loadClasses();
	return classes.filter((cls) => cls.keyAbility.includes(ability));
}

/**
 * Search classes by name (case-insensitive)
 */
export async function searchClasses(query: string): Promise<Class[]> {
	const classes = await loadClasses();
	const lowerQuery = query.toLowerCase();

	return classes.filter((cls) => cls.name.toLowerCase().includes(lowerQuery));
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
	let classes = await loadClasses();

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
	const classes = await loadClasses();
	return classes.filter((cls) => cls.hp >= 10);
}

/**
 * Get classes with heavy armor proficiency
 */
export async function getClassesWithHeavyArmor(): Promise<Class[]> {
	const classes = await loadClasses();
	return classes.filter((cls) => cls.proficiencies.defenses.heavy > 0);
}

/**
 * Get classes with martial weapon proficiency
 */
export async function getClassesWithMartialWeapons(): Promise<Class[]> {
	const classes = await loadClasses();
	return classes.filter((cls) => cls.proficiencies.attacks.martial > 0);
}

/**
 * Get classes with expert or better perception
 */
export async function getClassesWithExpertPerception(): Promise<Class[]> {
	const classes = await loadClasses();
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
	classesCache = null;
}
