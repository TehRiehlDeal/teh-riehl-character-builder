/**
 * Type definitions for Foundry VTT PF2e data structures
 *
 * These types represent the raw data format from the Foundry VTT PF2e system.
 * They are used by adapters to transform Foundry data into our app schema.
 */

import type { RuleElement } from '../../engine/ruleElements/registry';

/**
 * Common fields present on all Foundry items
 */
export interface FoundryItemBase {
	_id: string;
	folder?: string;
	img: string;
	name: string;
	type: string;
	system: {
		description: {
			value: string; // HTML content
		};
		publication: {
			license: 'ORC' | 'OGL';
			remaster: boolean;
			title: string;
		};
		traits: {
			rarity: 'common' | 'uncommon' | 'rare' | 'unique';
			value: string[];
			otherTags?: string[]; // Additional tags for filtering (e.g., "alchemist-research-field")
		};
		rules: RuleElement[];
	};
}

/**
 * Foundry Feat structure
 */
export interface FoundryFeat extends FoundryItemBase {
	type: 'feat';
	system: FoundryItemBase['system'] & {
		category: 'general' | 'skill' | 'class' | 'ancestry' | 'archetype' | 'classfeature';
		level: {
			value: number;
		};
		prerequisites: {
			value: Array<{
				value?: string;
			}>;
		};
		actionType: {
			value: 'action' | 'reaction' | 'free' | 'passive' | null;
		};
		actions: {
			value: number | null;
		};
	};
}

/**
 * Foundry Ancestry structure
 */
export interface FoundryAncestry extends FoundryItemBase {
	type: 'ancestry';
	system: FoundryItemBase['system'] & {
		hp: number;
		size: 'tiny' | 'sm' | 'med' | 'lg' | 'huge' | 'grg';
		speed: number;
		boosts: Record<
			string,
			{
				value: string[];
			}
		>;
		flaws: Record<
			string,
			{
				value: string[];
			}
		>;
		languages: {
			value: string[];
			custom: string;
		};
		additionalLanguages: {
			count: number;
			value: string[];
			custom: string;
		};
		vision: 'normal' | 'low-light-vision' | 'darkvision';
		reach: number;
		hands: number;
	};
}

/**
 * Foundry Heritage structure
 */
export interface FoundryHeritage extends FoundryItemBase {
	type: 'heritage';
	system: FoundryItemBase['system'] & {
		ancestry: {
			name: string;
			slug: string;
			uuid: string;
		} | null; // Versatile heritages have null ancestry
	};
}

/**
 * Foundry Class structure
 */
export interface FoundryClass extends FoundryItemBase {
	type: 'class';
	system: FoundryItemBase['system'] & {
		hp: number;
		keyAbility: {
			value: string[];
		};
		perception: number;
		savingThrows: {
			fortitude: number;
			reflex: number;
			will: number;
		};
		attacks: {
			simple: number;
			martial: number;
			advanced: number;
			unarmed: number;
		};
		defenses: {
			unarmored: number;
			light: number;
			medium: number;
			heavy: number;
		};
		ancestryFeatLevels: {
			value: number[];
		};
		classFeatLevels: {
			value: number[];
		};
		generalFeatLevels: {
			value: number[];
		};
		skillFeatLevels: {
			value: number[];
		};
		trainedSkills: {
			value: string[];
			additional: number;
		};
		items?: Record<
			string,
			{
				level: number;
				name: string;
				uuid: string;
				img: string;
			}
		>;
	};
}

/**
 * Foundry Background structure
 */
export interface FoundryBackground extends FoundryItemBase {
	type: 'background';
	system: FoundryItemBase['system'] & {
		boosts: Record<
			string,
			{
				value: string[];
			}
		>;
		trainedSkills: {
			value: string[];
		};
	};
}

/**
 * Foundry Spell structure
 */
export interface FoundrySpell extends FoundryItemBase {
	type: 'spell';
	system: FoundryItemBase['system'] & {
		level: {
			value: number;
		};
		time: {
			value: string; // Actions or time
		};
		range: {
			value: string;
		};
		target: {
			value: string;
		};
		area: {
			type?: string;
			value?: number;
		} | null;
		duration: {
			value: string;
			sustained: boolean;
		};
		defense: {
			save?: {
				statistic: string;
				basic: boolean;
			};
		} | null;
		damage?: Record<string, unknown>; // Spell damage data
		heightening?: {
			type: 'fixed' | 'interval';
			levels?: Record<string, unknown>;
		};
	};
}

/**
 * Foundry Weapon structure
 */
export interface FoundryWeapon extends FoundryItemBase {
	type: 'weapon';
	system: FoundryItemBase['system'] & {
		level: {
			value: number;
		};
		category: 'simple' | 'martial' | 'advanced' | 'unarmed';
		group: string;
		damage: {
			dice: number;
			die: string;
			damageType: string;
		};
		range: number | null;
		reload: {
			value: number | null;
		};
		price: {
			value: Record<string, number>; // e.g., { gp: 10 }
		};
		bulk: {
			value: number;
		};
		usage: {
			value: string;
		};
	};
}

/**
 * Foundry Armor structure
 */
export interface FoundryArmor extends FoundryItemBase {
	type: 'armor';
	system: FoundryItemBase['system'] & {
		level: {
			value: number;
		};
		category: 'unarmored' | 'light' | 'medium' | 'heavy';
		group: string;
		acBonus: number;
		dexCap: number;
		checkPenalty: number;
		speedPenalty: number;
		strength: number;
		price: {
			value: Record<string, number>; // e.g., { gp: 10 }
		};
		bulk: {
			value: number;
		};
	};
}

/**
 * Foundry Equipment (generic) structure
 */
export interface FoundryEquipment extends FoundryItemBase {
	type: 'equipment' | 'consumable' | 'shield';
	system: FoundryItemBase['system'] & {
		level: {
			value: number;
		};
		price: {
			value: Record<string, number>; // e.g., { gp: 10, sp: 5 }
		};
		bulk: {
			value: number;
		};
		usage?: {
			value: string;
		};
	};
}

/**
 * Action item from Foundry
 */
export interface FoundryAction extends FoundryItemBase {
	type: 'action';
	system: FoundryItemBase['system'] & {
		actionType: {
			value: 'action' | 'reaction' | 'free' | 'passive';
		};
		actions: {
			value: number | null; // 1, 2, 3, or null
		};
		category: string | null;
		requirements?: string;
		trigger?: string;
	};
}

/**
 * Condition item from Foundry
 */
export interface FoundryCondition extends FoundryItemBase {
	type: 'condition';
	system: FoundryItemBase['system'] & {
		active: boolean;
		duration: {
			unit: string;
			value: number;
			expiry: string | null;
			perpetual: boolean;
			text: string;
		};
		value: {
			isValued: boolean;
			value: number;
			immutable: boolean;
		};
		removable: boolean;
		overrides: string[];
		references: {
			overrides: string[];
			overriddenBy: string[];
			immunityFrom: string[];
			children: string[];
		};
	};
}

/**
 * Foundry Effect structure (temporary buffs/debuffs)
 */
export interface FoundryEffect extends FoundryItemBase {
	type: 'effect';
	system: FoundryItemBase['system'] & {
		duration: {
			expiry: string | null;
			sustained: boolean;
			unit: string;
			value: number;
		};
		level: {
			value: number;
		};
		start: {
			initiative: number | null;
			value: number;
		};
		tokenIcon: {
			show: boolean;
		};
	};
}

/**
 * Proficiency ranks in PF2e
 */
export type ProficiencyRank = 0 | 1 | 2 | 3 | 4; // untrained, trained, expert, master, legendary
