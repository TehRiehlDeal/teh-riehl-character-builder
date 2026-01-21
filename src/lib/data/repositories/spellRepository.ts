/**
 * Spell Repository
 *
 * Provides data access methods for spells.
 * Uses lazy loading to avoid loading all spells into memory at once.
 */

import type { Spell } from '../types/app';
import type { FoundrySpell } from '../types/foundry';
import { adaptSpell } from '../adapters/spellAdapter';
import { loadAllData, loadDataById, loadDataByFilter } from '../dataLoader';

/**
 * In-memory cache of loaded spells
 */
let spellsCache: Spell[] | null = null;

/**
 * Load all spells from raw data files
 */
async function loadSpells(): Promise<Spell[]> {
	if (spellsCache !== null) {
		return spellsCache;
	}

	try {
		const foundrySpells = await loadAllData<FoundrySpell>('spells');

		// Determine spell type based on path
		const spells = foundrySpells.map((foundrySpell: FoundrySpell & { path?: string }) => {
			let spellType: 'standard' | 'focus' | 'ritual' = 'standard';

			// You could check metadata or path to determine type
			// For now, we'll default to standard
			// In a more sophisticated implementation, the manifest could include this info

			return adaptSpell(foundrySpell, spellType);
		});

		spellsCache = spells;
		return spells;
	} catch (error) {
		console.error('Failed to load spells:', error);
		return [];
	}
}

/**
 * Get all spells
 */
export async function getAllSpells(): Promise<Spell[]> {
	return loadSpells();
}

/**
 * Get a spell by ID
 *
 * This method loads only the specific spell file, not all spells
 */
export async function getSpellById(id: string): Promise<Spell | null> {
	try {
		const foundrySpell = await loadDataById<FoundrySpell>('spells', id);
		if (!foundrySpell) {
			return null;
		}
		return adaptSpell(foundrySpell);
	} catch (error) {
		console.error(`Failed to load spell ${id}:`, error);
		return null;
	}
}

/**
 * Get spells by level
 */
export async function getSpellsByLevel(level: number): Promise<Spell[]> {
	const spells = await loadSpells();
	return spells.filter((spell) => spell.level === level);
}

/**
 * Get spells by tradition (arcane, divine, primal, occult)
 */
export async function getSpellsByTradition(tradition: string): Promise<Spell[]> {
	const spells = await loadSpells();
	return spells.filter((spell) => spell.traditions.includes(tradition));
}

/**
 * Get spells by type (standard, focus, ritual)
 */
export async function getSpellsByType(
	spellType: 'standard' | 'focus' | 'ritual'
): Promise<Spell[]> {
	const spells = await loadSpells();
	return spells.filter((spell) => spell.spellType === spellType);
}

/**
 * Get spells by trait
 */
export async function getSpellsByTrait(trait: string): Promise<Spell[]> {
	const spells = await loadSpells();
	return spells.filter((spell) => spell.traits.includes(trait));
}

/**
 * Search spells by name
 */
export async function searchSpells(query: string): Promise<Spell[]> {
	const spells = await loadSpells();
	const lowerQuery = query.toLowerCase();

	return spells.filter((spell) => spell.name.toLowerCase().includes(lowerQuery));
}

/**
 * Get cantrips
 */
export async function getCantrips(): Promise<Spell[]> {
	return getSpellsByLevel(0);
}

/**
 * Filter spells by multiple criteria
 */
export async function filterSpells(filters: {
	level?: number;
	tradition?: string;
	spellType?: 'standard' | 'focus' | 'ritual';
	trait?: string;
	minLevel?: number;
	maxLevel?: number;
}): Promise<Spell[]> {
	let spells = await loadSpells();

	if (filters.level !== undefined) {
		spells = spells.filter((spell) => spell.level === filters.level);
	}

	if (filters.tradition) {
		spells = spells.filter((spell) => spell.traditions.includes(filters.tradition!));
	}

	if (filters.spellType) {
		spells = spells.filter((spell) => spell.spellType === filters.spellType);
	}

	if (filters.trait) {
		spells = spells.filter((spell) => spell.traits.includes(filters.trait!));
	}

	if (filters.minLevel !== undefined) {
		spells = spells.filter((spell) => spell.level >= filters.minLevel!);
	}

	if (filters.maxLevel !== undefined) {
		spells = spells.filter((spell) => spell.level <= filters.maxLevel!);
	}

	return spells;
}

/**
 * Clear the spell cache
 *
 * Useful for testing or when data is updated
 */
export function clearSpellCache(): void {
	spellsCache = null;
}
