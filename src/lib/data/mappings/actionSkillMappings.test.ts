/**
 * Tests for action skill mappings
 */

import { describe, it, expect } from 'vitest';
import {
	getActionSkills,
	isBasicAction,
	isSkillAction,
	getAllSkills,
	ACTION_SKILL_MAP
} from './actionSkillMappings';

describe('actionSkillMappings', () => {
	describe('getActionSkills', () => {
		it('should return empty array for basic actions', () => {
			expect(getActionSkills('Stride')).toEqual([]);
			expect(getActionSkills('Step')).toEqual([]);
			expect(getActionSkills('Interact')).toEqual([]);
		});

		it('should return skill array for skill actions', () => {
			expect(getActionSkills('Climb')).toEqual(['athletics']);
			expect(getActionSkills('Hide')).toEqual(['stealth']);
			expect(getActionSkills('Demoralize')).toEqual(['intimidation']);
		});

		it('should return multiple skills for multi-skill actions', () => {
			const recallKnowledge = getActionSkills('Recall Knowledge');
			expect(recallKnowledge).toContain('arcana');
			expect(recallKnowledge).toContain('nature');
			expect(recallKnowledge).toContain('occultism');
			expect(recallKnowledge).toContain('religion');
			expect(recallKnowledge).toContain('society');
		});

		it('should return empty array for unknown actions', () => {
			expect(getActionSkills('Unknown Action')).toEqual([]);
		});
	});

	describe('isBasicAction', () => {
		it('should return true for basic actions', () => {
			expect(isBasicAction('Stride')).toBe(true);
			expect(isBasicAction('Interact')).toBe(true);
			expect(isBasicAction('Seek')).toBe(true);
		});

		it('should return false for skill actions', () => {
			expect(isBasicAction('Climb')).toBe(false);
			expect(isBasicAction('Hide')).toBe(false);
			expect(isBasicAction('Demoralize')).toBe(false);
		});

		it('should return true for unknown actions (default to basic)', () => {
			expect(isBasicAction('Unknown Action')).toBe(true);
		});
	});

	describe('isSkillAction', () => {
		it('should return true for skill actions', () => {
			expect(isSkillAction('Climb')).toBe(true);
			expect(isSkillAction('Hide')).toBe(true);
			expect(isSkillAction('Demoralize')).toBe(true);
		});

		it('should return false for basic actions', () => {
			expect(isSkillAction('Stride')).toBe(false);
			expect(isSkillAction('Interact')).toBe(false);
			expect(isSkillAction('Seek')).toBe(false);
		});

		it('should return false for unknown actions', () => {
			expect(isSkillAction('Unknown Action')).toBe(false);
		});
	});

	describe('getAllSkills', () => {
		it('should return all unique skills', () => {
			const skills = getAllSkills();
			expect(skills).toContain('acrobatics');
			expect(skills).toContain('arcana');
			expect(skills).toContain('athletics');
			expect(skills).toContain('crafting');
			expect(skills).toContain('deception');
			expect(skills).toContain('diplomacy');
			expect(skills).toContain('intimidation');
			expect(skills).toContain('medicine');
			expect(skills).toContain('nature');
			expect(skills).toContain('occultism');
			expect(skills).toContain('performance');
			expect(skills).toContain('religion');
			expect(skills).toContain('society');
			expect(skills).toContain('stealth');
			expect(skills).toContain('survival');
			expect(skills).toContain('thievery');
		});

		it('should return skills in sorted order', () => {
			const skills = getAllSkills();
			const sorted = [...skills].sort();
			expect(skills).toEqual(sorted);
		});

		it('should not contain duplicates', () => {
			const skills = getAllSkills();
			const unique = Array.from(new Set(skills));
			expect(skills).toEqual(unique);
		});
	});

	describe('ACTION_SKILL_MAP', () => {
		it('should have entries for all defined actions', () => {
			expect(Object.keys(ACTION_SKILL_MAP).length).toBeGreaterThan(0);
		});

		it('should have 26 basic actions', () => {
			const basicActions = Object.entries(ACTION_SKILL_MAP).filter(
				([, skills]) => skills.length === 0
			);
			expect(basicActions.length).toBe(26);
		});

		it('should have skill actions with at least one skill', () => {
			const skillActions = Object.entries(ACTION_SKILL_MAP).filter(
				([, skills]) => skills.length > 0
			);
			expect(skillActions.length).toBeGreaterThan(0);

			// Each skill action should have at least one skill
			skillActions.forEach(([name, skills]) => {
				expect(skills.length).toBeGreaterThan(0);
			});
		});

		it('should not have duplicate action names', () => {
			const names = Object.keys(ACTION_SKILL_MAP);
			const unique = Array.from(new Set(names));
			expect(names.length).toBe(unique.length);
		});
	});
});
