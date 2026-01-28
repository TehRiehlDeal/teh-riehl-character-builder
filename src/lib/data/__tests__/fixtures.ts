/**
 * Shared test fixtures and factory functions
 *
 * Provides reusable mock data for testing across the codebase
 */

import type {
	Feat,
	Spell,
	Ancestry,
	Heritage,
	Class,
	Background,
	Equipment,
	Weapon,
	Armor,
	Action,
	Condition,
	Effect,
	ClassArchetype,
	AbilityBoost,
	AbilityFlaw
} from '../types/app';

/**
 * Create a mock database row with JSON data column
 * @param data - The data to serialize into the row
 * @returns Mock row object with data column
 */
export function createMockRow<T>(data: T): { data: string } {
	return { data: JSON.stringify(data) };
}

/**
 * Create a mock Feat
 */
export function createMockFeat(overrides?: Partial<Feat>): Feat {
	return {
		id: 'test-feat-id',
		name: 'Test Feat',
		type: 'feat',
		description: '<p>Test feat description</p>',
		level: 1,
		category: 'general',
		prerequisites: [],
		traits: ['general'],
		rarity: 'common',
		source: {
			title: 'Pathfinder Player Core',
			license: 'ORC',
			remaster: true
		},
		rules: [],
		...overrides
	};
}

/**
 * Create a mock ClassArchetype
 */
export function createMockClassArchetype(overrides?: Partial<ClassArchetype>): ClassArchetype {
	return {
		id: 'test-archetype-id',
		name: 'Test Archetype',
		type: 'feat',
		description: '<p>Test archetype description</p>',
		level: 1,
		category: 'classfeature',
		prerequisites: [],
		traits: ['archetype'],
		rarity: 'common',
		source: {
			title: 'Pathfinder Advanced Player\'s Guide',
			license: 'ORC',
			remaster: false
		},
		rules: [],
		baseClass: 'wizard',
		suppressedFeatures: [],
		isUniversal: false,
		...overrides
	};
}

/**
 * Create a mock Spell
 */
export function createMockSpell(overrides?: Partial<Spell>): Spell {
	return {
		id: 'test-spell-id',
		name: 'Test Spell',
		type: 'spell',
		description: '<p>Test spell description</p>',
		level: 1,
		spellType: 'standard',
		traditions: ['arcane', 'occult'],
		castingTime: '2 actions',
		range: '30 feet',
		target: '1 creature',
		duration: 'instantaneous',
		sustained: false,
		traits: ['evocation'],
		rarity: 'common',
		source: {
			title: 'Pathfinder Player Core',
			license: 'ORC',
			remaster: true
		},
		rules: [],
		...overrides
	};
}

/**
 * Create a mock Ancestry
 */
export function createMockAncestry(overrides?: Partial<Ancestry>): Ancestry {
	return {
		id: 'test-ancestry-id',
		name: 'Test Ancestry',
		type: 'ancestry',
		description: '<p>Test ancestry description</p>',
		hp: 8,
		size: 'med',
		speed: 25,
		boosts: [
			{ index: 0, options: ['str', 'dex', 'con', 'int', 'wis', 'cha'], free: true },
			{ index: 1, options: ['str', 'dex', 'con', 'int', 'wis', 'cha'], free: true }
		],
		flaws: [],
		languages: ['common'],
		additionalLanguages: {
			count: 1,
			options: ['elvish', 'dwarven', 'draconic']
		},
		vision: 'normal',
		traits: ['humanoid'],
		rarity: 'common',
		source: {
			title: 'Pathfinder Player Core',
			license: 'ORC',
			remaster: true
		},
		rules: [],
		...overrides
	};
}

/**
 * Create a mock Heritage
 */
export function createMockHeritage(overrides?: Partial<Heritage>): Heritage {
	return {
		id: 'test-heritage-id',
		name: 'Test Heritage',
		type: 'heritage',
		description: '<p>Test heritage description</p>',
		ancestry: 'Test Ancestry',
		ancestrySlug: 'test-ancestry',
		traits: ['heritage'],
		rarity: 'common',
		source: {
			title: 'Pathfinder Player Core',
			license: 'ORC',
			remaster: true
		},
		rules: [],
		benefits: {
			senses: [],
			grantedItems: [],
			skillProficiencies: [],
			speeds: [],
			strikes: [],
			modifiers: [],
			choices: [],
			other: []
		},
		...overrides
	};
}

/**
 * Create a mock Class
 */
export function createMockClass(overrides?: Partial<Class>): Class {
	return {
		id: 'test-class-id',
		name: 'Test Class',
		type: 'class',
		description: '<p>Test class description</p>',
		hp: 8,
		keyAbility: ['str', 'dex'],
		proficiencies: {
			perception: 2,
			fortitude: 2,
			reflex: 1,
			will: 1,
			classDC: 1,
			attacks: {
				simple: 2,
				martial: 2,
				advanced: 0,
				unarmed: 2
			},
			defenses: {
				unarmored: 1,
				light: 2,
				medium: 2,
				heavy: 0
			}
		},
		skills: {
			trained: ['athletics'],
			additional: 3
		},
		featSlots: {
			ancestry: [1, 5, 9, 13, 17],
			class: [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
			general: [3, 7, 11, 15, 19],
			skill: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
		},
		classFeatures: [],
		traits: ['test-class'],
		rarity: 'common',
		source: {
			title: 'Pathfinder Player Core',
			license: 'ORC',
			remaster: true
		},
		rules: [],
		...overrides
	};
}

/**
 * Create a mock Background
 */
export function createMockBackground(overrides?: Partial<Background>): Background {
	return {
		id: 'test-background-id',
		name: 'Test Background',
		type: 'background',
		description: '<p>Test background description</p>',
		boosts: [
			{ index: 0, options: ['str', 'dex'], free: false },
			{ index: 1, options: ['str', 'dex', 'con', 'int', 'wis', 'cha'], free: true }
		],
		trainedSkills: ['athletics'],
		trainedLore: [],
		traits: ['background'],
		rarity: 'common',
		source: {
			title: 'Pathfinder Player Core',
			license: 'ORC',
			remaster: true
		},
		rules: [],
		...overrides
	};
}

/**
 * Create a mock Equipment
 */
export function createMockEquipment(overrides?: Partial<Equipment>): Equipment {
	return {
		id: 'test-equipment-id',
		name: 'Test Equipment',
		type: 'equipment',
		description: '<p>Test equipment description</p>',
		equipmentType: 'adventuring-gear',
		level: 0,
		price: {
			value: 100,
			display: '1 gp'
		},
		bulk: {
			value: 0.1,
			display: 'L'
		},
		traits: ['common'],
		rarity: 'common',
		source: {
			title: 'Pathfinder Player Core',
			license: 'ORC',
			remaster: true
		},
		rules: [],
		...overrides
	};
}

/**
 * Create a mock Weapon
 */
export function createMockWeapon(overrides?: Partial<Weapon>): Weapon {
	return {
		id: 'test-weapon-id',
		name: 'Test Weapon',
		type: 'equipment',
		description: '<p>Test weapon description</p>',
		equipmentType: 'weapon',
		category: 'martial',
		group: 'sword',
		level: 0,
		price: {
			value: 1000,
			display: '10 gp'
		},
		bulk: {
			value: 1,
			display: '1'
		},
		hands: 1,
		damage: {
			dice: 1,
			die: 'd8',
			damageType: 'slashing'
		},
		weaponTraits: ['versatile-p'],
		traits: ['martial', 'sword'],
		rarity: 'common',
		source: {
			title: 'Pathfinder Player Core',
			license: 'ORC',
			remaster: true
		},
		rules: [],
		...overrides
	};
}

/**
 * Create a mock Armor
 */
export function createMockArmor(overrides?: Partial<Armor>): Armor {
	return {
		id: 'test-armor-id',
		name: 'Test Armor',
		type: 'equipment',
		description: '<p>Test armor description</p>',
		equipmentType: 'armor',
		category: 'light',
		group: 'leather',
		level: 0,
		price: {
			value: 200,
			display: '2 gp'
		},
		bulk: {
			value: 1,
			display: '1'
		},
		acBonus: 1,
		dexCap: 5,
		checkPenalty: 0,
		speedPenalty: 0,
		traits: ['armor', 'light'],
		rarity: 'common',
		source: {
			title: 'Pathfinder Player Core',
			license: 'ORC',
			remaster: true
		},
		rules: [],
		...overrides
	};
}

/**
 * Create a mock Action
 */
export function createMockAction(overrides?: Partial<Action>): Action {
	return {
		id: 'test-action-id',
		name: 'Test Action',
		type: 'action',
		description: '<p>Test action description</p>',
		actionType: 'action',
		actions: 1,
		traits: ['test'],
		rarity: 'common',
		source: {
			title: 'Pathfinder Player Core',
			license: 'ORC',
			remaster: true
		},
		rules: [],
		...overrides
	};
}

/**
 * Create a mock Condition
 */
export function createMockCondition(overrides?: Partial<Condition>): Condition {
	return {
		id: 'test-condition-id',
		name: 'Test Condition',
		type: 'condition',
		description: '<p>Test condition description</p>',
		removable: true,
		overrides: [],
		traits: ['condition'],
		rarity: 'common',
		source: {
			title: 'Pathfinder Player Core',
			license: 'ORC',
			remaster: true
		},
		rules: [],
		...overrides
	};
}

/**
 * Create a mock Effect
 */
export function createMockEffect(overrides?: Partial<Effect>): Effect {
	return {
		id: 'test-effect-id',
		name: 'Test Effect',
		type: 'effect',
		description: '<p>Test effect description</p>',
		level: 1,
		duration: {
			expiry: null,
			sustained: false,
			unit: 'rounds',
			value: 1
		},
		start: {
			initiative: null,
			value: 0
		},
		tokenIcon: {
			show: false
		},
		traits: ['effect'],
		rarity: 'common',
		source: {
			title: 'Pathfinder Player Core',
			license: 'ORC',
			remaster: true
		},
		rules: [],
		...overrides
	};
}

/**
 * Create a mock AbilityBoost
 */
export function createMockAbilityBoost(overrides?: Partial<AbilityBoost>): AbilityBoost {
	return {
		index: 0,
		options: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
		free: true,
		...overrides
	};
}

/**
 * Create a mock AbilityFlaw
 */
export function createMockAbilityFlaw(overrides?: Partial<AbilityFlaw>): AbilityFlaw {
	return {
		index: 0,
		options: ['int'],
		...overrides
	};
}
