/**
 * Feat slot calculation utilities that consider variant rules
 */

import type { VariantRules } from '$lib/stores/settings';

export interface FeatSlots {
	classFeat: boolean;
	ancestryFeat: boolean;
	skillFeat: boolean;
	generalFeat: boolean;
	freeArchetypeFeat?: boolean; // Free Archetype variant rule
}

/**
 * Calculate feat slots for a given level considering variant rules
 */
export function getFeatSlotsForLevel(level: number, variantRules?: VariantRules): FeatSlots {
	const slots: FeatSlots = {
		classFeat: false,
		ancestryFeat: false,
		skillFeat: false,
		generalFeat: false
	};

	// Class feats: 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20
	if (level === 1 || (level >= 2 && level % 2 === 0)) {
		slots.classFeat = true;
	}

	// Ancestry feats: 1, 5, 9, 13, 17
	if (level === 1 || (level >= 5 && (level - 1) % 4 === 0)) {
		slots.ancestryFeat = true;
	}

	// Skill feats: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20
	if (level >= 2 && level % 2 === 0) {
		slots.skillFeat = true;
	}

	// General feats: 3, 7, 11, 15, 19
	if (level >= 3 && (level - 3) % 4 === 0) {
		slots.generalFeat = true;
	}

	// Free Archetype: Additional class feat at even levels (2, 4, 6, etc.) restricted to archetype feats
	if (variantRules?.freeArchetype && level >= 2 && level % 2 === 0) {
		slots.freeArchetypeFeat = true;
	}

	return slots;
}

/**
 * Get ability boost schedule considering variant rules
 */
export function getAbilityBoostLevels(variantRules?: VariantRules): number[] {
	if (variantRules?.gradualAbilityBoosts) {
		// Gradual: 1 boost at each of these levels (4 sets of 4 = 16 total)
		// Set 1: 2, 3, 4, 5
		// Set 2: 7, 8, 9, 10
		// Set 3: 12, 13, 14, 15
		// Set 4: 17, 18, 19, 20
		return [2, 3, 4, 5, 7, 8, 9, 10, 12, 13, 14, 15, 17, 18, 19, 20];
	} else {
		// Standard: 4 boosts at each of these levels (4×4 = 16 total)
		return [5, 10, 15, 20];
	}
}

/**
 * Get number of ability boosts at a given level
 */
export function getAbilityBoostCount(level: number, variantRules?: VariantRules): number {
	const boostLevels = getAbilityBoostLevels(variantRules);

	if (!boostLevels.includes(level)) {
		return 0;
	}

	// Gradual gives 1 boost per level, Standard gives 4 per level
	return variantRules?.gradualAbilityBoosts ? 1 : 4;
}

/**
 * Check if a level grants skill increases
 */
export function hasSkillIncrease(level: number): boolean {
	// Skill increases at odd levels starting from 3
	return level >= 3 && level % 2 === 1;
}

/**
 * Class feature reference
 */
export interface ClassFeatureRef {
	name: string;
	uuid: string;
	hasChoice?: boolean; // Whether this class feature requires a choice
	choiceFlag?: string; // The flag name for storing the choice (e.g., "researchField")
}

/**
 * Get complete progression data for a level
 */
export interface LevelProgression {
	level: number;
	featSlots: FeatSlots;
	abilityBoosts: number;
	skillIncrease: boolean;
	features: string[];
	classFeatures: ClassFeatureRef[]; // Class features gained at this level
}

/**
 * Generate progression data for a level
 */
export function getLevelProgression(
	level: number,
	variantRules?: VariantRules,
	allClassFeatures?: Array<{ level: number; name: string; uuid: string }>
): LevelProgression {
	const featSlots = getFeatSlotsForLevel(level, variantRules);
	const abilityBoosts = getAbilityBoostCount(level, variantRules);
	const skillIncrease = hasSkillIncrease(level);

	// Build feature list
	const features: string[] = [];

	if (level === 1) {
		features.push('Background skill', 'Ancestry feat', 'Class feat');
	}

	if (featSlots.classFeat && level > 1) {
		features.push('Class feat');
	}

	if (featSlots.freeArchetypeFeat) {
		features.push('Free Archetype feat');
	}

	if (featSlots.ancestryFeat && level > 1) {
		features.push('Ancestry feat');
	}

	if (featSlots.skillFeat) {
		features.push('Skill feat');
	}

	if (featSlots.generalFeat) {
		features.push('General feat');
	}

	if (abilityBoosts > 0) {
		features.push(`Ability boosts (${abilityBoosts})`);
	}

	if (skillIncrease) {
		features.push('Skill increase');
	}

	// Extract class features for this level
	const classFeatures: ClassFeatureRef[] = allClassFeatures
		? allClassFeatures.filter((cf) => cf.level === level).map((cf) => ({
				name: cf.name,
				uuid: cf.uuid
		  }))
		: [];

	return {
		level,
		featSlots,
		abilityBoosts,
		skillIncrease,
		features,
		classFeatures
	};
}
