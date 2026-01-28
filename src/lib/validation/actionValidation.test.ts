/**
 * Tests for action validation
 */

import { describe, it, expect } from 'vitest';
import { validateActionAvailability, getStatusLabel, getStatusColorClass } from './actionValidation';
import type { Action } from '$lib/data/types/app';
import type { Character } from './types';

// Helper to create a test character
function createTestCharacter(overrides?: Partial<Character>): Character {
	return {
		level: 1,
		abilityScores: {
			str: 10,
			dex: 10,
			con: 10,
			int: 10,
			wis: 10,
			cha: 10
		},
		skills: {
			trained: [],
			expert: [],
			master: [],
			legendary: []
		},
		feats: [],
		classFeatures: [],
		...overrides
	};
}

// Helper to create a test action
function createTestAction(overrides?: Partial<Action>): Action {
	return {
		id: 'test-action',
		name: 'Test Action',
		type: 'action',
		description: 'A test action',
		traits: [],
		rarity: 'common',
		source: {
			title: 'Test',
			license: 'ORC',
			remaster: false
		},
		rules: [],
		actionType: 'action',
		actions: 1,
		...overrides
	};
}

describe('actionValidation', () => {
	describe('validateActionAvailability', () => {
		it('should mark basic actions as available', () => {
			const character = createTestCharacter();
			const action = createTestAction({ name: 'Stride' });

			const result = validateActionAvailability(action, character);

			expect(result.available).toBe(true);
			expect(result.status).toBe('available');
			expect(result.reasons).toHaveLength(0);
		});

		it('should mark skill actions as unavailable if character lacks proficiency', () => {
			const character = createTestCharacter();
			const action = createTestAction({ name: 'Climb' });

			const result = validateActionAvailability(action, character);

			expect(result.available).toBe(false);
			expect(result.status).toBe('unavailable');
			expect(result.reasons).toContain('Requires trained proficiency in Athletics');
		});

		it('should mark skill actions as available if character has proficiency', () => {
			const character = createTestCharacter({
				skills: {
					trained: ['athletics'],
					expert: [],
					master: [],
					legendary: []
				}
			});
			const action = createTestAction({ name: 'Climb' });

			const result = validateActionAvailability(action, character);

			expect(result.available).toBe(true);
			expect(result.status).toBe('available');
			expect(result.reasons).toHaveLength(0);
		});

		it('should allow multi-skill actions if character has ANY required skill', () => {
			const character = createTestCharacter({
				skills: {
					trained: ['arcana'],
					expert: [],
					master: [],
					legendary: []
				}
			});
			const action = createTestAction({ name: 'Recall Knowledge' });

			const result = validateActionAvailability(action, character);

			expect(result.available).toBe(true);
			expect(result.status).toBe('available');
		});

		it('should check requirements text for level requirements', () => {
			const character = createTestCharacter({ level: 3 });
			const action = createTestAction({
				name: 'Test Action',
				requirements: 'You must be level 5'
			});

			const result = validateActionAvailability(action, character);

			expect(result.available).toBe(false);
			expect(result.reasons).toContain('Requires character level 5');
		});

		it('should validate spellcasting requirements', () => {
			const character = createTestCharacter({
				class: { name: 'Fighter' }
			});
			const action = createTestAction({
				name: 'Test Spell Action',
				requirements: 'You must have the spellcasting class feature'
			});

			const result = validateActionAvailability(action, character);

			expect(result.available).toBe(false);
			expect(result.reasons).toContain('Requires spellcasting class feature');
		});

		it('should validate spellcasting requirements for spellcasting classes', () => {
			const character = createTestCharacter({
				class: { name: 'Wizard' }
			});
			const action = createTestAction({
				name: 'Test Spell Action',
				requirements: 'You must have the spellcasting class feature'
			});

			const result = validateActionAvailability(action, character);

			expect(result.available).toBe(true);
		});

		it('should accept expert proficiency for skill actions', () => {
			const character = createTestCharacter({
				skills: {
					trained: [],
					expert: ['stealth'],
					master: [],
					legendary: []
				}
			});
			const action = createTestAction({ name: 'Hide' });

			const result = validateActionAvailability(action, character);

			expect(result.available).toBe(true);
			expect(result.status).toBe('available');
		});

		it('should accept master proficiency for skill actions', () => {
			const character = createTestCharacter({
				skills: {
					trained: [],
					expert: [],
					master: ['athletics'],
					legendary: []
				}
			});
			const action = createTestAction({ name: 'Climb' });

			const result = validateActionAvailability(action, character);

			expect(result.available).toBe(true);
			expect(result.status).toBe('available');
		});

		it('should accept legendary proficiency for skill actions', () => {
			const character = createTestCharacter({
				skills: {
					trained: [],
					expert: [],
					master: [],
					legendary: ['intimidation']
				}
			});
			const action = createTestAction({ name: 'Demoralize' });

			const result = validateActionAvailability(action, character);

			expect(result.available).toBe(true);
			expect(result.status).toBe('available');
		});
	});

	describe('getStatusLabel', () => {
		it('should return correct labels', () => {
			expect(getStatusLabel('available')).toBe('Available');
			expect(getStatusLabel('requirements-not-met')).toBe('Requirements Not Met');
			expect(getStatusLabel('unavailable')).toBe('Unavailable');
		});
	});

	describe('getStatusColorClass', () => {
		it('should return correct CSS classes', () => {
			expect(getStatusColorClass('available')).toBe('status-available');
			expect(getStatusColorClass('requirements-not-met')).toBe('status-requirements');
			expect(getStatusColorClass('unavailable')).toBe('status-unavailable');
		});
	});
});
