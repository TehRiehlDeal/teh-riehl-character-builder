/**
 * Application data schema types
 *
 * These types represent the data format used by our application.
 * Raw Foundry data is transformed into these schemas by adapters.
 */

import type { RuleElement } from '../../engine/ruleElements/registry';

/**
 * Base interface for all game items
 */
export interface GameItem {
	id: string;
	name: string;
	description: string; // HTML content
	traits: string[];
	rarity: 'common' | 'uncommon' | 'rare' | 'unique';
	source: {
		title: string;
		license: 'ORC' | 'OGL';
		remaster: boolean;
	};
	rules: RuleElement[];
}

/**
 * Feat data in our app schema
 */
export interface Feat extends GameItem {
	type: 'feat';
	level: number;
	category: 'general' | 'skill' | 'class' | 'ancestry' | 'archetype' | 'classfeature';
	prerequisites: string[];
	actionType?: 'action' | 'reaction' | 'free' | 'passive';
	actions?: number; // 1, 2, or 3 actions
}

/**
 * Class Feature data in our app schema
 * (Class features are stored as feats with category 'classfeature')
 */
export type ClassFeature = Feat & {
	category: 'classfeature';
};

/**
 * Class Archetype data in our app schema
 * Class archetypes are variants of base classes that modify features at level 1
 */
export interface ClassArchetype extends ClassFeature {
	/** The base class this archetype modifies (e.g., "wizard", "barbarian"). Null for universal archetypes. */
	baseClass: string | null;

	/** Features from the base class that this archetype suppresses/replaces */
	suppressedFeatures: string[];

	/** Whether this archetype is universal (can be applied to any spellcaster) */
	isUniversal: boolean;
}

/**
 * Ancestry data in our app schema
 */
export interface Ancestry extends GameItem {
	type: 'ancestry';
	hp: number;
	size: 'tiny' | 'sm' | 'med' | 'lg' | 'huge' | 'grg';
	speed: number;
	boosts: AbilityBoost[];
	flaws: AbilityFlaw[];
	languages: string[];
	additionalLanguages: {
		count: number;
		options: string[];
	};
	vision: 'normal' | 'low-light-vision' | 'darkvision';
}

/**
 * Heritage data in our app schema
 */
export interface Heritage extends GameItem {
	type: 'heritage';
	ancestry: string; // Name of the ancestry this heritage belongs to
	ancestrySlug: string; // Slug of the ancestry for matching
	benefits: {
		/** Sensory abilities granted (darkvision, low-light vision, etc.) */
		senses: Array<{ type: string; range?: number }>;
		/** Granted feats and features */
		grantedItems: Array<{ uuid: string; label?: string }>;
		/** Skill proficiency upgrades */
		skillProficiencies: Array<{
			skill: string;
			rank: number;
			mode: 'upgrade' | 'override' | 'downgrade';
		}>;
		/** Speed modifications */
		speeds: Array<{ type: string; value: number; predicate?: unknown[] }>;
		/** Unarmed strikes granted */
		strikes: Array<{
			label: string;
			baseType?: string;
			damage: { dice: number; die: string; type: string };
			traits: string[];
		}>;
		/** Flat modifiers to stats */
		modifiers: Array<{
			label: string;
			selector: string;
			value: number | string;
			type?: string;
			predicate?: unknown[];
		}>;
		/** Choices the player must make */
		choices: Array<{
			prompt: string;
			choices: Array<{ label: string; value: string }>;
			flag?: string;
			rollOption?: string;
			config?: string; // Dynamic choice config (e.g., 'skills', 'languages')
			itemType?: string; // Item type for dynamic choices (e.g., 'feat')
			filter?: string[]; // Filters for item type choices
		}>;
		/** Other rule types (for future implementation) */
		other: Array<{ key: string; summary: string }>;
	};
}

/**
 * Ability boost definition
 */
export interface AbilityBoost {
	/** Boost number (0, 1, 2...) - order matters for character creation */
	index: number;
	/** Available ability options (if free choice) */
	options: string[];
	/** True if this is a free boost (choose any ability) */
	free: boolean;
}

/**
 * Ability flaw definition
 */
export interface AbilityFlaw {
	index: number;
	options: string[];
}

/**
 * Class data in our app schema
 */
export interface Class extends GameItem {
	type: 'class';
	hp: number;
	keyAbility: string[];
	proficiencies: {
		perception: ProficiencyRank;
		fortitude: ProficiencyRank;
		reflex: ProficiencyRank;
		will: ProficiencyRank;
		classDC: ProficiencyRank;
		attacks: {
			simple: ProficiencyRank;
			martial: ProficiencyRank;
			advanced: ProficiencyRank;
			unarmed: ProficiencyRank;
		};
		defenses: {
			unarmored: ProficiencyRank;
			light: ProficiencyRank;
			medium: ProficiencyRank;
			heavy: ProficiencyRank;
		};
	};
	skills: {
		trained: string[]; // Specific skills granted as trained
		additional: number; // Number of additional trained skills
	};
	featSlots: {
		ancestry: number[];
		class: number[];
		general: number[];
		skill: number[];
	};
	classFeatures: Array<{
		level: number;
		name: string;
		uuid: string;
	}>;
}

/**
 * Background data in our app schema
 */
export interface Background extends GameItem {
	type: 'background';
	boosts: AbilityBoost[];
	trainedSkills: string[];
}

/**
 * Proficiency ranks (0-4)
 */
export type ProficiencyRank = 0 | 1 | 2 | 3 | 4;

/**
 * Spell data in our app schema
 */
export interface Spell extends GameItem {
	type: 'spell';
	level: number; // Cantrip is 0, spells are 1-10
	spellType: 'standard' | 'focus' | 'ritual';
	traditions: string[]; // arcane, divine, primal, occult
	castingTime: string; // e.g., "2 actions", "1 minute"
	range: string; // e.g., "30 feet", "touch"
	target?: string; // e.g., "1 creature"
	area?: string; // e.g., "20-foot burst"
	duration: string; // e.g., "1 minute", "sustained up to 1 minute"
	sustained: boolean;
	defense?: string; // e.g., "basic Reflex", "Will"
	damage?: Record<string, unknown>; // Base damage data from Foundry
	heightening?: {
		type: 'fixed' | 'interval';
		levels?: Record<number, unknown>; // Detailed heightening data
	};
}

/**
 * Equipment data in our app schema
 */
export interface Equipment extends GameItem {
	type: 'equipment';
	equipmentType: 'weapon' | 'armor' | 'shield' | 'consumable' | 'adventuring-gear' | 'other';
	level: number;
	price: {
		value: number; // In copper pieces
		display: string; // e.g., "10 gp"
	};
	bulk: {
		value: number; // In bulk units (0.1 = L)
		display: string; // e.g., "L", "1", "2"
	};
	hands?: number; // For weapons/shields
	usage?: string; // How the item is used
	activate?: {
		actionCost: number;
		actionType: 'action' | 'reaction' | 'free';
	};
}

/**
 * Weapon-specific data
 */
export interface Weapon extends Equipment {
	equipmentType: 'weapon';
	category: 'simple' | 'martial' | 'advanced' | 'unarmed';
	group: string; // e.g., "sword", "bow"
	damage: {
		dice: number;
		die: string; // e.g., "d6", "d8"
		damageType: string; // e.g., "slashing", "piercing"
	};
	range?: number; // For ranged weapons
	reload?: number; // For ranged weapons that need reloading
	weaponTraits: string[]; // e.g., "finesse", "deadly-d10"
}

/**
 * Armor-specific data
 */
export interface Armor extends Equipment {
	equipmentType: 'armor';
	category: 'unarmored' | 'light' | 'medium' | 'heavy';
	acBonus: number;
	dexCap?: number; // Max dex bonus
	checkPenalty: number;
	speedPenalty: number;
	strength?: number; // Minimum strength
	group: string; // e.g., "plate", "leather"
}

/**
 * Action data in our app schema
 */
export interface Action extends GameItem {
	type: 'action';
	actionType: 'action' | 'reaction' | 'free' | 'passive';
	actions?: number; // 1, 2, or 3 actions (null for reactions/free actions)
	category?: string; // Optional category for grouping
	requirements?: string; // Requirements to use the action
	trigger?: string; // Trigger for reactions
}

/**
 * Condition data in our app schema
 */
export interface Condition extends GameItem {
	type: 'condition';
	value?: {
		isValued: boolean; // Whether this condition has a numeric value
		value: number; // Current value (e.g., Frightened 2)
		immutable: boolean; // Whether the value can be changed
	};
	duration?: {
		unit: string; // e.g., "unlimited", "rounds", "minutes"
		value: number;
		text: string; // Human-readable duration text
	};
	removable: boolean; // Whether the condition can be manually removed
	overrides: string[]; // Other conditions this one overrides
}

/**
 * Effect - temporary buffs/debuffs from feats, spells, or actions
 * Examples: "Effect: Treat Wounds Immunity", "Effect: Rage"
 */
export interface Effect extends GameItem {
	type: 'effect';
	level: number;
	duration: {
		expiry: string | null;
		sustained: boolean;
		unit: string;
		value: number;
	};
	start: {
		initiative: number | null;
		value: number;
	};
	tokenIcon: {
		show: boolean;
	};
}

/**
 * Journal page data in our app schema
 */
export interface JournalPage {
	id: string;
	name: string;
	type: 'text' | 'image' | 'pdf' | 'video';
	content: string; // HTML content for text pages
	sortOrder: number;
}

/**
 * Journal entry data in our app schema
 */
export interface JournalEntry {
	id: string;
	name: string;
	pages: JournalPage[];
}

// Export string literals for abilities
export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
export type Ability = (typeof ABILITIES)[number];
