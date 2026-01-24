/**
 * Parse string prerequisites from Foundry data into structured Prerequisite types
 */

import type { Prerequisite } from './types';

/**
 * Parse a prerequisite string into a structured Prerequisite object
 *
 * Common patterns:
 * - "Strength 14" -> ability prerequisite
 * - "trained in Athletics" -> skill prerequisite
 * - "expert in Crafting" -> skill prerequisite
 * - "Power Attack" -> feat prerequisite
 * - "dwarf" -> ancestry prerequisite (lowercase ancestry names)
 * - "fighter" -> class prerequisite (lowercase class names)
 */
export function parsePrerequisite(prereqString: string): Prerequisite | null {
	const trimmed = prereqString.trim();

	// Ability score prerequisites: "Strength 14", "Dex 12", etc.
	const abilityMatch = trimmed.match(/^(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|Str|Dex|Con|Int|Wis|Cha)\s+(\d+)$/i);
	if (abilityMatch) {
		const ability = expandAbilityName(abilityMatch[1]);
		return {
			type: 'ability',
			ability,
			value: parseInt(abilityMatch[2])
		};
	}

	// Skill prerequisites: "trained in Athletics", "expert in Crafting", etc.
	const skillMatch = trimmed.match(/^(trained|expert|master|legendary)\s+in\s+(.+)$/i);
	if (skillMatch) {
		return {
			type: 'skill',
			skill: skillMatch[2],
			rank: skillMatch[1].toLowerCase() as 'trained' | 'expert' | 'master' | 'legendary'
		};
	}

	// Check for class names (common PF2e classes)
	const classNames = ['barbarian', 'bard', 'champion', 'cleric', 'druid', 'fighter', 'monk', 'ranger', 'rogue', 'sorcerer', 'wizard', 'alchemist', 'investigator', 'oracle', 'swashbuckler', 'witch'];
	const lowerTrimmed = trimmed.toLowerCase();
	if (classNames.includes(lowerTrimmed)) {
		return {
			type: 'class',
			class: capitalizeFirst(lowerTrimmed)
		};
	}

	// Check for ancestry names (common PF2e ancestries)
	const ancestryNames = ['dwarf', 'elf', 'gnome', 'goblin', 'halfling', 'human', 'leshy', 'catfolk', 'kobold', 'orc', 'ratfolk', 'tengu'];
	if (ancestryNames.includes(lowerTrimmed)) {
		return {
			type: 'ancestry',
			ancestry: capitalizeFirst(lowerTrimmed)
		};
	}

	// Check for class feature prerequisites
	// Patterns: "spellcasting class feature", "spellcasting", "rage", etc.
	// Indicators: contains "class feature", "spellcasting", or ends with "feature"
	if (
		lowerTrimmed.includes('class feature') ||
		lowerTrimmed.includes('spellcasting') ||
		lowerTrimmed === 'rage' ||
		lowerTrimmed === 'ki' ||
		lowerTrimmed === 'focus pool' ||
		lowerTrimmed.endsWith(' feature')
	) {
		return {
			type: 'feature',
			feature: trimmed
		};
	}

	// If it doesn't match any pattern, assume it's a feat name
	// (Most prerequisites that don't match the above patterns are feat names)
	if (trimmed.length > 0) {
		return {
			type: 'feat',
			feat: trimmed
		};
	}

	return null;
}

/**
 * Parse an array of prerequisite strings
 */
export function parsePrerequisites(prereqStrings: string[]): Prerequisite[] {
	return prereqStrings
		.map(parsePrerequisite)
		.filter((p): p is Prerequisite => p !== null);
}

/**
 * Expand abbreviated ability names
 */
function expandAbilityName(abbrev: string): string {
	const map: Record<string, string> = {
		'Str': 'Strength',
		'Dex': 'Dexterity',
		'Con': 'Constitution',
		'Int': 'Intelligence',
		'Wis': 'Wisdom',
		'Cha': 'Charisma'
	};
	return map[abbrev] || abbrev;
}

/**
 * Capitalize first letter of a string
 */
function capitalizeFirst(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}
