/**
 * Spellcasting Configuration
 *
 * Contains spellcasting rules and progression tables for all PF2e classes.
 * Based on official PF2e remaster rules.
 */

export type SpellTradition = 'arcane' | 'divine' | 'primal' | 'occult';
export type DynamicTradition = 'bloodline' | 'patron';
export type SpellcastingType = 'prepared' | 'spontaneous' | 'bounded';

export interface SpellSlotProgression {
	/** Character level -> { spell level -> slot count } */
	[characterLevel: number]: { [spellLevel: number]: number };
}

export interface SpellsKnownProgression {
	/** Character level -> { spell level -> spells known } */
	[characterLevel: number]: { [spellLevel: number]: number };
}

export interface CantripsProgression {
	/** Character level -> cantrips known */
	[characterLevel: number]: number;
}

export interface SpellbookCapacity {
	/** Starting cantrips at level 1 */
	startingCantrips: number;
	/** Starting leveled spells at level 1 (by spell level) */
	startingSpells: { [spellLevel: number]: number };
	/** Cantrips gained per level after 1 */
	cantripsPerLevel: number;
	/** Leveled spells gained per character level */
	spellsPerLevel: number;
}

export interface SpellcastingConfig {
	/** Fixed tradition or 'bloodline'/'patron' for dynamic lookup */
	tradition: SpellTradition | DynamicTradition;
	/** Spellcasting type: prepared, spontaneous, or bounded */
	type: SpellcastingType;
	/** Spell slots per character level and spell level */
	spellSlots: SpellSlotProgression;
	/** Spells known (for spontaneous casters) */
	spellsKnown?: SpellsKnownProgression;
	/** Cantrips known progression */
	cantrips: CantripsProgression;
	/** Spellbook capacity (for prepared casters with spellbooks) */
	spellbook?: SpellbookCapacity;
}

// =============================================================================
// Standard Spell Slot Progressions
// =============================================================================

/**
 * Full caster spell slot progression (Wizard, Cleric, Druid, Bard, Sorcerer, etc.)
 */
const FULL_CASTER_SLOTS: SpellSlotProgression = {
	1: { 1: 2 },
	2: { 1: 3 },
	3: { 1: 3, 2: 2 },
	4: { 1: 3, 2: 3 },
	5: { 1: 3, 2: 3, 3: 2 },
	6: { 1: 3, 2: 3, 3: 3 },
	7: { 1: 3, 2: 3, 3: 3, 4: 2 },
	8: { 1: 3, 2: 3, 3: 3, 4: 3 },
	9: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 2 },
	10: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 },
	11: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2 },
	12: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3 },
	13: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 2 },
	14: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3 },
	15: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 2 },
	16: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3 },
	17: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 2 },
	18: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3 },
	19: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 1 },
	20: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 1 }
};

/**
 * Bounded caster spell slot progression (Magus, Summoner)
 * Generally 1 slot per available level
 */
const BOUNDED_CASTER_SLOTS: SpellSlotProgression = {
	1: { 1: 1 },
	2: { 1: 1 },
	3: { 1: 1, 2: 1 },
	4: { 1: 1, 2: 1 },
	5: { 1: 1, 2: 1, 3: 1 },
	6: { 1: 1, 2: 1, 3: 1 },
	7: { 1: 1, 2: 1, 3: 1, 4: 1 },
	8: { 1: 1, 2: 1, 3: 1, 4: 1 },
	9: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
	10: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
	11: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 },
	12: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 },
	13: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1 },
	14: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1 },
	15: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 },
	16: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 },
	17: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1 },
	18: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1 },
	19: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2 },
	20: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2 }
};

// =============================================================================
// Spells Known Progressions (Spontaneous Casters)
// =============================================================================

/**
 * Bard spells known progression
 */
const BARD_SPELLS_KNOWN: SpellsKnownProgression = {
	1: { 1: 2 },
	2: { 1: 3 },
	3: { 1: 3, 2: 2 },
	4: { 1: 3, 2: 3 },
	5: { 1: 3, 2: 3, 3: 2 },
	6: { 1: 3, 2: 3, 3: 3 },
	7: { 1: 3, 2: 3, 3: 3, 4: 2 },
	8: { 1: 3, 2: 3, 3: 3, 4: 3 },
	9: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 2 },
	10: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 },
	11: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2 },
	12: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3 },
	13: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 2 },
	14: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3 },
	15: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 2 },
	16: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3 },
	17: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 2 },
	18: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3 },
	19: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 1 },
	20: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 1 }
};

/**
 * Sorcerer spells known progression (slightly more generous due to bloodline spells)
 */
const SORCERER_SPELLS_KNOWN: SpellsKnownProgression = {
	1: { 1: 2 },
	2: { 1: 3 },
	3: { 1: 3, 2: 2 },
	4: { 1: 3, 2: 3 },
	5: { 1: 3, 2: 3, 3: 2 },
	6: { 1: 3, 2: 3, 3: 3 },
	7: { 1: 3, 2: 3, 3: 3, 4: 2 },
	8: { 1: 3, 2: 3, 3: 3, 4: 3 },
	9: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 2 },
	10: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 },
	11: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2 },
	12: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3 },
	13: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 2 },
	14: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3 },
	15: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 2 },
	16: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3 },
	17: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 2 },
	18: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3 },
	19: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 1 },
	20: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 1 }
};

// =============================================================================
// Cantrip Progressions
// =============================================================================

/**
 * Standard cantrip progression for most full casters
 */
const STANDARD_CANTRIPS: CantripsProgression = {
	1: 5,
	2: 5,
	3: 5,
	4: 5,
	5: 5,
	6: 5,
	7: 5,
	8: 5,
	9: 5,
	10: 5,
	11: 5,
	12: 5,
	13: 5,
	14: 5,
	15: 5,
	16: 5,
	17: 5,
	18: 5,
	19: 5,
	20: 5
};

/**
 * Bounded caster spells known progression (Magus, Summoner)
 * They know a limited number of spells from their tradition that they can prepare
 */
const BOUNDED_SPELLS_KNOWN: SpellsKnownProgression = {
	1: { 1: 2 },
	2: { 1: 2 },
	3: { 1: 2, 2: 2 },
	4: { 1: 2, 2: 2 },
	5: { 1: 2, 2: 2, 3: 2 },
	6: { 1: 2, 2: 2, 3: 2 },
	7: { 1: 2, 2: 2, 3: 2, 4: 2 },
	8: { 1: 2, 2: 2, 3: 2, 4: 2 },
	9: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2 },
	10: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2 },
	11: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 },
	12: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 },
	13: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2 },
	14: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2 },
	15: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2 },
	16: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2 },
	17: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2 },
	18: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2 },
	19: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3 },
	20: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3 }
};

/**
 * Bounded caster cantrip progression (Magus, Summoner)
 */
const BOUNDED_CANTRIPS: CantripsProgression = {
	1: 5,
	2: 5,
	3: 5,
	4: 5,
	5: 5,
	6: 5,
	7: 5,
	8: 5,
	9: 5,
	10: 5,
	11: 5,
	12: 5,
	13: 5,
	14: 5,
	15: 5,
	16: 5,
	17: 5,
	18: 5,
	19: 5,
	20: 5
};

// =============================================================================
// Class Spellcasting Configuration
// =============================================================================

/**
 * Map of class names (lowercase) to their spellcasting configuration
 */
export const CLASS_SPELLCASTING: Record<string, SpellcastingConfig | null> = {
	// Full Prepared Casters
	wizard: {
		tradition: 'arcane',
		type: 'prepared',
		spellSlots: FULL_CASTER_SLOTS,
		cantrips: STANDARD_CANTRIPS,
		spellbook: {
			startingCantrips: 10,
			startingSpells: { 1: 5 },
			cantripsPerLevel: 0,
			spellsPerLevel: 2
		}
	},
	cleric: {
		tradition: 'divine',
		type: 'prepared',
		spellSlots: FULL_CASTER_SLOTS,
		cantrips: STANDARD_CANTRIPS
	},
	druid: {
		tradition: 'primal',
		type: 'prepared',
		spellSlots: FULL_CASTER_SLOTS,
		cantrips: STANDARD_CANTRIPS
	},
	witch: {
		tradition: 'patron', // Determined by patron choice
		type: 'prepared',
		spellSlots: FULL_CASTER_SLOTS,
		cantrips: STANDARD_CANTRIPS
	},

	// Full Spontaneous Casters
	bard: {
		tradition: 'occult',
		type: 'spontaneous',
		spellSlots: FULL_CASTER_SLOTS,
		spellsKnown: BARD_SPELLS_KNOWN,
		cantrips: STANDARD_CANTRIPS
	},
	sorcerer: {
		tradition: 'bloodline', // Determined by bloodline choice
		type: 'spontaneous',
		spellSlots: FULL_CASTER_SLOTS,
		spellsKnown: SORCERER_SPELLS_KNOWN,
		cantrips: STANDARD_CANTRIPS
	},
	oracle: {
		tradition: 'divine',
		type: 'spontaneous',
		spellSlots: FULL_CASTER_SLOTS,
		spellsKnown: BARD_SPELLS_KNOWN,
		cantrips: STANDARD_CANTRIPS
	},
	psychic: {
		tradition: 'occult',
		type: 'spontaneous',
		spellSlots: FULL_CASTER_SLOTS,
		spellsKnown: BARD_SPELLS_KNOWN,
		cantrips: STANDARD_CANTRIPS
	},

	// Bounded Casters
	magus: {
		tradition: 'arcane',
		type: 'bounded',
		spellSlots: BOUNDED_CASTER_SLOTS,
		spellsKnown: BOUNDED_SPELLS_KNOWN,
		cantrips: BOUNDED_CANTRIPS,
		spellbook: {
			startingCantrips: 8,
			startingSpells: { 1: 4 },
			cantripsPerLevel: 0,
			spellsPerLevel: 2
		}
	},
	summoner: {
		tradition: 'arcane', // Most summoners use arcane, but varies by eidolon
		type: 'bounded',
		spellSlots: BOUNDED_CASTER_SLOTS,
		spellsKnown: BOUNDED_SPELLS_KNOWN,
		cantrips: BOUNDED_CANTRIPS
	},

	// Primal Prepared (Animist from War of Immortals)
	animist: {
		tradition: 'primal',
		type: 'prepared',
		spellSlots: FULL_CASTER_SLOTS,
		cantrips: STANDARD_CANTRIPS
	},

	// Focus-only spellcasters (no spell slots)
	champion: null,
	monk: null,

	// Non-spellcasters
	fighter: null,
	rogue: null,
	ranger: null,
	barbarian: null,
	investigator: null,
	swashbuckler: null,
	gunslinger: null,
	inventor: null,
	thaumaturge: null,
	kineticist: null // Kineticist uses impulses, not spells
};

// =============================================================================
// Bloodline Traditions (Sorcerer)
// =============================================================================

/**
 * Map of sorcerer bloodline names to their spell traditions
 */
export const BLOODLINE_TRADITIONS: Record<string, SpellTradition> = {
	// Arcane bloodlines
	draconic: 'arcane',
	imperial: 'arcane',
	genie: 'arcane',

	// Divine bloodlines
	angelic: 'divine',
	demonic: 'divine',
	diabolic: 'divine',

	// Primal bloodlines
	elemental: 'primal',
	fey: 'primal',
	nymph: 'primal',

	// Occult bloodlines
	aberrant: 'occult',
	hag: 'occult',
	shadow: 'occult',
	undead: 'occult',
	psychopomp: 'occult'
};

// =============================================================================
// Patron Traditions (Witch)
// =============================================================================

/**
 * Map of witch patron names to their spell traditions
 */
export const PATRON_TRADITIONS: Record<string, SpellTradition> = {
	// Arcane patrons
	resentment: 'arcane',
	curse: 'arcane',

	// Divine patrons
	fate: 'divine',
	pacts: 'divine',

	// Primal patrons
	wild: 'primal',
	baba_yaga: 'primal',
	'mosquito witch': 'primal',

	// Occult patrons
	night: 'occult',
	silence: 'occult',
	fervor: 'occult',
	spinner: 'occult'
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if a class has spellcasting ability
 */
export function isSpellcaster(className: string): boolean {
	const config = CLASS_SPELLCASTING[className.toLowerCase()];
	return config !== null && config !== undefined;
}

/**
 * Get the spellcasting configuration for a class
 */
export function getSpellcastingConfig(className: string): SpellcastingConfig | null {
	return CLASS_SPELLCASTING[className.toLowerCase()] ?? null;
}

/**
 * Get the max spell level available at a given character level
 */
export function getMaxSpellLevel(characterLevel: number): number {
	// Standard progression: max spell level = ceil(characterLevel / 2), capped at 10
	return Math.min(Math.ceil(characterLevel / 2), 10);
}

/**
 * Get spell slots for a given class and character level
 */
export function getSpellSlotsForLevel(
	className: string,
	characterLevel: number
): Array<{ level: number; total: number }> {
	const config = getSpellcastingConfig(className);
	if (!config) return [];

	const slots = config.spellSlots[characterLevel];
	if (!slots) return [];

	return Object.entries(slots)
		.map(([level, total]) => ({
			level: parseInt(level),
			total
		}))
		.sort((a, b) => a.level - b.level);
}

/**
 * Get spells known count for spontaneous casters at a given level
 */
export function getSpellsKnownCount(
	className: string,
	characterLevel: number,
	spellLevel: number
): number {
	const config = getSpellcastingConfig(className);
	if (!config || !config.spellsKnown) return 0;

	const known = config.spellsKnown[characterLevel];
	if (!known) return 0;

	return known[spellLevel] ?? 0;
}

/**
 * Get cantrips known count for a class at a given character level
 */
export function getCantripsKnownCount(className: string, characterLevel: number): number {
	const config = getSpellcastingConfig(className);
	if (!config) return 0;

	return config.cantrips[characterLevel] ?? 0;
}

/**
 * Check if a class requires daily spell preparation
 * Both prepared and bounded casters must prepare spells
 */
export function classRequiresPreparation(className: string): boolean {
	const config = getSpellcastingConfig(className);
	if (!config) return false;
	return config.type === 'prepared' || config.type === 'bounded';
}

/**
 * Check if a class has a spellbook
 */
export function hasSpellbook(className: string): boolean {
	const config = getSpellcastingConfig(className);
	return config?.spellbook !== undefined;
}

/**
 * Get spellbook capacity for a class at a given character level
 * Returns the max number of spells that can be inscribed at each spell level
 */
export function getSpellbookCapacity(
	className: string,
	characterLevel: number
): { cantrips: number; spells: Record<number, number> } {
	const config = getSpellcastingConfig(className);
	if (!config?.spellbook) {
		return { cantrips: 0, spells: {} };
	}

	const sb = config.spellbook;
	const levelsGained = characterLevel - 1;

	// Calculate cantrip capacity
	const cantrips = sb.startingCantrips + (sb.cantripsPerLevel * levelsGained);

	// Calculate spell capacity per level
	const spells: Record<number, number> = {};
	const maxSpellLevel = getMaxSpellLevel(characterLevel);

	// Start with starting spells
	for (const [level, count] of Object.entries(sb.startingSpells)) {
		const spellLevel = parseInt(level);
		if (spellLevel <= maxSpellLevel) {
			spells[spellLevel] = count;
		}
	}

	// Add spells gained per level (distributed to available spell levels)
	// For simplicity, add to the highest available spell level or distribute
	const totalGainedSpells = sb.spellsPerLevel * levelsGained;

	// Distribute gained spells: roughly even across available levels
	// In practice, players usually add to the highest levels they have access to
	// For now, just add to the max available level
	if (maxSpellLevel > 0 && totalGainedSpells > 0) {
		for (let level = 1; level <= maxSpellLevel; level++) {
			if (!spells[level]) {
				spells[level] = 0;
			}
		}
		// Simple distribution: add 2 per level gained to each spell level as it becomes available
		// This is a simplification - in reality players choose where to add spells
		spells[maxSpellLevel] = (spells[maxSpellLevel] || 0) + totalGainedSpells;
	}

	return { cantrips, spells };
}
