/**
 * Repository for loading and accessing class archetype data
 *
 * Class archetypes are special variants of base classes that players can select
 * at level 1. They modify class features, grant different abilities, and can
 * suppress certain base class features.
 */

import type { ClassArchetype } from '../types/app';
import type { FoundryFeat } from '../types/foundry';
import { adaptClassArchetype } from '../adapters/classArchetypeAdapter';

// Class archetype files
const CLASS_ARCHETYPE_FILES = [
	'avenger',
	'battle-creed',
	'bloodrager',
	'eldritch-trickster',
	'elemental-magic',
	'flexible-spell-preparation',
	'light-mortar-innovation',
	'palatine-detective',
	'runelord',
	'seneschal',
	'vindicator',
	'war-mage',
	'warrior-of-legend',
	'way-of-the-spellshot',
	'wellspring-magic'
];

// Cache for loaded class archetypes
let classArchetypesCache: ClassArchetype[] | null = null;

/**
 * Load all class archetypes from JSON files
 */
export async function loadAllClassArchetypes(): Promise<ClassArchetype[]> {
	// Return cached data if available
	if (classArchetypesCache) {
		return classArchetypesCache;
	}

	const classArchetypes: ClassArchetype[] = [];

	for (const fileName of CLASS_ARCHETYPE_FILES) {
		try {
			// Dynamic import of JSON file
			const module = await import(`../raw/classfeatures/${fileName}.json`);
			const foundryData: FoundryFeat = module.default;

			// Adapt to our schema
			const classArchetype = adaptClassArchetype(foundryData);
			classArchetypes.push(classArchetype);
		} catch (error) {
			console.error(`Failed to load class archetype: ${fileName}`, error);
		}
	}

	// Cache the results
	classArchetypesCache = classArchetypes;

	return classArchetypes;
}

/**
 * Classes with prepared spellcasting (for Flexible Spell Preparation)
 * Requires: "prepares spells in spell slots using the same number of prepared spells per day"
 */
const PREPARED_SPELLCASTING_CLASSES = ['cleric', 'druid', 'witch', 'wizard', 'animist'];

/**
 * Classes with spontaneous spellcasting / spell repertoire (for Wellspring Magic)
 * Requires: "casts spells with a spell repertoire"
 */
const SPONTANEOUS_SPELLCASTING_CLASSES = ['bard', 'oracle', 'sorcerer', 'psychic', 'summoner'];

/**
 * Classes with arcane or primal tradition (for Elemental Magic)
 * Requires: "spellcasting class feature that chooses spells from the arcane or primal spell list"
 */
const ARCANE_OR_PRIMAL_CLASSES = [
	'wizard', // arcane
	'magus', // arcane
	'druid', // primal
	'sorcerer', // can be arcane or primal
	'summoner', // can be arcane or primal
	'witch' // can choose, often primal
];

/**
 * All spellcasting classes (union of all above)
 */
const SPELLCASTING_CLASSES = [
	...new Set([
		...PREPARED_SPELLCASTING_CLASSES,
		...SPONTANEOUS_SPELLCASTING_CLASSES,
		...ARCANE_OR_PRIMAL_CLASSES
	])
];

/**
 * Check if a class meets the prerequisites for a specific archetype
 */
function meetsArchetypePrerequisites(className: string, archetype: ClassArchetype): boolean {
	const normalizedClassName = className.toLowerCase();

	// Check prerequisites based on archetype name
	switch (archetype.name) {
		case 'Flexible Spell Preparation':
			return PREPARED_SPELLCASTING_CLASSES.includes(normalizedClassName);

		case 'Wellspring Magic':
			return SPONTANEOUS_SPELLCASTING_CLASSES.includes(normalizedClassName);

		case 'Elemental Magic':
			return ARCANE_OR_PRIMAL_CLASSES.includes(normalizedClassName);

		default:
			// For non-universal archetypes, always return true (handled by base class check)
			return true;
	}
}

/**
 * Check if a class is a spellcaster
 */
function isSpellcastingClass(className: string): boolean {
	return SPELLCASTING_CLASSES.includes(className.toLowerCase());
}

/**
 * Get class archetypes for a specific base class
 * @param baseClassName - The name of the base class (e.g., "Wizard", "Barbarian")
 * @returns Array of class archetypes compatible with the base class
 */
export async function getClassArchetypesForClass(
	baseClassName: string
): Promise<ClassArchetype[]> {
	const allArchetypes = await loadAllClassArchetypes();
	const normalizedClassName = baseClassName.toLowerCase();

	return allArchetypes.filter((archetype) => {
		// Include universal archetypes only if the class meets prerequisites
		if (archetype.isUniversal) {
			return (
				isSpellcastingClass(normalizedClassName) &&
				meetsArchetypePrerequisites(normalizedClassName, archetype)
			);
		}

		// Include archetypes specific to this class
		if (archetype.baseClass && archetype.baseClass.toLowerCase() === normalizedClassName) {
			return true;
		}

		return false;
	});
}

/**
 * Get a class archetype by ID
 * @param id - The class archetype ID
 * @returns The class archetype, or null if not found
 */
export async function getClassArchetypeById(id: string): Promise<ClassArchetype | null> {
	const allArchetypes = await loadAllClassArchetypes();
	return allArchetypes.find((archetype) => archetype.id === id) || null;
}

/**
 * Get a class archetype by name
 * @param name - The class archetype name (case-insensitive)
 * @returns The class archetype, or null if not found
 */
export async function getClassArchetypeByName(name: string): Promise<ClassArchetype | null> {
	const allArchetypes = await loadAllClassArchetypes();
	const normalizedName = name.toLowerCase();
	return allArchetypes.find((archetype) => archetype.name.toLowerCase() === normalizedName) || null;
}

/**
 * Clear the cache (useful for testing or data reloading)
 */
export function clearClassArchetypeCache(): void {
	classArchetypesCache = null;
}
