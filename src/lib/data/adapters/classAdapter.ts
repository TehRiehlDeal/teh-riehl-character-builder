/**
 * Class Adapter
 *
 * Transforms Foundry VTT PF2e class data into our application schema.
 *
 * Transformation Notes (Apache 2.0 requirement):
 * - Foundry's `_id` is mapped to our `id`
 * - Proficiency values (0-4) are mapped directly (untrained, trained, expert, master, legendary)
 * - `items` object contains class features by level - excluded from schema (features loaded separately)
 * - `ancestryFeatLevels`, `classFeatLevels`, etc. arrays are mapped to our featSlots structure
 * - Foundry-specific fields like `folder`, `img`, `spellcasting` are excluded
 */

import type { FoundryClass } from '../types/foundry';
import type { Class, ProficiencyRank } from '../types/app';

/**
 * Transform a Foundry class into our app schema
 */
export function adaptClass(foundryClass: FoundryClass): Class {
	return {
		type: 'class',
		id: foundryClass._id,
		name: foundryClass.name,
		description: foundryClass.system.description.value,
		hp: foundryClass.system.hp,
		keyAbility: foundryClass.system.keyAbility.value,
		proficiencies: {
			perception: foundryClass.system.perception as ProficiencyRank,
			fortitude: foundryClass.system.savingThrows.fortitude as ProficiencyRank,
			reflex: foundryClass.system.savingThrows.reflex as ProficiencyRank,
			will: foundryClass.system.savingThrows.will as ProficiencyRank,
			classDC: 1 as ProficiencyRank, // All classes start with trained class DC
			attacks: {
				simple: foundryClass.system.attacks.simple as ProficiencyRank,
				martial: foundryClass.system.attacks.martial as ProficiencyRank,
				advanced: foundryClass.system.attacks.advanced as ProficiencyRank,
				unarmed: foundryClass.system.attacks.unarmed as ProficiencyRank
			},
			defenses: {
				unarmored: foundryClass.system.defenses.unarmored as ProficiencyRank,
				light: foundryClass.system.defenses.light as ProficiencyRank,
				medium: foundryClass.system.defenses.medium as ProficiencyRank,
				heavy: foundryClass.system.defenses.heavy as ProficiencyRank
			}
		},
		skills: {
			trained: foundryClass.system.trainedSkills.value,
			additional: foundryClass.system.trainedSkills.additional
		},
		featSlots: {
			ancestry: foundryClass.system.ancestryFeatLevels.value,
			class: foundryClass.system.classFeatLevels.value,
			general: foundryClass.system.generalFeatLevels.value,
			skill: foundryClass.system.skillFeatLevels.value
		},
		traits: foundryClass.system.traits.value,
		rarity: foundryClass.system.traits.rarity,
		source: {
			title: foundryClass.system.publication.title,
			license: foundryClass.system.publication.license,
			remaster: foundryClass.system.publication.remaster
		},
		rules: foundryClass.system.rules
	};
}

/**
 * Adapt multiple classes at once
 */
export function adaptClasses(foundryClasses: FoundryClass[]): Class[] {
	return foundryClasses.map(adaptClass);
}

/**
 * Get total feat slots by level
 */
export function getFeatSlotsAtLevel(classData: Class, level: number): {
	ancestry: boolean;
	class: boolean;
	general: boolean;
	skill: boolean;
} {
	return {
		ancestry: classData.featSlots.ancestry.includes(level),
		class: classData.featSlots.class.includes(level),
		general: classData.featSlots.general.includes(level),
		skill: classData.featSlots.skill.includes(level)
	};
}

/**
 * Get total number of trained skills available
 */
export function getTotalTrainedSkills(classData: Class): number {
	return classData.skills.trained.length + classData.skills.additional;
}

/**
 * Check if class can use a specific armor proficiency
 */
export function hasArmorProficiency(
	classData: Class,
	armorType: 'unarmored' | 'light' | 'medium' | 'heavy'
): boolean {
	return classData.proficiencies.defenses[armorType] > 0;
}
