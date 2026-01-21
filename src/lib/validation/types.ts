/**
 * Validation types for prerequisite checking
 */

export interface Character {
	level: number;
	abilityScores: Record<string, number>;
	skills: {
		trained: string[];
		expert: string[];
		master: string[];
		legendary: string[];
	};
	feats: string[];
	class?: {
		name: string;
	};
	ancestry?: {
		name: string;
	};
}

/**
 * Prerequisite types
 */
export type PrerequisiteType =
	| 'level'
	| 'ability'
	| 'skill'
	| 'feat'
	| 'class'
	| 'ancestry'
	| 'proficiency';

export interface LevelPrerequisite {
	type: 'level';
	value: number;
}

export interface AbilityPrerequisite {
	type: 'ability';
	ability: string;
	value: number;
}

export interface SkillPrerequisite {
	type: 'skill';
	skill: string;
	rank: 'trained' | 'expert' | 'master' | 'legendary';
}

export interface FeatPrerequisite {
	type: 'feat';
	feat: string;
}

export interface ClassPrerequisite {
	type: 'class';
	class: string;
}

export interface AncestryPrerequisite {
	type: 'ancestry';
	ancestry: string;
}

export interface ProficiencyPrerequisite {
	type: 'proficiency';
	proficiencyType: 'weapon' | 'armor' | 'spell';
	proficiency: string;
	rank: 'trained' | 'expert' | 'master' | 'legendary';
}

export type Prerequisite =
	| LevelPrerequisite
	| AbilityPrerequisite
	| SkillPrerequisite
	| FeatPrerequisite
	| ClassPrerequisite
	| AncestryPrerequisite
	| ProficiencyPrerequisite;

/**
 * Validation result
 */
export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
}

export interface ValidationError {
	type: PrerequisiteType;
	message: string;
	prerequisite: Prerequisite;
}

/**
 * Variant rules that may modify validation
 */
export interface VariantRules {
	freeArchetype: boolean;
	gradualAbilityBoosts: boolean;
	automaticBonusProgression: boolean;
	dualClass: boolean;
}

/**
 * Context for feat slot to determine special validation rules
 */
export type FeatSlotContext = 'normal' | 'freeArchetype';
