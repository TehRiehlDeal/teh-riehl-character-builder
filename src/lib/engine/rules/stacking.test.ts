import { describe, it, expect } from 'vitest';
import { createModifier } from '../models/Modifier';
import {
	applyStackingRules,
	calculateBonuses,
	calculatePenalties,
	groupByType,
	getHighestValue,
	sumModifiers,
	getAppliedBonuses,
	wouldStack,
	getStackingExplanation
} from './stacking';

describe('Stacking Rules', () => {
	describe('Status Bonuses', () => {
		it('should not stack - only highest applies', () => {
			const modifiers = [
				createModifier({
					label: 'Bless',
					source: 'Bless Spell',
					value: 1,
					type: 'status',
					selector: 'attack'
				}),
				createModifier({
					label: 'Heroism',
					source: 'Heroism Spell',
					value: 2,
					type: 'status',
					selector: 'attack'
				})
			];

			const total = calculateBonuses(modifiers);
			expect(total).toBe(2); // Only the +2 from Heroism applies
		});

		it('should apply highest when multiple status bonuses exist', () => {
			const modifiers = [
				createModifier({
					label: 'Bless',
					source: 'Bless',
					value: 1,
					type: 'status',
					selector: 'attack'
				}),
				createModifier({
					label: 'Heroism',
					source: 'Heroism',
					value: 2,
					type: 'status',
					selector: 'attack'
				}),
				createModifier({
					label: 'Inspire Courage',
					source: 'Bard',
					value: 3,
					type: 'status',
					selector: 'attack'
				})
			];

			const total = calculateBonuses(modifiers);
			expect(total).toBe(3); // Only the +3 from Inspire Courage
		});
	});

	describe('Circumstance Bonuses', () => {
		it('should not stack - only highest applies', () => {
			const modifiers = [
				createModifier({
					label: 'Cover',
					source: 'Cover',
					value: 2,
					type: 'circumstance',
					selector: 'ac'
				}),
				createModifier({
					label: 'Defensive Stance',
					source: 'Fighter',
					value: 1,
					type: 'circumstance',
					selector: 'ac'
				})
			];

			const total = calculateBonuses(modifiers);
			expect(total).toBe(2); // Only the +2 from Cover applies
		});
	});

	describe('Item Bonuses', () => {
		it('should not stack - only highest applies', () => {
			const modifiers = [
				createModifier({
					label: 'Magic Weapon',
					source: '+1 Weapon',
					value: 1,
					type: 'item',
					selector: 'attack'
				}),
				createModifier({
					label: 'Magic Armor',
					source: '+2 Armor',
					value: 2,
					type: 'item',
					selector: 'ac'
				})
			];

			// Different selectors, but testing item type stacking
			const attackMods = modifiers.filter((m) => m.selector === 'attack');
			const acMods = modifiers.filter((m) => m.selector === 'ac');

			expect(calculateBonuses(attackMods)).toBe(1);
			expect(calculateBonuses(acMods)).toBe(2);
		});
	});

	describe('Untyped Bonuses', () => {
		it('should all stack', () => {
			const modifiers = [
				createModifier({
					label: 'Fleet',
					source: 'Fleet Feat',
					value: 5,
					type: 'untyped',
					selector: 'speed'
				}),
				createModifier({
					label: 'Longstrider',
					source: 'Longstrider Spell',
					value: 10,
					type: 'untyped',
					selector: 'speed'
				}),
				createModifier({
					label: 'Haste',
					source: 'Haste Spell',
					value: 10,
					type: 'untyped',
					selector: 'speed'
				})
			];

			const total = calculateBonuses(modifiers);
			expect(total).toBe(25); // 5 + 10 + 10 = 25
		});
	});

	describe('Mixed Bonus Types', () => {
		it('should stack different types correctly', () => {
			const modifiers = [
				createModifier({
					label: 'Bless',
					source: 'Bless',
					value: 1,
					type: 'status',
					selector: 'attack'
				}),
				createModifier({
					label: 'High Ground',
					source: 'Circumstance',
					value: 1,
					type: 'circumstance',
					selector: 'attack'
				}),
				createModifier({
					label: 'Magic Weapon',
					source: '+1 Weapon',
					value: 1,
					type: 'item',
					selector: 'attack'
				}),
				createModifier({
					label: 'Insight',
					source: 'Special Ability',
					value: 2,
					type: 'untyped',
					selector: 'attack'
				})
			];

			const total = calculateBonuses(modifiers);
			expect(total).toBe(5); // 1 + 1 + 1 + 2 = 5
		});
	});

	describe('Penalties', () => {
		it('should all stack regardless of type', () => {
			const modifiers = [
				createModifier({
					label: 'Frightened 1',
					source: 'Frightened',
					value: -1,
					type: 'status',
					selector: 'checks'
				}),
				createModifier({
					label: 'Sickened 1',
					source: 'Sickened',
					value: -1,
					type: 'status',
					selector: 'checks'
				}),
				createModifier({
					label: 'Clumsy 1',
					source: 'Clumsy',
					value: -1,
					type: 'status',
					selector: 'dex-based'
				})
			];

			const total = calculatePenalties(modifiers);
			expect(total).toBe(-3); // All stack
		});

		it('should work with bonuses and penalties together', () => {
			const modifiers = [
				createModifier({
					label: 'Bless',
					source: 'Bless',
					value: 1,
					type: 'status',
					selector: 'attack'
				}),
				createModifier({
					label: 'Frightened 1',
					source: 'Frightened',
					value: -1,
					type: 'status',
					selector: 'attack'
				})
			];

			const total = applyStackingRules(modifiers);
			expect(total).toBe(0); // +1 - 1 = 0
		});
	});

	describe('Helper Functions', () => {
		it('groupByType should group modifiers correctly', () => {
			const modifiers = [
				createModifier({
					label: 'A',
					source: 'A',
					value: 1,
					type: 'status',
					selector: 'test'
				}),
				createModifier({
					label: 'B',
					source: 'B',
					value: 1,
					type: 'status',
					selector: 'test'
				}),
				createModifier({
					label: 'C',
					source: 'C',
					value: 1,
					type: 'item',
					selector: 'test'
				})
			];

			const grouped = groupByType(modifiers);
			expect(grouped.get('status')?.length).toBe(2);
			expect(grouped.get('item')?.length).toBe(1);
		});

		it('getHighestValue should return highest value', () => {
			const modifiers = [
				createModifier({
					label: 'A',
					source: 'A',
					value: 1,
					type: 'status',
					selector: 'test'
				}),
				createModifier({
					label: 'B',
					source: 'B',
					value: 3,
					type: 'status',
					selector: 'test'
				}),
				createModifier({
					label: 'C',
					source: 'C',
					value: 2,
					type: 'status',
					selector: 'test'
				})
			];

			expect(getHighestValue(modifiers)).toBe(3);
		});

		it('sumModifiers should sum all values', () => {
			const modifiers = [
				createModifier({
					label: 'A',
					source: 'A',
					value: 1,
					type: 'untyped',
					selector: 'test'
				}),
				createModifier({
					label: 'B',
					source: 'B',
					value: 2,
					type: 'untyped',
					selector: 'test'
				}),
				createModifier({
					label: 'C',
					source: 'C',
					value: 3,
					type: 'untyped',
					selector: 'test'
				})
			];

			expect(sumModifiers(modifiers)).toBe(6);
		});
	});

	describe('getAppliedBonuses', () => {
		it('should identify which bonuses actually apply', () => {
			const modifiers = [
				createModifier({
					label: 'Bless',
					source: 'Bless',
					value: 1,
					type: 'status',
					selector: 'attack'
				}),
				createModifier({
					label: 'Heroism',
					source: 'Heroism',
					value: 2,
					type: 'status',
					selector: 'attack'
				}),
				createModifier({
					label: 'Fleet',
					source: 'Fleet',
					value: 5,
					type: 'untyped',
					selector: 'speed'
				})
			];

			const applied = getAppliedBonuses(modifiers);
			expect(applied.size).toBe(2); // Heroism and Fleet
			expect(applied.has(modifiers[0])).toBe(false); // Bless suppressed
			expect(applied.has(modifiers[1])).toBe(true); // Heroism applies
			expect(applied.has(modifiers[2])).toBe(true); // Fleet applies
		});
	});

	describe('wouldStack', () => {
		it('should return true for untyped bonuses', () => {
			const existing = [
				createModifier({
					label: 'A',
					source: 'A',
					value: 5,
					type: 'untyped',
					selector: 'test'
				})
			];
			const newMod = createModifier({
				label: 'B',
				source: 'B',
				value: 5,
				type: 'untyped',
				selector: 'test'
			});

			expect(wouldStack(newMod, existing)).toBe(true);
		});

		it('should return true if new bonus is higher than existing', () => {
			const existing = [
				createModifier({
					label: 'A',
					source: 'A',
					value: 1,
					type: 'status',
					selector: 'test'
				})
			];
			const newMod = createModifier({
				label: 'B',
				source: 'B',
				value: 2,
				type: 'status',
				selector: 'test'
			});

			expect(wouldStack(newMod, existing)).toBe(true);
		});

		it('should return false if new bonus is lower than existing', () => {
			const existing = [
				createModifier({
					label: 'A',
					source: 'A',
					value: 2,
					type: 'status',
					selector: 'test'
				})
			];
			const newMod = createModifier({
				label: 'B',
				source: 'B',
				value: 1,
				type: 'status',
				selector: 'test'
			});

			expect(wouldStack(newMod, existing)).toBe(false);
		});

		it('should return true for penalties', () => {
			const existing = [
				createModifier({
					label: 'A',
					source: 'A',
					value: -1,
					type: 'status',
					selector: 'test'
				})
			];
			const newMod = createModifier({
				label: 'B',
				source: 'B',
				value: -1,
				type: 'status',
				selector: 'test'
			});

			expect(wouldStack(newMod, existing)).toBe(true);
		});
	});

	describe('getStackingExplanation', () => {
		it('should explain untyped bonuses stack', () => {
			const mod = createModifier({
				label: 'Fleet',
				source: 'Fleet',
				value: 5,
				type: 'untyped',
				selector: 'speed'
			});

			const explanation = getStackingExplanation(mod, []);
			expect(explanation).toBe('Untyped bonuses stack');
		});

		it('should explain penalties stack', () => {
			const mod = createModifier({
				label: 'Frightened',
				source: 'Frightened',
				value: -1,
				type: 'status',
				selector: 'checks'
			});

			const explanation = getStackingExplanation(mod, []);
			expect(explanation).toBe('All penalties stack');
		});

		it('should explain when bonus is suppressed', () => {
			const mod1 = createModifier({
				label: 'Bless',
				source: 'Bless',
				value: 1,
				type: 'status',
				selector: 'attack'
			});
			const mod2 = createModifier({
				label: 'Heroism',
				source: 'Heroism',
				value: 2,
				type: 'status',
				selector: 'attack'
			});

			const explanation = getStackingExplanation(mod1, [mod1, mod2]);
			expect(explanation).toContain('Suppressed');
			expect(explanation).toContain('status');
		});
	});
});
