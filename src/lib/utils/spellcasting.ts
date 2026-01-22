/**
 * Spellcasting Utility Functions
 *
 * Provides utility functions for determining spellcasting abilities,
 * resolving traditions from bloodline/patron choices, and calculating
 * spell-related values.
 */

import {
	type SpellTradition,
	BLOODLINE_TRADITIONS,
	PATRON_TRADITIONS,
	getSpellcastingConfig,
	isSpellcaster,
	getSpellSlotsForLevel,
	getSpellsKnownCount
} from '$lib/data/spellcasting/spellcastingConfig';

// Re-export the basic utility functions from config
export {
	isSpellcaster,
	getSpellcastingConfig,
	getMaxSpellLevel,
	getSpellSlotsForLevel,
	getSpellsKnownCount,
	getCantripsKnownCount,
	classRequiresPreparation,
	hasSpellbook,
	getSpellbookCapacity
} from '$lib/data/spellcasting/spellcastingConfig';

/**
 * Resolve the actual spell tradition for a class, considering bloodline/patron choices
 *
 * @param className - The class name (e.g., "Wizard", "Sorcerer")
 * @param ruleSelections - The character's rule selections (from ChoiceSet elements)
 * @returns The resolved spell tradition, or null if no spellcasting
 */
export function resolveSpellTradition(
	className: string | null,
	ruleSelections: Record<string, string | string[]>
): SpellTradition | null {
	if (!className) return null;

	const config = getSpellcastingConfig(className);
	if (!config) return null;

	const tradition = config.tradition;

	// If tradition is fixed, return it directly
	if (
		tradition === 'arcane' ||
		tradition === 'divine' ||
		tradition === 'primal' ||
		tradition === 'occult'
	) {
		return tradition;
	}

	// Handle dynamic traditions (bloodline/patron)
	if (tradition === 'bloodline') {
		return resolveBloodlineTradition(ruleSelections);
	}

	if (tradition === 'patron') {
		return resolvePatronTradition(ruleSelections);
	}

	return null;
}

/**
 * Resolve sorcerer bloodline tradition from rule selections
 */
function resolveBloodlineTradition(
	ruleSelections: Record<string, string | string[]>
): SpellTradition | null {
	// Look for bloodline-related selections
	// Common flag patterns: "bloodline", "sorcererBloodline", "sorcerer-bloodline"
	const possibleKeys = [
		'bloodline',
		'sorcererBloodline',
		'sorcerer-bloodline',
		'sorcerer:bloodline'
	];

	for (const key of possibleKeys) {
		const value = ruleSelections[key];
		if (value && typeof value === 'string') {
			const normalizedValue = value.toLowerCase().replace(/[-_\s]/g, '');
			// Check against bloodline traditions
			for (const [bloodline, trad] of Object.entries(BLOODLINE_TRADITIONS)) {
				if (normalizedValue.includes(bloodline.toLowerCase())) {
					return trad;
				}
			}
		}
	}

	// Also check for any key containing "bloodline"
	for (const [key, value] of Object.entries(ruleSelections)) {
		if (key.toLowerCase().includes('bloodline') && typeof value === 'string') {
			const normalizedValue = value.toLowerCase().replace(/[-_\s]/g, '');
			for (const [bloodline, trad] of Object.entries(BLOODLINE_TRADITIONS)) {
				if (normalizedValue.includes(bloodline.toLowerCase())) {
					return trad;
				}
			}
		}
	}

	return null;
}

/**
 * Resolve witch patron tradition from rule selections
 */
function resolvePatronTradition(
	ruleSelections: Record<string, string | string[]>
): SpellTradition | null {
	// Look for patron-related selections
	const possibleKeys = ['patron', 'witchPatron', 'witch-patron', 'witch:patron'];

	for (const key of possibleKeys) {
		const value = ruleSelections[key];
		if (value && typeof value === 'string') {
			const normalizedValue = value.toLowerCase().replace(/[-_\s]/g, '');
			for (const [patron, trad] of Object.entries(PATRON_TRADITIONS)) {
				if (normalizedValue.includes(patron.toLowerCase().replace(/[-_\s]/g, ''))) {
					return trad;
				}
			}
		}
	}

	// Also check for any key containing "patron"
	for (const [key, value] of Object.entries(ruleSelections)) {
		if (key.toLowerCase().includes('patron') && typeof value === 'string') {
			const normalizedValue = value.toLowerCase().replace(/[-_\s]/g, '');
			for (const [patron, trad] of Object.entries(PATRON_TRADITIONS)) {
				if (normalizedValue.includes(patron.toLowerCase().replace(/[-_\s]/g, ''))) {
					return trad;
				}
			}
		}
	}

	return null;
}

/**
 * Get all spells known limits by spell level for a class at a given character level
 * Returns a map of spell level -> max spells known
 */
export function getAllSpellsKnownLimits(
	className: string | null,
	characterLevel: number
): Map<number, number> {
	const limits = new Map<number, number>();
	if (!className) return limits;

	const config = getSpellcastingConfig(className);
	if (!config || !config.spellsKnown) return limits;

	const known = config.spellsKnown[characterLevel];
	if (!known) return limits;

	for (const [level, count] of Object.entries(known)) {
		limits.set(parseInt(level), count);
	}

	return limits;
}

/**
 * Check if a class has spells known limits (spontaneous and bounded casters)
 */
export function hasSpellsKnownLimits(className: string | null): boolean {
	if (!className) return false;
	const config = getSpellcastingConfig(className);
	return config?.spellsKnown !== undefined;
}

/**
 * Get spellcasting type label for display
 */
export function getSpellcastingTypeLabel(type: 'prepared' | 'spontaneous' | 'bounded' | null): string {
	switch (type) {
		case 'prepared':
			return 'Prepared Caster';
		case 'spontaneous':
			return 'Spontaneous Caster';
		case 'bounded':
			return 'Bounded Caster';
		default:
			return 'None';
	}
}

/**
 * Get tradition label for display (capitalized)
 */
export function getTraditionLabel(tradition: string | null): string {
	if (!tradition) return 'None';
	return tradition.charAt(0).toUpperCase() + tradition.slice(1);
}

/**
 * Get total spells that can be known/prepared at a given spell level
 * For prepared casters: equals spell slots at that level
 * For spontaneous casters: uses spells known table
 */
export function getSpellCapacityAtLevel(
	className: string,
	characterLevel: number,
	spellLevel: number
): number {
	const config = getSpellcastingConfig(className);
	if (!config) return 0;

	if (config.type === 'spontaneous' && config.spellsKnown) {
		return getSpellsKnownCount(className, characterLevel, spellLevel);
	}

	// For prepared casters, capacity equals slots
	const slots = getSpellSlotsForLevel(className, characterLevel);
	const slotAtLevel = slots.find((s) => s.level === spellLevel);
	return slotAtLevel?.total ?? 0;
}

/**
 * Check if a character can learn spells of a given tradition
 */
export function canLearnTradition(
	className: string | null,
	ruleSelections: Record<string, string | string[]>,
	tradition: string
): boolean {
	if (!className) return false;

	const resolvedTradition = resolveSpellTradition(className, ruleSelections);
	return resolvedTradition === tradition;
}

/**
 * Get spell slot label for display (e.g., "2nd Level" or "Cantrips")
 */
export function getSpellLevelLabel(level: number): string {
	if (level === 0) return 'Cantrips';

	const suffixes: Record<number, string> = {
		1: 'st',
		2: 'nd',
		3: 'rd'
	};
	const suffix = suffixes[level] || 'th';
	return `${level}${suffix} Level`;
}

/**
 * Get all available spell levels for a class at a given character level
 */
export function getAvailableSpellLevels(className: string, characterLevel: number): number[] {
	const slots = getSpellSlotsForLevel(className, characterLevel);
	const levels = slots.map((s: { level: number; total: number }) => s.level);

	// Always include cantrips (level 0) for spellcasters
	if (isSpellcaster(className) && !levels.includes(0)) {
		levels.unshift(0);
	}

	return levels.sort((a: number, b: number) => a - b);
}

/**
 * Determine if a class requires spell preparation (vs. spontaneous casting)
 */
export function requiresPreparation(className: string): boolean {
	const config = getSpellcastingConfig(className);
	return config?.type === 'prepared';
}

/**
 * Determine if a class is a spontaneous caster
 */
export function isSpontaneousCaster(className: string): boolean {
	const config = getSpellcastingConfig(className);
	return config?.type === 'spontaneous';
}

/**
 * Determine if a class is a bounded caster
 */
export function isBoundedCaster(className: string): boolean {
	const config = getSpellcastingConfig(className);
	return config?.type === 'bounded';
}

/**
 * Get description of spellcasting style for a class
 */
export function getSpellcastingDescription(className: string | null): string {
	if (!className) return '';

	const config = getSpellcastingConfig(className);
	if (!config) return 'This class does not have spellcasting abilities.';

	switch (config.type) {
		case 'prepared':
			return 'You prepare a specific list of spells each day, choosing which spells to have available.';
		case 'spontaneous':
			return 'You have a repertoire of spells you can cast spontaneously, without preparing them in advance.';
		case 'bounded':
			return 'You have limited spell slots but can use them flexibly within your known spells.';
		default:
			return '';
	}
}
