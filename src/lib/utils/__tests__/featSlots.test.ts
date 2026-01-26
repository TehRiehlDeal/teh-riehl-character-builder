/**
 * Tests for Feat Slot Calculations
 */

import { describe, it, expect } from 'vitest';
import {
	getFeatSlotsForLevel,
	getAbilityBoostLevels,
	getAbilityBoostCount,
	hasSkillIncrease,
	getLevelProgression,
	type FeatSlots
} from '../featSlots';
import type { VariantRules } from '$lib/stores/settings';

describe('Feat Slots', () => {
	describe('getFeatSlotsForLevel()', () => {
		// Test matrix for standard rules
		const standardTests: Array<{
			level: number;
			classFeat: boolean;
			ancestryFeat: boolean;
			skillFeat: boolean;
			generalFeat: boolean;
		}> = [
			{ level: 1, classFeat: true, ancestryFeat: true, skillFeat: false, generalFeat: false },
			{ level: 2, classFeat: true, ancestryFeat: false, skillFeat: true, generalFeat: false },
			{ level: 3, classFeat: false, ancestryFeat: false, skillFeat: false, generalFeat: true },
			{ level: 4, classFeat: true, ancestryFeat: false, skillFeat: true, generalFeat: false },
			{ level: 5, classFeat: false, ancestryFeat: true, skillFeat: false, generalFeat: false },
			{ level: 6, classFeat: true, ancestryFeat: false, skillFeat: true, generalFeat: false },
			{ level: 7, classFeat: false, ancestryFeat: false, skillFeat: false, generalFeat: true },
			{ level: 8, classFeat: true, ancestryFeat: false, skillFeat: true, generalFeat: false },
			{ level: 9, classFeat: false, ancestryFeat: true, skillFeat: false, generalFeat: false },
			{ level: 10, classFeat: true, ancestryFeat: false, skillFeat: true, generalFeat: false },
			{ level: 11, classFeat: false, ancestryFeat: false, skillFeat: false, generalFeat: true },
			{ level: 12, classFeat: true, ancestryFeat: false, skillFeat: true, generalFeat: false },
			{ level: 13, classFeat: false, ancestryFeat: true, skillFeat: false, generalFeat: false },
			{ level: 14, classFeat: true, ancestryFeat: false, skillFeat: true, generalFeat: false },
			{ level: 15, classFeat: false, ancestryFeat: false, skillFeat: false, generalFeat: true },
			{ level: 16, classFeat: true, ancestryFeat: false, skillFeat: true, generalFeat: false },
			{ level: 17, classFeat: false, ancestryFeat: true, skillFeat: false, generalFeat: false },
			{ level: 18, classFeat: true, ancestryFeat: false, skillFeat: true, generalFeat: false },
			{ level: 19, classFeat: false, ancestryFeat: false, skillFeat: false, generalFeat: true },
			{ level: 20, classFeat: true, ancestryFeat: false, skillFeat: true, generalFeat: false }
		];

		standardTests.forEach(({ level, classFeat, ancestryFeat, skillFeat, generalFeat }) => {
			it(`should return correct slots for level ${level} (standard rules)`, () => {
				const result = getFeatSlotsForLevel(level);

				expect(result.classFeat).toBe(classFeat);
				expect(result.ancestryFeat).toBe(ancestryFeat);
				expect(result.skillFeat).toBe(skillFeat);
				expect(result.generalFeat).toBe(generalFeat);
				expect(result.freeArchetypeFeat).toBeUndefined();
			});
		});

		it('should add free archetype feat at even levels >= 2', () => {
			const variantRules: VariantRules = { freeArchetype: true };

			// Level 1: no free archetype
			let result = getFeatSlotsForLevel(1, variantRules);
			expect(result.freeArchetypeFeat).toBeUndefined();

			// Level 2: free archetype
			result = getFeatSlotsForLevel(2, variantRules);
			expect(result.freeArchetypeFeat).toBe(true);

			// Level 3: no free archetype (odd level)
			result = getFeatSlotsForLevel(3, variantRules);
			expect(result.freeArchetypeFeat).toBeUndefined();

			// Level 4: free archetype
			result = getFeatSlotsForLevel(4, variantRules);
			expect(result.freeArchetypeFeat).toBe(true);

			// Level 20: free archetype
			result = getFeatSlotsForLevel(20, variantRules);
			expect(result.freeArchetypeFeat).toBe(true);
		});

		it('should not add free archetype when rule is disabled', () => {
			const variantRules: VariantRules = { freeArchetype: false };

			const result = getFeatSlotsForLevel(2, variantRules);

			expect(result.freeArchetypeFeat).toBeUndefined();
		});

		it('should handle free archetype with other slots', () => {
			const variantRules: VariantRules = { freeArchetype: true };

			const result = getFeatSlotsForLevel(2, variantRules);

			expect(result).toEqual({
				classFeat: true,
				ancestryFeat: false,
				skillFeat: true,
				generalFeat: false,
				freeArchetypeFeat: true
			});
		});
	});

	describe('getAbilityBoostLevels()', () => {
		it('should return standard boost levels', () => {
			const result = getAbilityBoostLevels();

			expect(result).toEqual([5, 10, 15, 20]);
		});

		it('should return standard boost levels when variant rules empty', () => {
			const result = getAbilityBoostLevels({});

			expect(result).toEqual([5, 10, 15, 20]);
		});

		it('should return gradual boost levels when enabled', () => {
			const variantRules: VariantRules = { gradualAbilityBoosts: true };
			const result = getAbilityBoostLevels(variantRules);

			expect(result).toEqual([2, 3, 4, 5, 7, 8, 9, 10, 12, 13, 14, 15, 17, 18, 19, 20]);
		});

		it('should return standard when gradual is false', () => {
			const variantRules: VariantRules = { gradualAbilityBoosts: false };
			const result = getAbilityBoostLevels(variantRules);

			expect(result).toEqual([5, 10, 15, 20]);
		});
	});

	describe('getAbilityBoostCount()', () => {
		it('should return 4 at standard boost levels', () => {
			expect(getAbilityBoostCount(5)).toBe(4);
			expect(getAbilityBoostCount(10)).toBe(4);
			expect(getAbilityBoostCount(15)).toBe(4);
			expect(getAbilityBoostCount(20)).toBe(4);
		});

		it('should return 0 at non-boost levels', () => {
			expect(getAbilityBoostCount(1)).toBe(0);
			expect(getAbilityBoostCount(2)).toBe(0);
			expect(getAbilityBoostCount(7)).toBe(0);
			expect(getAbilityBoostCount(12)).toBe(0);
		});

		it('should return 1 at gradual boost levels', () => {
			const variantRules: VariantRules = { gradualAbilityBoosts: true };

			expect(getAbilityBoostCount(2, variantRules)).toBe(1);
			expect(getAbilityBoostCount(3, variantRules)).toBe(1);
			expect(getAbilityBoostCount(4, variantRules)).toBe(1);
			expect(getAbilityBoostCount(5, variantRules)).toBe(1);
			expect(getAbilityBoostCount(7, variantRules)).toBe(1);
		});

		it('should return 0 at non-boost levels with gradual', () => {
			const variantRules: VariantRules = { gradualAbilityBoosts: true };

			expect(getAbilityBoostCount(1, variantRules)).toBe(0);
			expect(getAbilityBoostCount(6, variantRules)).toBe(0);
			expect(getAbilityBoostCount(11, variantRules)).toBe(0);
		});
	});

	describe('hasSkillIncrease()', () => {
		it('should return false for levels 1-2', () => {
			expect(hasSkillIncrease(1)).toBe(false);
			expect(hasSkillIncrease(2)).toBe(false);
		});

		it('should return true for odd levels >= 3', () => {
			expect(hasSkillIncrease(3)).toBe(true);
			expect(hasSkillIncrease(5)).toBe(true);
			expect(hasSkillIncrease(7)).toBe(true);
			expect(hasSkillIncrease(9)).toBe(true);
			expect(hasSkillIncrease(11)).toBe(true);
			expect(hasSkillIncrease(13)).toBe(true);
			expect(hasSkillIncrease(15)).toBe(true);
			expect(hasSkillIncrease(17)).toBe(true);
			expect(hasSkillIncrease(19)).toBe(true);
		});

		it('should return false for even levels', () => {
			expect(hasSkillIncrease(4)).toBe(false);
			expect(hasSkillIncrease(6)).toBe(false);
			expect(hasSkillIncrease(8)).toBe(false);
			expect(hasSkillIncrease(10)).toBe(false);
			expect(hasSkillIncrease(20)).toBe(false);
		});
	});

	describe('getLevelProgression()', () => {
		it('should return complete progression for level 1', () => {
			const result = getLevelProgression(1);

			expect(result.level).toBe(1);
			expect(result.featSlots).toEqual({
				classFeat: true,
				ancestryFeat: true,
				skillFeat: false,
				generalFeat: false
			});
			expect(result.abilityBoosts).toBe(0);
			expect(result.skillIncrease).toBe(false);
			expect(result.features).toContain('Background skill');
			expect(result.features).toContain('Ancestry feat');
			expect(result.features).toContain('Class feat');
			expect(result.classFeatures).toEqual([]);
		});

		it('should return complete progression for level 2', () => {
			const result = getLevelProgression(2);

			expect(result.level).toBe(2);
			expect(result.featSlots.classFeat).toBe(true);
			expect(result.featSlots.skillFeat).toBe(true);
			expect(result.abilityBoosts).toBe(0);
			expect(result.skillIncrease).toBe(false);
			expect(result.features).toContain('Class feat');
			expect(result.features).toContain('Skill feat');
		});

		it('should include ability boosts in features', () => {
			const result = getLevelProgression(5);

			expect(result.abilityBoosts).toBe(4);
			expect(result.features).toContain('Ability boosts (4)');
		});

		it('should include skill increase in features', () => {
			const result = getLevelProgression(3);

			expect(result.skillIncrease).toBe(true);
			expect(result.features).toContain('Skill increase');
		});

		it('should include free archetype feat when enabled', () => {
			const variantRules: VariantRules = { freeArchetype: true };
			const result = getLevelProgression(2, variantRules);

			expect(result.featSlots.freeArchetypeFeat).toBe(true);
			expect(result.features).toContain('Free Archetype feat');
		});

		it('should use gradual ability boosts when enabled', () => {
			const variantRules: VariantRules = { gradualAbilityBoosts: true };
			const result = getLevelProgression(2, variantRules);

			expect(result.abilityBoosts).toBe(1);
			expect(result.features).toContain('Ability boosts (1)');
		});

		it('should include class features when provided', () => {
			const classFeatures = [
				{ level: 1, name: 'Rage', uuid: 'Compendium.pf2e.classfeatures.Item.Rage' },
				{ level: 1, name: 'Instinct', uuid: 'Compendium.pf2e.classfeatures.Item.Instinct' },
				{ level: 2, name: 'Raging Resistance', uuid: 'Compendium.pf2e.classfeatures.Item.Raging Resistance' }
			];

			const result = getLevelProgression(1, undefined, classFeatures);

			expect(result.classFeatures).toHaveLength(2);
			expect(result.classFeatures[0]).toEqual({
				name: 'Rage',
				uuid: 'Compendium.pf2e.classfeatures.Item.Rage'
			});
			expect(result.classFeatures[1]).toEqual({
				name: 'Instinct',
				uuid: 'Compendium.pf2e.classfeatures.Item.Instinct'
			});
		});

		it('should only include class features for current level', () => {
			const classFeatures = [
				{ level: 1, name: 'Feature 1', uuid: 'UUID1' },
				{ level: 2, name: 'Feature 2', uuid: 'UUID2' },
				{ level: 2, name: 'Feature 3', uuid: 'UUID3' }
			];

			const result = getLevelProgression(2, undefined, classFeatures);

			expect(result.classFeatures).toHaveLength(2);
			expect(result.classFeatures.map((cf) => cf.name)).toEqual(['Feature 2', 'Feature 3']);
		});

		it('should return empty class features when none provided', () => {
			const result = getLevelProgression(1);

			expect(result.classFeatures).toEqual([]);
		});

		it('should handle complex level with multiple features', () => {
			const variantRules: VariantRules = {
				freeArchetype: true,
				gradualAbilityBoosts: true
			};

			const result = getLevelProgression(5, variantRules);

			expect(result.featSlots.ancestryFeat).toBe(true);
			expect(result.abilityBoosts).toBe(1);
			expect(result.skillIncrease).toBe(true);
			expect(result.features).toContain('Ancestry feat');
			expect(result.features).toContain('Ability boosts (1)');
			expect(result.features).toContain('Skill increase');
		});

		it('should not duplicate level 1 background skill at other levels', () => {
			const result = getLevelProgression(2);

			expect(result.features).not.toContain('Background skill');
		});
	});
});
