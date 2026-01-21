import type { Modifier } from './Modifier';

/**
 * Character - Root state object for a Pathfinder 2e character
 *
 * This is the main data structure that holds all character information.
 */
export interface Character {
	/** Unique identifier */
	id: string;

	/** Character name */
	name: string;

	/** Current level (1-20) */
	level: number;

	/** Version of the game data this character was created/modified with */
	dataVersion: string;

	/** User ID (nullable for MVP local-only mode, used for future cloud sync) */
	userId: string | null;

	/** Ancestry information */
	ancestry: AncestryData | null;

	/** Background information */
	background: BackgroundData | null;

	/** Class information */
	class: ClassData | null;

	/** Ability scores */
	abilities: AbilityScores;

	/** Hit points */
	hitPoints: HitPoints;

	/** Skills */
	skills: SkillsData;

	/** Feats */
	feats: FeatSlot[];

	/** Spells (if applicable) */
	spells: SpellData | null;

	/** Inventory */
	inventory: InventoryData;

	/** Active conditions/effects */
	activeConditions: string[];

	/** All modifiers currently affecting the character */
	modifiers: Modifier[];

	/** Level planning data (for levels beyond current level) */
	levelPlans: Map<number, LevelPlan>;

	/** Variant rules enabled for this character */
	variantRules: VariantRules;

	/** Metadata */
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Ancestry data
 */
export interface AncestryData {
	id: string;
	name: string;
	heritage: string | null;
	abilityBoosts: string[];
	abilityFlaws: string[];
}

/**
 * Background data
 */
export interface BackgroundData {
	id: string;
	name: string;
	abilityBoosts: string[];
	skillTraining: string[];
}

/**
 * Class data
 */
export interface ClassData {
	id: string;
	name: string;
	keyAbility: string;
	hitPoints: number;
	subclass: string | null;
}

/**
 * Ability scores (Str, Dex, Con, Int, Wis, Cha)
 */
export interface AbilityScores {
	strength: number;
	dexterity: number;
	constitution: number;
	intelligence: number;
	wisdom: number;
	charisma: number;
}

/**
 * Hit points
 */
export interface HitPoints {
	current: number;
	max: number;
	temp: number;
}

/**
 * Skills data
 */
export interface SkillsData {
	[skillName: string]: SkillProficiency;
}

/**
 * Skill proficiency levels
 */
export type ProficiencyRank = 'untrained' | 'trained' | 'expert' | 'master' | 'legendary';

/**
 * Skill proficiency
 */
export interface SkillProficiency {
	rank: ProficiencyRank;
}

/**
 * Feat slot (class feat, ancestry feat, skill feat, etc.)
 */
export interface FeatSlot {
	level: number;
	type: FeatType;
	featId: string | null;
	source: string;
}

/**
 * Feat types
 */
export type FeatType = 'class' | 'ancestry' | 'skill' | 'general' | 'archetype';

/**
 * Spell data
 */
export interface SpellData {
	tradition: string;
	spellcasting: 'prepared' | 'spontaneous';
	spellSlots: Record<number, number>; // spell level -> slots
	knownSpells: string[]; // spell IDs
	preparedSpells: Record<number, string[]>; // spell level -> prepared spell IDs
	focusPoints: {
		current: number;
		max: number;
	};
}

/**
 * Inventory data
 */
export interface InventoryData {
	items: InventoryItem[];
	coins: {
		platinum: number;
		gold: number;
		silver: number;
		copper: number;
	};
	bulk: {
		current: number;
		max: number;
	};
}

/**
 * Inventory item
 */
export interface InventoryItem {
	id: string;
	itemId: string;
	name: string;
	quantity: number;
	invested: boolean;
	container: string | null; // ID of container item, or null if not in a container
}

/**
 * Level plan (for planning future levels)
 */
export interface LevelPlan {
	level: number;
	abilityBoosts: string[];
	skillIncreases: string[];
	feats: Record<FeatType, string | null>;
	classFeatureChoices: Record<string, string>; // feature ID -> choice
}

/**
 * Variant rules configuration
 */
export interface VariantRules {
	freeArchetype: boolean;
	automaticBonusProgression: boolean;
	gradualAbilityBoosts: boolean;
	proficiencyWithoutLevel: boolean;
	stamina: boolean;
	voluntaryFlaws: boolean;
	dualClass: boolean;
}

/**
 * Create a new character with default values
 */
export function createCharacter(params: {
	id: string;
	name: string;
	dataVersion: string;
	userId?: string | null;
}): Character {
	return {
		id: params.id,
		name: params.name,
		level: 1,
		dataVersion: params.dataVersion,
		userId: params.userId ?? null,
		ancestry: null,
		background: null,
		class: null,
		abilities: {
			strength: 10,
			dexterity: 10,
			constitution: 10,
			intelligence: 10,
			wisdom: 10,
			charisma: 10
		},
		hitPoints: {
			current: 0,
			max: 0,
			temp: 0
		},
		skills: {},
		feats: [],
		spells: null,
		inventory: {
			items: [],
			coins: {
				platinum: 0,
				gold: 0,
				silver: 0,
				copper: 0
			},
			bulk: {
				current: 0,
				max: 5
			}
		},
		activeConditions: [],
		modifiers: [],
		levelPlans: new Map(),
		variantRules: {
			freeArchetype: false,
			automaticBonusProgression: false,
			gradualAbilityBoosts: false,
			proficiencyWithoutLevel: false,
			stamina: false,
			voluntaryFlaws: true,
			dualClass: false
		},
		createdAt: new Date(),
		updatedAt: new Date()
	};
}

/**
 * Calculate ability modifier from ability score
 */
export function getAbilityModifier(score: number): number {
	return Math.floor((score - 10) / 2);
}

/**
 * Get proficiency bonus based on rank and level
 *
 * @param rank The proficiency rank
 * @param level The character level
 * @param usePWL Whether to use Proficiency Without Level variant (default: false)
 */
export function getProficiencyBonus(
	rank: ProficiencyRank,
	level: number,
	usePWL: boolean = false
): number {
	if (usePWL) {
		// Proficiency Without Level: flat bonuses
		switch (rank) {
			case 'untrained':
				return 0;
			case 'trained':
				return 2;
			case 'expert':
				return 4;
			case 'master':
				return 6;
			case 'legendary':
				return 8;
		}
	} else {
		// Standard PF2e: level + rank bonus
		switch (rank) {
			case 'untrained':
				return 0;
			case 'trained':
				return level + 2;
			case 'expert':
				return level + 4;
			case 'master':
				return level + 6;
			case 'legendary':
				return level + 8;
		}
	}
}
