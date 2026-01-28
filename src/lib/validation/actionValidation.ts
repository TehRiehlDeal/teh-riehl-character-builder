/**
 * Action Validation
 *
 * Validates whether a character can use an action based on:
 * - Skill proficiency requirements
 * - Requirements text parsing
 * - Trait-based restrictions
 */

import type { Action } from '$lib/data/types/app';
import type { Character } from './types';
import { getActionSkills } from '$lib/data/mappings/actionSkillMappings';

export interface ActionAvailability {
	available: boolean;
	reasons: string[];
	status: 'available' | 'requirements-not-met' | 'unavailable';
}

/**
 * Validate if a character can use an action
 */
export function validateActionAvailability(
	action: Action,
	character: Character
): ActionAvailability {
	const reasons: string[] = [];
	let available = true;

	// Check skill proficiency requirement
	const requiredSkills = getActionSkills(action.name);
	if (requiredSkills.length > 0) {
		const hasProficiency = checkSkillProficiency(requiredSkills, character);
		if (!hasProficiency) {
			available = false;
			if (requiredSkills.length === 1) {
				reasons.push(`Requires trained proficiency in ${capitalizeSkill(requiredSkills[0])}`);
			} else {
				const skillList = requiredSkills.map(capitalizeSkill).join(', ');
				reasons.push(`Requires trained proficiency in at least one of: ${skillList}`);
			}
		}
	}

	// Parse requirements text if present
	if (action.requirements) {
		const requirementCheck = parseRequirements(action.requirements, character);
		if (!requirementCheck.met) {
			available = false;
			reasons.push(...requirementCheck.reasons);
		}
	}

	// Determine status
	let status: 'available' | 'requirements-not-met' | 'unavailable';
	if (available) {
		status = 'available';
	} else if (requiredSkills.length > 0 && !checkSkillProficiency(requiredSkills, character)) {
		// Missing skill proficiency = truly unavailable (can't easily obtain mid-level)
		status = 'unavailable';
	} else {
		// Missing other requirements = could potentially be obtained
		status = 'requirements-not-met';
	}

	return {
		available,
		reasons,
		status
	};
}

/**
 * Check if character has proficiency in at least one of the required skills
 */
function checkSkillProficiency(skills: string[], character: Character): boolean {
	if (skills.length === 0) return true; // No skill requirement

	return skills.some((skill) => {
		// Check trained or higher
		return (
			character.skills.trained.includes(skill) ||
			character.skills.expert.includes(skill) ||
			character.skills.master.includes(skill) ||
			character.skills.legendary.includes(skill)
		);
	});
}

/**
 * Parse requirements text and check if character meets them
 */
function parseRequirements(
	requirementsText: string,
	character: Character
): { met: boolean; reasons: string[] } {
	const reasons: string[] = [];
	let met = true;

	const lowerText = requirementsText.toLowerCase();

	// Check for common patterns
	// "You have at least one free hand" - can't validate without character state
	if (lowerText.includes('free hand') || lowerText.includes('one hand')) {
		// Assume met - this requires runtime state tracking
		// Future enhancement: check equipped items
	}

	// "trained in [skill]" - already handled by skill mapping
	// But might appear in requirements text for edge cases
	const trainedMatch = lowerText.match(/trained in (\w+)/);
	if (trainedMatch) {
		const skill = trainedMatch[1];
		if (!checkSkillProficiency([skill], character)) {
			met = false;
			reasons.push(`Requires trained proficiency in ${capitalizeSkill(skill)}`);
		}
	}

	// "spellcasting class feature" or similar class feature requirements
	if (lowerText.includes('spellcasting')) {
		// Check if character has spellcasting feature
		// This would require checking class features from character data
		// For now, assume met if character has a spellcasting class
		const spellcastingClasses = [
			'wizard',
			'sorcerer',
			'cleric',
			'druid',
			'bard',
			'witch',
			'oracle',
			'magus',
			'summoner'
		];
		if (
			character.class &&
			!spellcastingClasses.includes(character.class.name.toLowerCase())
		) {
			met = false;
			reasons.push('Requires spellcasting class feature');
		}
	}

	// Level requirements (rare but possible)
	const levelMatch = requirementsText.match(/level (\d+)/i);
	if (levelMatch) {
		const requiredLevel = parseInt(levelMatch[1], 10);
		if (character.level < requiredLevel) {
			met = false;
			reasons.push(`Requires character level ${requiredLevel}`);
		}
	}

	// If no specific requirements parsed and text exists, add generic message
	if (met && requirementsText.trim().length > 0 && reasons.length === 0) {
		// Requirements exist but we couldn't parse them - assume met for now
		// This handles edge cases like "You have a shield raised"
	}

	return { met, reasons };
}

/**
 * Capitalize skill name for display
 */
function capitalizeSkill(skill: string): string {
	// Handle special cases
	if (skill === 'lore') return 'Lore';

	// Capitalize first letter of each word
	return skill
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * Get a user-friendly status label
 */
export function getStatusLabel(status: 'available' | 'requirements-not-met' | 'unavailable'): string {
	switch (status) {
		case 'available':
			return 'Available';
		case 'requirements-not-met':
			return 'Requirements Not Met';
		case 'unavailable':
			return 'Unavailable';
	}
}

/**
 * Get status badge color class
 */
export function getStatusColorClass(
	status: 'available' | 'requirements-not-met' | 'unavailable'
): string {
	switch (status) {
		case 'available':
			return 'status-available';
		case 'requirements-not-met':
			return 'status-requirements';
		case 'unavailable':
			return 'status-unavailable';
	}
}
