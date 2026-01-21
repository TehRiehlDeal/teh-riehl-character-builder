/**
 * Automatic Bonus Progression (ABP) Variant Rule
 *
 * Instead of relying on magic items for fundamental bonuses,
 * characters automatically gain inherent bonuses as they level.
 *
 * This module calculates what bonuses are granted at each level
 * and provides modifiers to be applied to the character.
 */

import type { Modifier } from '$lib/engine/models/Modifier';

/**
 * ABP bonus structure for a given level
 */
export interface ABPBonuses {
	/** Item bonus to attack rolls */
	attackBonus: number;
	/** Item bonus to AC */
	acBonus: number;
	/** Item bonus to saves (Fortitude, Reflex, Will) */
	saveBonus: number;
	/** Item bonus to perception */
	perceptionBonus: number;
	/** Number of weapon damage dice (striking) */
	strikingBonus: number; // 0 = base, 1 = +1 die, 2 = +2 dice, 3 = +3 dice
	/** Item bonus to skills (can be distributed) */
	skillPotency: {
		available: number; // How many skill bonuses available
		bonus: number; // The value of the bonus
	};
	/** Apex item equivalent - ability boost at level 17+ */
	abilityApex: boolean;
}

/**
 * Get ABP bonuses for a specific level
 *
 * Based on PF2e CRB Gamemastery Guide, Automatic Bonus Progression variant rule.
 */
export function getABPBonusesForLevel(level: number): ABPBonuses {
	const bonuses: ABPBonuses = {
		attackBonus: 0,
		acBonus: 0,
		saveBonus: 0,
		perceptionBonus: 0,
		strikingBonus: 0,
		skillPotency: {
			available: 0,
			bonus: 0
		},
		abilityApex: false
	};

	// Weapon/Attack Potency: +1 at 2nd, +2 at 10th, +3 at 16th
	if (level >= 16) {
		bonuses.attackBonus = 3;
	} else if (level >= 10) {
		bonuses.attackBonus = 2;
	} else if (level >= 2) {
		bonuses.attackBonus = 1;
	}

	// Armor/AC Potency: +1 at 5th, +2 at 11th, +3 at 18th
	if (level >= 18) {
		bonuses.acBonus = 3;
	} else if (level >= 11) {
		bonuses.acBonus = 2;
	} else if (level >= 5) {
		bonuses.acBonus = 1;
	}

	// Resilient (Saves): +1 at 8th, +2 at 14th, +3 at 20th
	if (level >= 20) {
		bonuses.saveBonus = 3;
	} else if (level >= 14) {
		bonuses.saveBonus = 2;
	} else if (level >= 8) {
		bonuses.saveBonus = 1;
	}

	// Perception Potency: Same as saves
	bonuses.perceptionBonus = bonuses.saveBonus;

	// Striking (Weapon damage dice): +1 die at 4th, +2 dice at 12th, +3 dice at 19th
	if (level >= 19) {
		bonuses.strikingBonus = 3;
	} else if (level >= 12) {
		bonuses.strikingBonus = 2;
	} else if (level >= 4) {
		bonuses.strikingBonus = 1;
	}

	// Skill Potency: Item bonuses to skills
	// 3rd: +1 to one skill
	// 7th: +1 to two more skills (3 total)
	// 15th: +2 to all three skills, +1 to one more skill (4 total)
	if (level >= 15) {
		bonuses.skillPotency = { available: 4, bonus: 2 }; // 3 at +2, 1 at +2
	} else if (level >= 7) {
		bonuses.skillPotency = { available: 3, bonus: 1 };
	} else if (level >= 3) {
		bonuses.skillPotency = { available: 1, bonus: 1 };
	}

	// Ability Apex: Equivalent to apex item (ability boost) at 17th+
	if (level >= 17) {
		bonuses.abilityApex = true;
	}

	return bonuses;
}

/**
 * Generate modifiers for ABP at a given level
 *
 * These modifiers should be added to the character's modifier list.
 * Note: Skill potency requires character-specific selections, so it's
 * handled separately (not included in this auto-generated list).
 */
export function generateABPModifiers(level: number): Modifier[] {
	const bonuses = getABPBonusesForLevel(level);
	const modifiers: Modifier[] = [];

	// Attack bonus
	if (bonuses.attackBonus > 0) {
		modifiers.push({
			label: `Automatic Bonus Progression (Weapon Potency)`,
			source: 'Automatic Bonus Progression',
			value: bonuses.attackBonus,
			type: 'item',
			selector: 'attack'
		});
	}

	// AC bonus
	if (bonuses.acBonus > 0) {
		modifiers.push({
			label: `Automatic Bonus Progression (Armor Potency)`,
			source: 'Automatic Bonus Progression',
			value: bonuses.acBonus,
			type: 'item',
			selector: 'ac'
		});
	}

	// Save bonuses (Resilient)
	if (bonuses.saveBonus > 0) {
		['fortitude', 'reflex', 'will'].forEach((save) => {
			modifiers.push({
				label: `Automatic Bonus Progression (Resilient)`,
				source: 'Automatic Bonus Progression',
				value: bonuses.saveBonus,
				type: 'item',
				selector: save
			});
		});
	}

	// Perception bonus
	if (bonuses.perceptionBonus > 0) {
		modifiers.push({
			label: `Automatic Bonus Progression (Perception)`,
			source: 'Automatic Bonus Progression',
			value: bonuses.perceptionBonus,
			type: 'item',
			selector: 'perception'
		});
	}

	return modifiers;
}

/**
 * Get skill potency selections for ABP
 *
 * Returns information about how many skills can have potency bonuses.
 * The character must select which skills to apply these to.
 */
export interface SkillPotencySelection {
	level: number;
	skillsAvailable: number; // How many skills can have bonuses
	bonusValue: number; // The value of the bonus (+1, +2, etc.)
}

/**
 * Get all skill potency selections up to a given level
 */
export function getSkillPotencySelections(level: number): SkillPotencySelection[] {
	const selections: SkillPotencySelection[] = [];

	if (level >= 15) {
		selections.push({
			level: 15,
			skillsAvailable: 4,
			bonusValue: 2
		});
	} else if (level >= 7) {
		selections.push({
			level: 7,
			skillsAvailable: 3,
			bonusValue: 1
		});
	} else if (level >= 3) {
		selections.push({
			level: 3,
			skillsAvailable: 1,
			bonusValue: 1
		});
	}

	return selections;
}

/**
 * Generate modifiers for selected skill potencies
 *
 * @param level Character level
 * @param selectedSkills Array of skill names that have potency bonuses
 */
export function generateSkillPotencyModifiers(level: number, selectedSkills: string[]): Modifier[] {
	const bonuses = getABPBonusesForLevel(level);
	const modifiers: Modifier[] = [];

	if (bonuses.skillPotency.bonus === 0) {
		return modifiers;
	}

	// Validate selection count
	const maxSkills = bonuses.skillPotency.available;
	const skills = selectedSkills.slice(0, maxSkills);

	for (const skill of skills) {
		modifiers.push({
			label: `Automatic Bonus Progression (Skill Potency)`,
			source: 'Automatic Bonus Progression',
			value: bonuses.skillPotency.bonus,
			type: 'item',
			selector: `skill-${skill.toLowerCase()}`
		});
	}

	return modifiers;
}

/**
 * Check if character should have ability apex at this level
 */
export function hasAbilityApex(level: number): boolean {
	return level >= 17;
}

/**
 * Get a summary of ABP bonuses for display
 */
export function getABPSummary(level: number): string[] {
	const bonuses = getABPBonusesForLevel(level);
	const summary: string[] = [];

	if (bonuses.attackBonus > 0) {
		summary.push(`+${bonuses.attackBonus} item bonus to attack rolls`);
	}

	if (bonuses.acBonus > 0) {
		summary.push(`+${bonuses.acBonus} item bonus to AC`);
	}

	if (bonuses.saveBonus > 0) {
		summary.push(`+${bonuses.saveBonus} item bonus to all saves`);
	}

	if (bonuses.perceptionBonus > 0) {
		summary.push(`+${bonuses.perceptionBonus} item bonus to Perception`);
	}

	if (bonuses.strikingBonus > 0) {
		summary.push(`+${bonuses.strikingBonus} weapon damage ${bonuses.strikingBonus === 1 ? 'die' : 'dice'}`);
	}

	if (bonuses.skillPotency.available > 0) {
		summary.push(
			`+${bonuses.skillPotency.bonus} item bonus to ${bonuses.skillPotency.available} selected ${bonuses.skillPotency.available === 1 ? 'skill' : 'skills'}`
		);
	}

	if (bonuses.abilityApex) {
		summary.push(`Ability apex (one ability score increases to 18 if lower)`);
	}

	return summary;
}
