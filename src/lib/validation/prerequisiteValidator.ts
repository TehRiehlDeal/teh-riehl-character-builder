/**
 * Prerequisite validation system for PF2e Character Builder
 */

import type {
	Character,
	Prerequisite,
	ValidationResult,
	ValidationError,
	VariantRules,
	FeatSlotContext
} from './types';

/**
 * Validates if a character meets all prerequisites
 */
export function validatePrerequisites(
	prerequisites: Prerequisite[],
	character: Character,
	variantRules?: VariantRules,
	slotContext?: FeatSlotContext,
	currentFeatTraits?: string[]
): ValidationResult {
	const errors: ValidationError[] = [];

	for (const prerequisite of prerequisites) {
		const error = validatePrerequisite(prerequisite, character, variantRules, slotContext, currentFeatTraits);
		if (error) {
			errors.push(error);
		}
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Validates a single prerequisite
 */
function validatePrerequisite(
	prerequisite: Prerequisite,
	character: Character,
	variantRules?: VariantRules,
	slotContext?: FeatSlotContext,
	currentFeatTraits?: string[]
): ValidationError | null {
	switch (prerequisite.type) {
		case 'level':
			return validateLevelPrerequisite(prerequisite, character);
		case 'ability':
			return validateAbilityPrerequisite(prerequisite, character);
		case 'skill':
			return validateSkillPrerequisite(prerequisite, character);
		case 'feat':
			return validateFeatPrerequisite(prerequisite, character, variantRules, slotContext, currentFeatTraits);
		case 'class':
			return validateClassPrerequisite(prerequisite, character);
		case 'ancestry':
			return validateAncestryPrerequisite(prerequisite, character);
		case 'proficiency':
			return validateProficiencyPrerequisite(prerequisite, character);
		default:
			return null;
	}
}

/**
 * Validate level requirement
 */
function validateLevelPrerequisite(
	prerequisite: { type: 'level'; value: number },
	character: Character
): ValidationError | null {
	if (character.level < prerequisite.value) {
		return {
			type: 'level',
			message: `Requires level ${prerequisite.value} (you are level ${character.level})`,
			prerequisite
		};
	}
	return null;
}

/**
 * Validate ability score requirement
 */
function validateAbilityPrerequisite(
	prerequisite: { type: 'ability'; ability: string; value: number },
	character: Character
): ValidationError | null {
	const score = character.abilityScores[prerequisite.ability] || 10;
	if (score < prerequisite.value) {
		return {
			type: 'ability',
			message: `Requires ${prerequisite.ability} ${prerequisite.value} (you have ${score})`,
			prerequisite
		};
	}
	return null;
}

/**
 * Validate skill proficiency requirement
 */
function validateSkillPrerequisite(
	prerequisite: { type: 'skill'; skill: string; rank: 'trained' | 'expert' | 'master' | 'legendary' },
	character: Character
): ValidationError | null {
	const rankHierarchy = ['untrained', 'trained', 'expert', 'master', 'legendary'];
	const requiredRankIndex = rankHierarchy.indexOf(prerequisite.rank);

	// Find the character's current rank in this skill
	let currentRankIndex = 0; // untrained
	if (character.skills.legendary.includes(prerequisite.skill)) {
		currentRankIndex = 4;
	} else if (character.skills.master.includes(prerequisite.skill)) {
		currentRankIndex = 3;
	} else if (character.skills.expert.includes(prerequisite.skill)) {
		currentRankIndex = 2;
	} else if (character.skills.trained.includes(prerequisite.skill)) {
		currentRankIndex = 1;
	}

	if (currentRankIndex < requiredRankIndex) {
		return {
			type: 'skill',
			message: `Requires ${prerequisite.rank} in ${prerequisite.skill} (you have ${rankHierarchy[currentRankIndex]})`,
			prerequisite
		};
	}
	return null;
}

/**
 * Validate feat prerequisite
 */
function validateFeatPrerequisite(
	prerequisite: { type: 'feat'; feat: string },
	character: Character,
	variantRules?: VariantRules,
	slotContext?: FeatSlotContext,
	currentFeatTraits?: string[]
): ValidationError | null {
	// Free Archetype waiver: If using Free Archetype variant rule and selecting a dedication feat
	// in a Free Archetype slot, waive prerequisites for other dedication feats
	const isDedicationFeat = currentFeatTraits?.includes('dedication') || currentFeatTraits?.includes('Dedication');
	const isCheckingForDedication = prerequisite.feat.toLowerCase().includes('dedication');
	const isFreeArchetypeSlot = slotContext === 'freeArchetype';
	const freeArchetypeActive = variantRules?.freeArchetype === true;

	if (isDedicationFeat && isCheckingForDedication && isFreeArchetypeSlot && freeArchetypeActive) {
		// Waive this prerequisite - Free Archetype allows multiple dedications without prerequisites
		return null;
	}

	if (!character.feats.includes(prerequisite.feat)) {
		return {
			type: 'feat',
			message: `Requires ${prerequisite.feat} feat`,
			prerequisite
		};
	}
	return null;
}

/**
 * Validate class requirement
 */
function validateClassPrerequisite(
	prerequisite: { type: 'class'; class: string },
	character: Character
): ValidationError | null {
	if (character.class?.name !== prerequisite.class) {
		return {
			type: 'class',
			message: `Requires ${prerequisite.class} class (you are ${character.class?.name || 'no class'})`,
			prerequisite
		};
	}
	return null;
}

/**
 * Validate ancestry requirement
 */
function validateAncestryPrerequisite(
	prerequisite: { type: 'ancestry'; ancestry: string },
	character: Character
): ValidationError | null {
	if (character.ancestry?.name !== prerequisite.ancestry) {
		return {
			type: 'ancestry',
			message: `Requires ${prerequisite.ancestry} ancestry (you are ${character.ancestry?.name || 'no ancestry'})`,
			prerequisite
		};
	}
	return null;
}

/**
 * Validate proficiency requirement (weapon, armor, spell)
 */
function validateProficiencyPrerequisite(
	prerequisite: {
		type: 'proficiency';
		proficiencyType: 'weapon' | 'armor' | 'spell';
		proficiency: string;
		rank: 'trained' | 'expert' | 'master' | 'legendary';
	},
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_character: Character
): ValidationError | null {
	// For MVP, we'll just return a generic message
	// In a full implementation, we'd check character.proficiencies[prerequisite.proficiencyType]
	return {
		type: 'proficiency',
		message: `Requires ${prerequisite.rank} in ${prerequisite.proficiency} (${prerequisite.proficiencyType})`,
		prerequisite
	};
}

/**
 * Helper to check if a character can select a specific feat
 */
export function canSelectFeat(
	featPrerequisites: Prerequisite[],
	character: Character,
	variantRules?: VariantRules,
	slotContext?: FeatSlotContext,
	currentFeatTraits?: string[]
): ValidationResult {
	return validatePrerequisites(featPrerequisites, character, variantRules, slotContext, currentFeatTraits);
}

/**
 * Get human-readable prerequisite description
 */
export function getPrerequisiteDescription(prerequisite: Prerequisite): string {
	switch (prerequisite.type) {
		case 'level':
			return `Level ${prerequisite.value}`;
		case 'ability':
			return `${prerequisite.ability} ${prerequisite.value}`;
		case 'skill':
			return `${prerequisite.rank} in ${prerequisite.skill}`;
		case 'feat':
			return prerequisite.feat;
		case 'class':
			return `${prerequisite.class} class`;
		case 'ancestry':
			return `${prerequisite.ancestry} ancestry`;
		case 'proficiency':
			return `${prerequisite.rank} in ${prerequisite.proficiency}`;
		default:
			return 'Unknown prerequisite';
	}
}

/**
 * Get all prerequisites as human-readable list
 */
export function getPrerequisitesDescription(prerequisites: Prerequisite[]): string {
	if (prerequisites.length === 0) {
		return 'None';
	}
	return prerequisites.map(getPrerequisiteDescription).join(', ');
}
