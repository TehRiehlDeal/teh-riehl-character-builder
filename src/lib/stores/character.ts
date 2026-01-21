/**
 * Character Store
 *
 * Manages the current character data with localStorage persistence
 * and JSON export/import functionality.
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Character data structure
 */
export interface Character {
	/** Unique identifier for this character */
	id: string;
	/** Character name */
	name: string;
	/** Character level (1-20) */
	level: number;
	/** Experience points */
	xp: number;

	/** Ancestry information */
	ancestry: {
		id: string | null;
		name: string | null;
		heritage: string | null;
	};

	/** Background information */
	background: {
		id: string | null;
		name: string | null;
	};

	/** Class information */
	class: {
		id: string | null;
		name: string | null;
		subclass: string | null;
		keyAbility: string | null;
	};

	/** Ability scores (base 10, modified by boosts/flaws) */
	abilities: {
		strength: number;
		dexterity: number;
		constitution: number;
		intelligence: number;
		wisdom: number;
		charisma: number;
	};

	/** Hit points */
	hp: {
		max: number;
		current: number;
		temp: number;
	};

	/** Skills with proficiency ranks (0=untrained, 1=trained, 2=expert, 3=master, 4=legendary) */
	skills: Record<string, number>;

	/** Saving throws proficiency ranks */
	saves: {
		fortitude: number;
		reflex: number;
		will: number;
	};

	/** Perception proficiency rank */
	perception: number;

	/** Armor proficiency ranks */
	armorProficiency: {
		unarmored: number;
		light: number;
		medium: number;
		heavy: number;
	};

	/** Selected feats by category and level */
	feats: {
		ancestry: Array<{ level: number; featId: string; name: string }>;
		class: Array<{ level: number; featId: string; name: string }>;
		skill: Array<{ level: number; featId: string; name: string }>;
		general: Array<{ level: number; featId: string; name: string }>;
	};

	/** Active class features (automatic based on class and level) */
	classFeatures: Array<{ level: number; name: string; rules: any[] }>;

	/** Equipped items */
	equipment: {
		/** Equipped armor (provides AC, check penalty, speed penalty) */
		armor: { itemId: string; name: string } | null;
		/** Equipped shield (provides AC when raised) */
		shield: { itemId: string; name: string; raised: boolean } | null;
		/** Equipped weapons */
		weapons: Array<{ itemId: string; name: string; equipped: boolean }>;
		/** Other worn items (belts, cloaks, rings, etc.) */
		wornItems: Array<{ itemId: string; name: string; slot: string }>;
	};

	/** Rule element selections (from ChoiceSet rule elements) */
	ruleSelections: Record<string, string | string[]>;

	/** Active conditions (for predicate evaluation) */
	activeConditions: string[];

	/** Toggleable effects (user-controlled modifiers like "Raise Shield", "Combat Stance") */
	toggleableEffects: Record<string, boolean>;

	/** Active spells and effects */
	activeSpellsAndEffects: Array<{
		id: string; // spell or effect ID
		name: string;
		type: 'spell' | 'effect';
		level?: number; // spell level
		rules: any[]; // rule elements
	}>;

	/** Spellcasting data */
	spellcasting: {
		/** Known/prepared spells by spell ID */
		knownSpells: string[];
		/** Spell slots by level (1-10) */
		spellSlots: Array<{ level: number; total: number; used: number }>;
		/** Focus points */
		focusPoints: { max: number; current: number };
	};

	/** Inventory items (general inventory with quantities and bulk) */
	inventory: Array<{
		/** Equipment ID */
		itemId: string;
		/** Item name (for display) */
		name: string;
		/** Quantity carried */
		quantity: number;
		/** Whether the item is worn/equipped (for bulk calculations) */
		worn: boolean;
		/** Whether the item is invested (for magic items) */
		invested: boolean;
		/** Container ID if item is inside a container */
		containerId?: string;
	}>;

	/** Wealth (in copper pieces for precise calculations) */
	wealth: {
		/** Platinum pieces (1000 cp each) */
		pp: number;
		/** Gold pieces (100 cp each) */
		gp: number;
		/** Silver pieces (10 cp each) */
		sp: number;
		/** Copper pieces */
		cp: number;
	};

	/** Companions (familiars and animal companions) */
	companions: {
		/** Familiar data */
		familiar: {
			/** Whether the character has a familiar */
			hasFamiliar: boolean;
			/** Familiar name */
			name: string;
			/** Familiar type (e.g., "Raven", "Cat", "Owl") */
			type: string;
			/** Selected familiar abilities (by ability ID) */
			abilities: string[];
		};
		/** Animal companion data */
		animalCompanion: {
			/** Whether the character has an animal companion */
			hasCompanion: boolean;
			/** Companion name */
			name: string;
			/** Companion type ID (e.g., "bear", "cat", "horse") */
			typeId: string;
			/** Specialization choice (level 7+) */
			specialization: 'nimble' | 'savage' | null;
		};
	};

	/** Metadata */
	metadata: {
		/** When this character was created */
		createdAt: string;
		/** When this character was last modified */
		updatedAt: string;
		/** Data version used (for migration purposes) */
		dataVersion: string;
	};
}

/**
 * Create a new empty character
 */
export function createNewCharacter(): Character {
	return {
		id: crypto.randomUUID(),
		name: 'New Character',
		level: 1,
		xp: 0,
		ancestry: {
			id: null,
			name: null,
			heritage: null
		},
		background: {
			id: null,
			name: null
		},
		class: {
			id: null,
			name: null,
			subclass: null,
			keyAbility: null
		},
		abilities: {
			strength: 10,
			dexterity: 10,
			constitution: 10,
			intelligence: 10,
			wisdom: 10,
			charisma: 10
		},
		hp: {
			max: 0,
			current: 0,
			temp: 0
		},
		skills: {
			acrobatics: 0,
			arcana: 0,
			athletics: 0,
			crafting: 0,
			deception: 0,
			diplomacy: 0,
			intimidation: 0,
			medicine: 0,
			nature: 0,
			occultism: 0,
			performance: 0,
			religion: 0,
			society: 0,
			stealth: 0,
			survival: 0,
			thievery: 0
		},
		saves: {
			fortitude: 0,
			reflex: 0,
			will: 0
		},
		perception: 0,
		armorProficiency: {
			unarmored: 1, // Most characters start trained in unarmored
			light: 0,
			medium: 0,
			heavy: 0
		},
		feats: {
			ancestry: [],
			class: [],
			skill: [],
			general: []
		},
		classFeatures: [],
		equipment: {
			armor: null,
			shield: null,
			weapons: [],
			wornItems: []
		},
		ruleSelections: {},
		activeConditions: [],
		toggleableEffects: {},
		activeSpellsAndEffects: [],
		spellcasting: {
			knownSpells: [],
			spellSlots: [],
			focusPoints: { max: 0, current: 0 }
		},
		inventory: [],
		wealth: {
			pp: 0,
			gp: 0,
			sp: 0,
			cp: 0
		},
		companions: {
			familiar: {
				hasFamiliar: false,
				name: 'Familiar',
				type: '',
				abilities: []
			},
			animalCompanion: {
				hasCompanion: false,
				name: 'Companion',
				typeId: '',
				specialization: null
			}
		},
		metadata: {
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			dataVersion: 'data-v2026.01.1'
		}
	};
}

/**
 * Storage key for localStorage
 */
const STORAGE_KEY = 'pf2e-character-builder:current-character';

/**
 * Load character from localStorage
 */
function loadFromStorage(): Character {
	if (!browser) {
		return createNewCharacter();
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);

			// Ensure wealth property exists (migration for older characters)
			if (!parsed.wealth) {
				parsed.wealth = {
					pp: 0,
					gp: 0,
					sp: 0,
					cp: 0
				};
			}

			// Ensure inventory property exists (migration for older characters)
			if (!parsed.inventory) {
				parsed.inventory = [];
			}

			// Ensure equipment property exists (migration for older characters)
			if (!parsed.equipment) {
				parsed.equipment = {
					armor: null,
					shield: null,
					weapons: [],
					wornItems: []
				};
			}

			// Ensure classFeatures property exists (migration for older characters)
			if (!parsed.classFeatures) {
				parsed.classFeatures = [];
			}

			// Ensure activeConditions property exists (migration for older characters)
			if (!parsed.activeConditions) {
				parsed.activeConditions = [];
			}

			// Ensure toggleableEffects property exists (migration for older characters)
			if (!parsed.toggleableEffects) {
				parsed.toggleableEffects = {};
			}

			// Ensure activeSpellsAndEffects property exists (migration for older characters)
			if (!parsed.activeSpellsAndEffects) {
				parsed.activeSpellsAndEffects = [];
			}

			// Ensure spellcasting property exists (migration for older characters)
			if (!parsed.spellcasting) {
				parsed.spellcasting = {
					knownSpells: [],
					spellSlots: [],
					focusPoints: { max: 0, current: 0 }
				};
			}

			// Ensure companions property exists (migration for older characters)
			if (!parsed.companions) {
				parsed.companions = {
					familiar: {
						hasFamiliar: false,
						name: 'Familiar',
						type: '',
						abilities: []
					},
					animalCompanion: {
						hasCompanion: false,
						name: 'Companion',
						typeId: '',
						specialization: null
					}
				};
			}

			// Ensure armorProficiency property exists (migration for older characters)
			if (!parsed.armorProficiency) {
				parsed.armorProficiency = {
					unarmored: 1,
					light: 0,
					medium: 0,
					heavy: 0
				};
			}

			// TODO: Add migration logic here if data version changes
			return parsed as Character;
		}
	} catch (error) {
		console.error('Failed to load character from localStorage:', error);
	}

	return createNewCharacter();
}

/**
 * Save character to localStorage
 */
function saveToStorage(character: Character): void {
	if (!browser) return;

	try {
		// Update the updatedAt timestamp
		character.metadata.updatedAt = new Date().toISOString();
		localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
	} catch (error) {
		console.error('Failed to save character to localStorage:', error);
	}
}

/**
 * Create the character store
 */
function createCharacterStore() {
	const { subscribe, set, update } = writable<Character>(loadFromStorage());

	// Auto-save to localStorage on every update
	subscribe((character) => {
		saveToStorage(character);
	});

	return {
		subscribe,
		set,
		update,

		/**
		 * Reset to a new character
		 */
		reset: () => {
			set(createNewCharacter());
		},

		/**
		 * Update character name
		 */
		setName: (name: string) => {
			update((char) => ({ ...char, name }));
		},

		/**
		 * Update character level
		 */
		setLevel: (level: number) => {
			if (level < 1 || level > 20) {
				throw new Error('Level must be between 1 and 20');
			}
			update((char) => ({ ...char, level }));
		},

		/**
		 * Set ancestry
		 */
		setAncestry: (id: string, name: string, heritage: string | null = null) => {
			update((char) => ({
				...char,
				ancestry: { id, name, heritage }
			}));
		},

		/**
		 * Set background
		 */
		setBackground: (id: string, name: string) => {
			update((char) => ({
				...char,
				background: { id, name }
			}));
		},

		/**
		 * Set class
		 */
		setClass: (id: string, name: string, keyAbility: string | null = null) => {
			update((char) => ({
				...char,
				class: { id, name, subclass: null, keyAbility }
			}));
		},

		/**
		 * Update ability score
		 */
		setAbility: (ability: keyof Character['abilities'], value: number) => {
			update((char) => ({
				...char,
				abilities: {
					...char.abilities,
					[ability]: value
				}
			}));
		},

		/**
		 * Update skill proficiency
		 */
		setSkill: (skill: string, rank: number) => {
			if (rank < 0 || rank > 4) {
				throw new Error('Skill rank must be between 0 and 4');
			}
			update((char) => ({
				...char,
				skills: {
					...char.skills,
					[skill]: rank
				}
			}));
		},

		/**
		 * Add a feat
		 */
		addFeat: (
			category: keyof Character['feats'],
			level: number,
			featId: string,
			name: string
		) => {
			update((char) => ({
				...char,
				feats: {
					...char.feats,
					[category]: [...char.feats[category], { level, featId, name }]
				}
			}));
		},

		/**
		 * Remove a feat
		 */
		removeFeat: (category: keyof Character['feats'], featId: string) => {
			update((char) => ({
				...char,
				feats: {
					...char.feats,
					[category]: char.feats[category].filter((f) => f.featId !== featId)
				}
			}));
		},

		/**
		 * Set a rule selection (from ChoiceSet)
		 */
		setRuleSelection: (flag: string, value: string | string[]) => {
			update((char) => ({
				...char,
				ruleSelections: {
					...char.ruleSelections,
					[flag]: value
				}
			}));
		},

		/**
		 * Add an active condition (for predicate evaluation)
		 */
		addCondition: (condition: string) => {
			update((char) => {
				if (!char.activeConditions.includes(condition)) {
					return {
						...char,
						activeConditions: [...char.activeConditions, condition]
					};
				}
				return char;
			});
		},

		/**
		 * Remove an active condition
		 */
		removeCondition: (condition: string) => {
			update((char) => ({
				...char,
				activeConditions: char.activeConditions.filter((c) => c !== condition)
			}));
		},

		/**
		 * Toggle an effect on/off
		 */
		toggleEffect: (effectId: string) => {
			update((char) => ({
				...char,
				toggleableEffects: {
					...char.toggleableEffects,
					[effectId]: !char.toggleableEffects[effectId]
				}
			}));
		},

		/**
		 * Set an effect's enabled state
		 */
		setEffect: (effectId: string, enabled: boolean) => {
			update((char) => ({
				...char,
				toggleableEffects: {
					...char.toggleableEffects,
					[effectId]: enabled
				}
			}));
		},

		/**
		 * Equip armor
		 */
		equipArmor: (itemId: string, name: string) => {
			update((char) => ({
				...char,
				equipment: {
					...char.equipment,
					armor: { itemId, name }
				}
			}));
		},

		/**
		 * Unequip armor
		 */
		unequipArmor: () => {
			update((char) => ({
				...char,
				equipment: {
					...char.equipment,
					armor: null
				}
			}));
		},

		/**
		 * Equip shield
		 */
		equipShield: (itemId: string, name: string) => {
			update((char) => ({
				...char,
				equipment: {
					...char.equipment,
					shield: { itemId, name, raised: false }
				}
			}));
		},

		/**
		 * Unequip shield
		 */
		unequipShield: () => {
			update((char) => ({
				...char,
				equipment: {
					...char.equipment,
					shield: null
				}
			}));
		},

		/**
		 * Toggle shield raised state
		 */
		toggleShieldRaised: () => {
			update((char) => {
				if (!char.equipment.shield) return char;
				const newRaised = !char.equipment.shield.raised;

				// Add or remove shield-raised condition
				const activeConditions = newRaised
					? [...char.activeConditions, 'shield-raised']
					: char.activeConditions.filter((c) => c !== 'shield-raised');

				return {
					...char,
					equipment: {
						...char.equipment,
						shield: {
							...char.equipment.shield,
							raised: newRaised
						}
					},
					activeConditions
				};
			});
		},

		/**
		 * Equip weapon
		 */
		equipWeapon: (itemId: string, name: string) => {
			update((char) => ({
				...char,
				equipment: {
					...char.equipment,
					weapons: [...char.equipment.weapons, { itemId, name, equipped: true }]
				}
			}));
		},

		/**
		 * Unequip weapon
		 */
		unequipWeapon: (itemId: string) => {
			update((char) => ({
				...char,
				equipment: {
					...char.equipment,
					weapons: char.equipment.weapons.filter((w) => w.itemId !== itemId)
				}
			}));
		},

		/**
		 * Equip worn item
		 */
		equipWornItem: (itemId: string, name: string, slot: string) => {
			update((char) => ({
				...char,
				equipment: {
					...char.equipment,
					wornItems: [...char.equipment.wornItems, { itemId, name, slot }]
				}
			}));
		},

		/**
		 * Unequip worn item
		 */
		unequipWornItem: (itemId: string) => {
			update((char) => ({
				...char,
				equipment: {
					...char.equipment,
					wornItems: char.equipment.wornItems.filter((w) => w.itemId !== itemId)
				}
			}));
		},

		/**
		 * Add active spell or effect
		 */
		addSpellOrEffect: (
			id: string,
			name: string,
			type: 'spell' | 'effect',
			rules: any[],
			level?: number
		) => {
			update((char) => ({
				...char,
				activeSpellsAndEffects: [
					...char.activeSpellsAndEffects,
					{ id, name, type, level, rules }
				]
			}));
		},

		/**
		 * Remove active spell or effect
		 */
		removeSpellOrEffect: (id: string) => {
			update((char) => ({
				...char,
				activeSpellsAndEffects: char.activeSpellsAndEffects.filter((s) => s.id !== id)
			}));
		},

		/**
		 * Add a known spell
		 */
		addKnownSpell: (spellId: string) => {
			update((char) => {
				if (!char.spellcasting.knownSpells.includes(spellId)) {
					return {
						...char,
						spellcasting: {
							...char.spellcasting,
							knownSpells: [...char.spellcasting.knownSpells, spellId]
						}
					};
				}
				return char;
			});
		},

		/**
		 * Remove a known spell
		 */
		removeKnownSpell: (spellId: string) => {
			update((char) => ({
				...char,
				spellcasting: {
					...char.spellcasting,
					knownSpells: char.spellcasting.knownSpells.filter((id) => id !== spellId)
				}
			}));
		},

		/**
		 * Set spell slots for a level
		 */
		setSpellSlots: (level: number, total: number) => {
			update((char) => {
				const existingIndex = char.spellcasting.spellSlots.findIndex(
					(slot) => slot.level === level
				);
				const newSlots = [...char.spellcasting.spellSlots];

				if (existingIndex >= 0) {
					newSlots[existingIndex] = { level, total, used: 0 };
				} else {
					newSlots.push({ level, total, used: 0 });
					newSlots.sort((a, b) => a.level - b.level);
				}

				return {
					...char,
					spellcasting: {
						...char.spellcasting,
						spellSlots: newSlots
					}
				};
			});
		},

		/**
		 * Use a spell slot
		 */
		useSpellSlot: (level: number) => {
			update((char) => {
				const slot = char.spellcasting.spellSlots.find((s) => s.level === level);
				if (!slot || slot.used >= slot.total) return char;

				return {
					...char,
					spellcasting: {
						...char.spellcasting,
						spellSlots: char.spellcasting.spellSlots.map((s) =>
							s.level === level ? { ...s, used: s.used + 1 } : s
						)
					}
				};
			});
		},

		/**
		 * Recover a spell slot
		 */
		recoverSpellSlot: (level: number) => {
			update((char) => {
				const slot = char.spellcasting.spellSlots.find((s) => s.level === level);
				if (!slot || slot.used <= 0) return char;

				return {
					...char,
					spellcasting: {
						...char.spellcasting,
						spellSlots: char.spellcasting.spellSlots.map((s) =>
							s.level === level ? { ...s, used: s.used - 1 } : s
						)
					}
				};
			});
		},

		/**
		 * Update spell slot used count
		 */
		updateSpellSlotUsed: (level: number, used: number) => {
			update((char) => {
				const slot = char.spellcasting.spellSlots.find((s) => s.level === level);
				if (!slot) return char;

				return {
					...char,
					spellcasting: {
						...char.spellcasting,
						spellSlots: char.spellcasting.spellSlots.map((s) =>
							s.level === level ? { ...s, used: Math.max(0, Math.min(used, s.total)) } : s
						)
					}
				};
			});
		},

		/**
		 * Recover all spell slots
		 */
		recoverAllSpellSlots: () => {
			update((char) => ({
				...char,
				spellcasting: {
					...char.spellcasting,
					spellSlots: char.spellcasting.spellSlots.map((s) => ({ ...s, used: 0 }))
				}
			}));
		},

		/**
		 * Set focus point maximum
		 */
		setFocusPointMax: (max: number) => {
			update((char) => ({
				...char,
				spellcasting: {
					...char.spellcasting,
					focusPoints: {
						max: Math.max(0, Math.min(max, 3)), // Focus points capped at 3
						current: Math.min(char.spellcasting.focusPoints.current, max)
					}
				}
			}));
		},

		/**
		 * Update current focus points
		 */
		updateFocusPoints: (current: number) => {
			update((char) => ({
				...char,
				spellcasting: {
					...char.spellcasting,
					focusPoints: {
						...char.spellcasting.focusPoints,
						current: Math.max(0, Math.min(current, char.spellcasting.focusPoints.max))
					}
				}
			}));
		},

		/**
		 * Spend a focus point
		 */
		spendFocusPoint: () => {
			update((char) => {
				if (char.spellcasting.focusPoints.current <= 0) return char;

				return {
					...char,
					spellcasting: {
						...char.spellcasting,
						focusPoints: {
							...char.spellcasting.focusPoints,
							current: char.spellcasting.focusPoints.current - 1
						}
					}
				};
			});
		},

		/**
		 * Refocus (restore 1 focus point)
		 */
		refocus: () => {
			update((char) => {
				if (
					char.spellcasting.focusPoints.current >= char.spellcasting.focusPoints.max
				)
					return char;

				return {
					...char,
					spellcasting: {
						...char.spellcasting,
						focusPoints: {
							...char.spellcasting.focusPoints,
							current: char.spellcasting.focusPoints.current + 1
						}
					}
				};
			});
		},

		/**
		 * Full rest (restore all focus points)
		 */
		restoreFocusPoints: () => {
			update((char) => ({
				...char,
				spellcasting: {
					...char.spellcasting,
					focusPoints: {
						...char.spellcasting.focusPoints,
						current: char.spellcasting.focusPoints.max
					}
				}
			}));
		},

		// ====================
		// Inventory Management
		// ====================

		/**
		 * Add an item to inventory
		 */
		addInventoryItem: (itemId: string, name: string, quantity: number = 1) => {
			update((char) => ({
				...char,
				inventory: [
					...char.inventory,
					{
						itemId,
						name,
						quantity: Math.max(1, quantity),
						worn: false,
						invested: false
					}
				]
			}));
		},

		/**
		 * Remove an item from inventory
		 */
		removeInventoryItem: (itemId: string) => {
			update((char) => ({
				...char,
				inventory: char.inventory.filter((item) => item.itemId !== itemId)
			}));
		},

		/**
		 * Update an item's quantity
		 */
		updateItemQuantity: (itemId: string, quantity: number) => {
			update((char) => ({
				...char,
				inventory: char.inventory.map((item) =>
					item.itemId === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
				)
			}));
		},

		/**
		 * Toggle an item's worn status
		 */
		toggleItemWorn: (itemId: string) => {
			update((char) => ({
				...char,
				inventory: char.inventory.map((item) =>
					item.itemId === itemId ? { ...item, worn: !item.worn } : item
				)
			}));
		},

		/**
		 * Toggle an item's invested status
		 */
		toggleItemInvested: (itemId: string) => {
			update((char) => ({
				...char,
				inventory: char.inventory.map((item) =>
					item.itemId === itemId ? { ...item, invested: !item.invested } : item
				)
			}));
		},

		// ====================
		// Wealth Management
		// ====================

		/**
		 * Update wealth values
		 */
		updateWealth: (pp: number = 0, gp: number = 0, sp: number = 0, cp: number = 0) => {
			update((char) => ({
				...char,
				wealth: {
					pp: Math.max(0, pp),
					gp: Math.max(0, gp),
					sp: Math.max(0, sp),
					cp: Math.max(0, cp)
				}
			}));
		},

		/**
		 * Add wealth (can be negative to subtract)
		 */
		addWealth: (pp: number = 0, gp: number = 0, sp: number = 0, cp: number = 0) => {
			update((char) => ({
				...char,
				wealth: {
					pp: Math.max(0, char.wealth.pp + pp),
					gp: Math.max(0, char.wealth.gp + gp),
					sp: Math.max(0, char.wealth.sp + sp),
					cp: Math.max(0, char.wealth.cp + cp)
				}
			}));
		},

		// ====================
		// Companion Management
		// ====================

		/**
		 * Set familiar status
		 */
		setFamiliar: (hasFamiliar: boolean) => {
			update((char) => ({
				...char,
				companions: {
					...char.companions,
					familiar: {
						...char.companions.familiar,
						hasFamiliar
					}
				}
			}));
		},

		/**
		 * Update familiar details
		 */
		updateFamiliar: (name: string, type: string, abilities: string[]) => {
			update((char) => ({
				...char,
				companions: {
					...char.companions,
					familiar: {
						...char.companions.familiar,
						name,
						type,
						abilities
					}
				}
			}));
		},

		/**
		 * Set animal companion status
		 */
		setAnimalCompanion: (hasCompanion: boolean) => {
			update((char) => ({
				...char,
				companions: {
					...char.companions,
					animalCompanion: {
						...char.companions.animalCompanion,
						hasCompanion
					}
				}
			}));
		},

		/**
		 * Update animal companion details
		 */
		updateAnimalCompanion: (
			name: string,
			typeId: string,
			specialization: 'nimble' | 'savage' | null
		) => {
			update((char) => ({
				...char,
				companions: {
					...char.companions,
					animalCompanion: {
						...char.companions.animalCompanion,
						name,
						typeId,
						specialization
					}
				}
			}));
		}
	};
}

/**
 * The global character store
 */
export const character = createCharacterStore();

/**
 * Export character to JSON string
 */
export function exportCharacter(char?: Character): string {
	const toExport = char || get(character);
	return JSON.stringify(toExport, null, 2);
}

/**
 * Export character and download as file
 */
export function downloadCharacter(char?: Character): void {
	if (!browser) return;

	const toExport = char || get(character);
	const json = exportCharacter(toExport);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = `${toExport.name.toLowerCase().replace(/\s+/g, '-')}-${toExport.level}.json`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * Import character from JSON string
 */
export function importCharacter(json: string): Character {
	try {
		const parsed = JSON.parse(json);

		// Validate that it's a character object
		if (!parsed.id || !parsed.name || typeof parsed.level !== 'number') {
			throw new Error('Invalid character data');
		}

		// Update metadata
		parsed.metadata = parsed.metadata || {};
		parsed.metadata.updatedAt = new Date().toISOString();

		// TODO: Add migration logic if needed for older versions

		return parsed as Character;
	} catch (error) {
		throw new Error(`Failed to import character: ${error}`);
	}
}

/**
 * Import character from file
 */
export function importCharacterFromFile(file: File): Promise<Character> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (event) => {
			try {
				const json = event.target?.result as string;
				const character = importCharacter(json);
				resolve(character);
			} catch (error) {
				reject(error);
			}
		};

		reader.onerror = () => {
			reject(new Error('Failed to read file'));
		};

		reader.readAsText(file);
	});
}

/**
 * Load an imported character into the store
 */
export function loadImportedCharacter(importedCharacter: Character): void {
	character.set(importedCharacter);
}

/**
 * Validate character data
 */
export function validateCharacter(char: Character): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!char.name || char.name.trim().length === 0) {
		errors.push('Character name is required');
	}

	if (char.level < 1 || char.level > 20) {
		errors.push('Character level must be between 1 and 20');
	}

	// Validate ability scores (typically 1-30 range in PF2e)
	for (const [ability, value] of Object.entries(char.abilities)) {
		if (value < 1 || value > 30) {
			errors.push(`${ability} score must be between 1 and 30`);
		}
	}

	// Validate skill ranks
	for (const [skill, rank] of Object.entries(char.skills)) {
		if (rank < 0 || rank > 4) {
			errors.push(`${skill} rank must be between 0 and 4`);
		}
	}

	return {
		valid: errors.length === 0,
		errors
	};
}
