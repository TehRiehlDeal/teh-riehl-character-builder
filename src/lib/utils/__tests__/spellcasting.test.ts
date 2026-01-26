/**
 * Tests for Spellcasting Utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	resolveSpellTradition,
	getAllSpellsKnownLimits,
	hasSpellsKnownLimits,
	getSpellcastingTypeLabel,
	getTraditionLabel,
	getSpellCapacityAtLevel,
	canLearnTradition,
	getSpellLevelLabel,
	getAvailableSpellLevels,
	requiresPreparation,
	isSpontaneousCaster,
	isBoundedCaster,
	getSpellcastingDescription
} from '../spellcasting';
import * as spellcastingConfig from '$lib/data/spellcasting/spellcastingConfig';

// Mock the spellcasting config module
vi.mock('$lib/data/spellcasting/spellcastingConfig', async () => {
	const actual = await vi.importActual('$lib/data/spellcasting/spellcastingConfig');
	return {
		...actual,
		getSpellcastingConfig: vi.fn(),
		getSpellSlotsForLevel: vi.fn(),
		getSpellsKnownCount: vi.fn(),
		isSpellcaster: vi.fn()
	};
});

describe('Spellcasting Utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('resolveSpellTradition()', () => {
		it('should return null for null className', () => {
			const result = resolveSpellTradition(null, {});
			expect(result).toBeNull();
		});

		it('should return null for non-spellcaster class', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue(null);

			const result = resolveSpellTradition('Fighter', {});

			expect(result).toBeNull();
		});

		it('should return fixed arcane tradition for Wizard', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'arcane',
				type: 'prepared',
				spellSlots: {},
				cantrips: {}
			});

			const result = resolveSpellTradition('Wizard', {});

			expect(result).toBe('arcane');
		});

		it('should return fixed divine tradition for Cleric', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'divine',
				type: 'prepared',
				spellSlots: {},
				cantrips: {}
			});

			const result = resolveSpellTradition('Cleric', {});

			expect(result).toBe('divine');
		});

		it('should return fixed primal tradition for Druid', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'primal',
				type: 'prepared',
				spellSlots: {},
				cantrips: {}
			});

			const result = resolveSpellTradition('Druid', {});

			expect(result).toBe('primal');
		});

		it('should return fixed occult tradition for Bard', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'occult',
				type: 'spontaneous',
				spellSlots: {},
				cantrips: {}
			});

			const result = resolveSpellTradition('Bard', {});

			expect(result).toBe('occult');
		});

		describe('bloodline resolution', () => {
			beforeEach(() => {
				vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
					tradition: 'bloodline',
					type: 'spontaneous',
					spellSlots: {},
					cantrips: {}
				});
			});

			it('should resolve draconic bloodline to arcane', () => {
				const result = resolveSpellTradition('Sorcerer', { bloodline: 'draconic' });
				expect(result).toBe('arcane');
			});

			it('should resolve angelic bloodline to divine', () => {
				const result = resolveSpellTradition('Sorcerer', { bloodline: 'angelic' });
				expect(result).toBe('divine');
			});

			it('should resolve elemental bloodline to primal', () => {
				const result = resolveSpellTradition('Sorcerer', { bloodline: 'elemental' });
				expect(result).toBe('primal');
			});

			it('should resolve aberrant bloodline to occult', () => {
				const result = resolveSpellTradition('Sorcerer', { bloodline: 'aberrant' });
				expect(result).toBe('occult');
			});

			it('should handle sorcererBloodline key', () => {
				const result = resolveSpellTradition('Sorcerer', { sorcererBloodline: 'draconic' });
				expect(result).toBe('arcane');
			});

			it('should handle kebab-case key', () => {
				const result = resolveSpellTradition('Sorcerer', { 'sorcerer-bloodline': 'draconic' });
				expect(result).toBe('arcane');
			});

			it('should handle any key containing bloodline', () => {
				const result = resolveSpellTradition('Sorcerer', { someBloodlineKey: 'draconic' });
				expect(result).toBe('arcane');
			});

			it('should handle normalized bloodline names', () => {
				const result = resolveSpellTradition('Sorcerer', { bloodline: 'Aberrant Bloodline' });
				expect(result).toBe('occult');
			});

			it('should handle case-insensitive bloodline names', () => {
				const result = resolveSpellTradition('Sorcerer', { bloodline: 'DRACONIC' });
				expect(result).toBe('arcane');
			});

			it('should return null for unknown bloodline', () => {
				const result = resolveSpellTradition('Sorcerer', { bloodline: 'unknown' });
				expect(result).toBeNull();
			});

			it('should return null when no bloodline selected', () => {
				const result = resolveSpellTradition('Sorcerer', {});
				expect(result).toBeNull();
			});
		});

		describe('patron resolution', () => {
			beforeEach(() => {
				vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
					tradition: 'patron',
					type: 'prepared',
					spellSlots: {},
					cantrips: {}
				});
			});

			it('should resolve resentment patron to arcane', () => {
				const result = resolveSpellTradition('Witch', { patron: 'resentment' });
				expect(result).toBe('arcane');
			});

			it('should resolve fate patron to divine', () => {
				const result = resolveSpellTradition('Witch', { patron: 'fate' });
				expect(result).toBe('divine');
			});

			it('should resolve wild patron to primal', () => {
				const result = resolveSpellTradition('Witch', { patron: 'wild' });
				expect(result).toBe('primal');
			});

			it('should resolve night patron to occult', () => {
				const result = resolveSpellTradition('Witch', { patron: 'night' });
				expect(result).toBe('occult');
			});

			it('should handle witchPatron key', () => {
				const result = resolveSpellTradition('Witch', { witchPatron: 'wild' });
				expect(result).toBe('primal');
			});

			it('should handle any key containing patron', () => {
				const result = resolveSpellTradition('Witch', { somePatronKey: 'wild' });
				expect(result).toBe('primal');
			});

			it('should handle normalized patron names', () => {
				const result = resolveSpellTradition('Witch', { patron: 'mosquito witch' });
				expect(result).toBe('primal');
			});

			it('should return null for unknown patron', () => {
				const result = resolveSpellTradition('Witch', { patron: 'unknown' });
				expect(result).toBeNull();
			});
		});
	});

	describe('getAllSpellsKnownLimits()', () => {
		it('should return empty map for null className', () => {
			const result = getAllSpellsKnownLimits(null, 5);

			expect(result.size).toBe(0);
		});

		it('should return empty map for non-spellcaster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue(null);

			const result = getAllSpellsKnownLimits('Fighter', 5);

			expect(result.size).toBe(0);
		});

		it('should return empty map for prepared caster without spellsKnown', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'arcane',
				type: 'prepared',
				spellSlots: {},
				cantrips: {}
			});

			const result = getAllSpellsKnownLimits('Wizard', 5);

			expect(result.size).toBe(0);
		});

		it('should return spells known limits for spontaneous caster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'occult',
				type: 'spontaneous',
				spellSlots: {},
				cantrips: {},
				spellsKnown: {
					5: { 1: 3, 2: 3, 3: 2 }
				}
			});

			const result = getAllSpellsKnownLimits('Bard', 5);

			expect(result.size).toBe(3);
			expect(result.get(1)).toBe(3);
			expect(result.get(2)).toBe(3);
			expect(result.get(3)).toBe(2);
		});

		it('should return empty map for level with no spells known', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'occult',
				type: 'spontaneous',
				spellSlots: {},
				cantrips: {},
				spellsKnown: {}
			});

			const result = getAllSpellsKnownLimits('Bard', 100);

			expect(result.size).toBe(0);
		});
	});

	describe('hasSpellsKnownLimits()', () => {
		it('should return false for null className', () => {
			expect(hasSpellsKnownLimits(null)).toBe(false);
		});

		it('should return false for prepared caster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'arcane',
				type: 'prepared',
				spellSlots: {},
				cantrips: {}
			});

			expect(hasSpellsKnownLimits('Wizard')).toBe(false);
		});

		it('should return true for spontaneous caster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'occult',
				type: 'spontaneous',
				spellSlots: {},
				cantrips: {},
				spellsKnown: {}
			});

			expect(hasSpellsKnownLimits('Bard')).toBe(true);
		});
	});

	describe('getSpellcastingTypeLabel()', () => {
		it('should return "Prepared Caster" for prepared', () => {
			expect(getSpellcastingTypeLabel('prepared')).toBe('Prepared Caster');
		});

		it('should return "Spontaneous Caster" for spontaneous', () => {
			expect(getSpellcastingTypeLabel('spontaneous')).toBe('Spontaneous Caster');
		});

		it('should return "Bounded Caster" for bounded', () => {
			expect(getSpellcastingTypeLabel('bounded')).toBe('Bounded Caster');
		});

		it('should return "None" for null', () => {
			expect(getSpellcastingTypeLabel(null)).toBe('None');
		});
	});

	describe('getTraditionLabel()', () => {
		it('should capitalize tradition', () => {
			expect(getTraditionLabel('arcane')).toBe('Arcane');
			expect(getTraditionLabel('divine')).toBe('Divine');
			expect(getTraditionLabel('primal')).toBe('Primal');
			expect(getTraditionLabel('occult')).toBe('Occult');
		});

		it('should return "None" for null', () => {
			expect(getTraditionLabel(null)).toBe('None');
		});
	});

	describe('getSpellCapacityAtLevel()', () => {
		it('should return spells known for spontaneous caster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'occult',
				type: 'spontaneous',
				spellSlots: {},
				cantrips: {},
				spellsKnown: {}
			});
			vi.mocked(spellcastingConfig.getSpellsKnownCount).mockReturnValue(3);

			const result = getSpellCapacityAtLevel('Bard', 5, 2);

			expect(result).toBe(3);
			expect(spellcastingConfig.getSpellsKnownCount).toHaveBeenCalledWith('Bard', 5, 2);
		});

		it('should return spell slots for prepared caster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'arcane',
				type: 'prepared',
				spellSlots: {},
				cantrips: {}
			});
			vi.mocked(spellcastingConfig.getSpellSlotsForLevel).mockReturnValue([
				{ level: 1, total: 3 },
				{ level: 2, total: 3 },
				{ level: 3, total: 2 }
			]);

			const result = getSpellCapacityAtLevel('Wizard', 5, 2);

			expect(result).toBe(3);
		});

		it('should return 0 for non-existent spell level', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'arcane',
				type: 'prepared',
				spellSlots: {},
				cantrips: {}
			});
			vi.mocked(spellcastingConfig.getSpellSlotsForLevel).mockReturnValue([
				{ level: 1, total: 3 }
			]);

			const result = getSpellCapacityAtLevel('Wizard', 5, 5);

			expect(result).toBe(0);
		});

		it('should return 0 for non-spellcaster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue(null);

			const result = getSpellCapacityAtLevel('Fighter', 5, 1);

			expect(result).toBe(0);
		});
	});

	describe('canLearnTradition()', () => {
		it('should return true when traditions match', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'arcane',
				type: 'prepared',
				spellSlots: {},
				cantrips: {}
			});

			const result = canLearnTradition('Wizard', {}, 'arcane');

			expect(result).toBe(true);
		});

		it('should return false when traditions do not match', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'arcane',
				type: 'prepared',
				spellSlots: {},
				cantrips: {}
			});

			const result = canLearnTradition('Wizard', {}, 'divine');

			expect(result).toBe(false);
		});

		it('should return false for null className', () => {
			const result = canLearnTradition(null, {}, 'arcane');

			expect(result).toBe(false);
		});
	});

	describe('getSpellLevelLabel()', () => {
		it('should return "Cantrips" for level 0', () => {
			expect(getSpellLevelLabel(0)).toBe('Cantrips');
		});

		it('should use "st" suffix for level 1', () => {
			expect(getSpellLevelLabel(1)).toBe('1st Level');
		});

		it('should use "nd" suffix for level 2', () => {
			expect(getSpellLevelLabel(2)).toBe('2nd Level');
		});

		it('should use "rd" suffix for level 3', () => {
			expect(getSpellLevelLabel(3)).toBe('3rd Level');
		});

		it('should use "th" suffix for level 4+', () => {
			expect(getSpellLevelLabel(4)).toBe('4th Level');
			expect(getSpellLevelLabel(5)).toBe('5th Level');
			expect(getSpellLevelLabel(6)).toBe('6th Level');
			expect(getSpellLevelLabel(7)).toBe('7th Level');
			expect(getSpellLevelLabel(8)).toBe('8th Level');
			expect(getSpellLevelLabel(9)).toBe('9th Level');
			expect(getSpellLevelLabel(10)).toBe('10th Level');
		});
	});

	describe('getAvailableSpellLevels()', () => {
		it('should return spell levels from slots', () => {
			vi.mocked(spellcastingConfig.getSpellSlotsForLevel).mockReturnValue([
				{ level: 1, total: 3 },
				{ level: 2, total: 3 },
				{ level: 3, total: 2 }
			]);
			vi.mocked(spellcastingConfig.isSpellcaster).mockReturnValue(true);

			const result = getAvailableSpellLevels('Wizard', 5);

			expect(result).toContain(0); // Cantrips always included
			expect(result).toContain(1);
			expect(result).toContain(2);
			expect(result).toContain(3);
		});

		it('should not duplicate cantrips', () => {
			vi.mocked(spellcastingConfig.getSpellSlotsForLevel).mockReturnValue([
				{ level: 0, total: 5 },
				{ level: 1, total: 3 }
			]);
			vi.mocked(spellcastingConfig.isSpellcaster).mockReturnValue(true);

			const result = getAvailableSpellLevels('Wizard', 1);

			expect(result.filter((l) => l === 0)).toHaveLength(1);
		});

		it('should return sorted levels', () => {
			vi.mocked(spellcastingConfig.getSpellSlotsForLevel).mockReturnValue([
				{ level: 3, total: 2 },
				{ level: 1, total: 3 },
				{ level: 2, total: 3 }
			]);
			vi.mocked(spellcastingConfig.isSpellcaster).mockReturnValue(true);

			const result = getAvailableSpellLevels('Wizard', 5);

			expect(result).toEqual([0, 1, 2, 3]);
		});
	});

	describe('requiresPreparation()', () => {
		it('should return true for prepared caster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'arcane',
				type: 'prepared',
				spellSlots: {},
				cantrips: {}
			});

			expect(requiresPreparation('Wizard')).toBe(true);
		});

		it('should return false for spontaneous caster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'occult',
				type: 'spontaneous',
				spellSlots: {},
				cantrips: {}
			});

			expect(requiresPreparation('Bard')).toBe(false);
		});

		it('should return false for non-spellcaster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue(null);

			expect(requiresPreparation('Fighter')).toBe(false);
		});
	});

	describe('isSpontaneousCaster()', () => {
		it('should return true for spontaneous caster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'occult',
				type: 'spontaneous',
				spellSlots: {},
				cantrips: {}
			});

			expect(isSpontaneousCaster('Bard')).toBe(true);
		});

		it('should return false for prepared caster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'arcane',
				type: 'prepared',
				spellSlots: {},
				cantrips: {}
			});

			expect(isSpontaneousCaster('Wizard')).toBe(false);
		});

		it('should return false for non-spellcaster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue(null);

			expect(isSpontaneousCaster('Fighter')).toBe(false);
		});
	});

	describe('isBoundedCaster()', () => {
		it('should return true for bounded caster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'arcane',
				type: 'bounded',
				spellSlots: {},
				cantrips: {}
			});

			expect(isBoundedCaster('Summoner')).toBe(true);
		});

		it('should return false for prepared caster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'arcane',
				type: 'prepared',
				spellSlots: {},
				cantrips: {}
			});

			expect(isBoundedCaster('Wizard')).toBe(false);
		});

		it('should return false for non-spellcaster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue(null);

			expect(isBoundedCaster('Fighter')).toBe(false);
		});
	});

	describe('getSpellcastingDescription()', () => {
		it('should return description for prepared caster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'arcane',
				type: 'prepared',
				spellSlots: {},
				cantrips: {}
			});

			const result = getSpellcastingDescription('Wizard');

			expect(result).toContain('prepare');
			expect(result).toContain('specific list');
		});

		it('should return description for spontaneous caster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'occult',
				type: 'spontaneous',
				spellSlots: {},
				cantrips: {}
			});

			const result = getSpellcastingDescription('Bard');

			expect(result).toContain('repertoire');
			expect(result).toContain('spontaneously');
		});

		it('should return description for bounded caster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue({
				tradition: 'arcane',
				type: 'bounded',
				spellSlots: {},
				cantrips: {}
			});

			const result = getSpellcastingDescription('Summoner');

			expect(result).toContain('limited');
			expect(result).toContain('flexibly');
		});

		it('should return message for non-spellcaster', () => {
			vi.mocked(spellcastingConfig.getSpellcastingConfig).mockReturnValue(null);

			const result = getSpellcastingDescription('Fighter');

			expect(result).toContain('does not have spellcasting');
		});

		it('should return empty string for null className', () => {
			const result = getSpellcastingDescription(null);

			expect(result).toBe('');
		});
	});
});
