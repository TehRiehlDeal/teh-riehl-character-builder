/**
 * Pathfinder 2e Game Data Types
 *
 * These types represent the raw game data structures (ancestries, backgrounds, classes, etc.)
 * loaded from the Foundry data packs.
 */

/**
 * Ancestry data from Foundry packs
 */
export interface Ancestry {
	id: string;
	name: string;
	description: string;
	hp: number;
	size: string;
	speed: number;
	abilityBoosts: string[];
	abilityFlaws: string[];
	languages: string[];
	traits: string[];
	rarity?: string;
	vision?: string;
}

/**
 * Heritage data from Foundry packs
 */
export interface Heritage {
	id: string;
	name: string;
	description: string;
	ancestry: string; // Name of the ancestry this heritage belongs to
	traits: string[];
	rarity?: string;
}

/**
 * Background data from Foundry packs
 */
export interface Background {
	id: string;
	name: string;
	description: string;
	abilityBoosts: string[]; // e.g., ["Strength", "Free"]
	skillTraining: string[]; // e.g., ["Athletics", "Lore: Labor"]
	feat?: string; // Name of the background feat
	traits: string[];
	rarity?: string;
}

/**
 * Class data from Foundry packs
 */
export interface Class {
	id: string;
	name: string;
	description: string;
	hp: number;
	keyAbility: string[]; // e.g., ["Strength", "Dexterity"] for Fighter, or ["Intelligence"] for Wizard
	perception?: number; // Initial proficiency rank (0-4)
	fortitude?: number;
	reflex?: number;
	will?: number;
	skills?: {
		trained?: string[]; // Specific skills granted
		additional?: number; // Number of additional skill choices
	};
	traits: string[];
	rarity?: string;
}

/**
 * Feat data from Foundry packs
 */
export interface Feat {
	id: string;
	name: string;
	description: string;
	level: number;
	category: string;
	traits: string[];
	prerequisites: string[];
	rarity?: string;
	actionType?: string;
}
