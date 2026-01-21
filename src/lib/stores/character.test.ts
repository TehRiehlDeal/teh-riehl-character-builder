import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
	character,
	createNewCharacter,
	exportCharacter,
	importCharacter,
	validateCharacter,
	type Character
} from './character';

// Mock browser environment
vi.stubGlobal('crypto', {
	randomUUID: () => 'test-uuid-123'
});

describe('Character Store', () => {
	beforeEach(() => {
		// Reset store to a new character
		character.reset();
	});

	describe('createNewCharacter', () => {
		it('creates a new character with default values', () => {
			const char = createNewCharacter();

			expect(char.id).toBe('test-uuid-123');
			expect(char.name).toBe('New Character');
			expect(char.level).toBe(1);
			expect(char.xp).toBe(0);
			expect(char.abilities.strength).toBe(10);
			expect(char.ancestry.id).toBeNull();
			expect(char.feats.ancestry).toEqual([]);
		});

		it('includes metadata with timestamps', () => {
			const char = createNewCharacter();

			expect(char.metadata.createdAt).toBeDefined();
			expect(char.metadata.updatedAt).toBeDefined();
			expect(char.metadata.dataVersion).toBe('data-v2026.01.1');
		});
	});

	describe('Character Store Methods', () => {
		it('updates character name', () => {
			character.setName('Valeros');
			const char = get(character);

			expect(char.name).toBe('Valeros');
		});

		it('updates character level', () => {
			character.setLevel(5);
			const char = get(character);

			expect(char.level).toBe(5);
		});

		it('throws error for invalid level', () => {
			expect(() => character.setLevel(0)).toThrow('Level must be between 1 and 20');
			expect(() => character.setLevel(21)).toThrow('Level must be between 1 and 20');
		});

		it('sets ancestry', () => {
			character.setAncestry('human-id', 'Human', 'Versatile Heritage');
			const char = get(character);

			expect(char.ancestry.id).toBe('human-id');
			expect(char.ancestry.name).toBe('Human');
			expect(char.ancestry.heritage).toBe('Versatile Heritage');
		});

		it('sets background', () => {
			character.setBackground('acolyte-id', 'Acolyte');
			const char = get(character);

			expect(char.background.id).toBe('acolyte-id');
			expect(char.background.name).toBe('Acolyte');
		});

		it('sets class', () => {
			character.setClass('fighter-id', 'Fighter', 'Strength');
			const char = get(character);

			expect(char.class.id).toBe('fighter-id');
			expect(char.class.name).toBe('Fighter');
			expect(char.class.keyAbility).toBe('Strength');
		});

		it('updates ability scores', () => {
			character.setAbility('strength', 18);
			character.setAbility('dexterity', 14);
			const char = get(character);

			expect(char.abilities.strength).toBe(18);
			expect(char.abilities.dexterity).toBe(14);
		});

		it('updates skill proficiency', () => {
			character.setSkill('acrobatics', 2); // Expert
			const char = get(character);

			expect(char.skills.acrobatics).toBe(2);
		});

		it('throws error for invalid skill rank', () => {
			expect(() => character.setSkill('acrobatics', -1)).toThrow(
				'Skill rank must be between 0 and 4'
			);
			expect(() => character.setSkill('acrobatics', 5)).toThrow(
				'Skill rank must be between 0 and 4'
			);
		});

		it('adds a feat', () => {
			character.addFeat('ancestry', 1, 'natural-ambition', 'Natural Ambition');
			const char = get(character);

			expect(char.feats.ancestry).toHaveLength(1);
			expect(char.feats.ancestry[0]).toEqual({
				level: 1,
				featId: 'natural-ambition',
				name: 'Natural Ambition'
			});
		});

		it('removes a feat', () => {
			character.addFeat('class', 2, 'power-attack', 'Power Attack');
			character.addFeat('class', 4, 'intimidating-strike', 'Intimidating Strike');
			character.removeFeat('class', 'power-attack');

			const char = get(character);

			expect(char.feats.class).toHaveLength(1);
			expect(char.feats.class[0].featId).toBe('intimidating-strike');
		});

		it('sets rule selections', () => {
			character.setRuleSelection('fighterSkill', 'acrobatics');
			const char = get(character);

			expect(char.ruleSelections.fighterSkill).toBe('acrobatics');
		});
	});

	describe('Export/Import', () => {
		it('exports character to JSON', () => {
			character.setName('Ezren');
			character.setLevel(3);

			const json = exportCharacter();
			const parsed = JSON.parse(json);

			expect(parsed.name).toBe('Ezren');
			expect(parsed.level).toBe(3);
		});

		it('imports character from JSON', () => {
			const testCharacter: Character = {
				...createNewCharacter(),
				name: 'Seoni',
				level: 7
			};

			const json = JSON.stringify(testCharacter);
			const imported = importCharacter(json);

			expect(imported.name).toBe('Seoni');
			expect(imported.level).toBe(7);
		});

		it('throws error for invalid JSON', () => {
			expect(() => importCharacter('invalid json')).toThrow('Failed to import character');
		});

		it('throws error for invalid character data', () => {
			const invalidData = JSON.stringify({ foo: 'bar' });
			expect(() => importCharacter(invalidData)).toThrow('Invalid character data');
		});
	});

	describe('Validation', () => {
		it('validates a valid character', () => {
			const char = createNewCharacter();
			char.name = 'Valid Character';

			const result = validateCharacter(char);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('detects missing name', () => {
			const char = createNewCharacter();
			char.name = '';

			const result = validateCharacter(char);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Character name is required');
		});

		it('detects invalid level', () => {
			const char = createNewCharacter();
			char.level = 25;

			const result = validateCharacter(char);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Character level must be between 1 and 20');
		});

		it('detects invalid ability scores', () => {
			const char = createNewCharacter();
			char.abilities.strength = 50;

			const result = validateCharacter(char);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('strength'))).toBe(true);
		});

		it('detects invalid skill ranks', () => {
			const char = createNewCharacter();
			char.skills.acrobatics = 10;

			const result = validateCharacter(char);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('acrobatics'))).toBe(true);
		});
	});
});
