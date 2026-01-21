import { describe, it, expect, beforeEach } from 'vitest';
import { Statistic } from './Statistic';
import { createModifier } from './Modifier';

describe('Statistic', () => {
	let stat: Statistic;

	beforeEach(() => {
		stat = new Statistic('Attack', 5);
	});

	describe('Basic Functionality', () => {
		it('should initialize with base value', () => {
			expect(stat.getBaseValue()).toBe(5);
			expect(stat.getValue()).toBe(5);
		});

		it('should update base value', () => {
			stat.setBaseValue(10);
			expect(stat.getBaseValue()).toBe(10);
			expect(stat.getValue()).toBe(10);
		});

		it('should add modifier and calculate total', () => {
			const mod = createModifier({
				label: 'Test',
				source: 'Test',
				value: 3,
				type: 'status',
				selector: 'attack'
			});

			stat.addModifier(mod);
			expect(stat.getValue()).toBe(8); // 5 base + 3 modifier
		});

		it('should remove modifier', () => {
			const mod = createModifier({
				label: 'Test',
				source: 'Test',
				value: 3,
				type: 'status',
				selector: 'attack'
			});

			stat.addModifier(mod);
			expect(stat.getValue()).toBe(8);

			stat.removeModifier(mod);
			expect(stat.getValue()).toBe(5);
		});

		it('should clear all modifiers', () => {
			stat.addModifier(
				createModifier({
					label: 'A',
					source: 'A',
					value: 1,
					type: 'status',
					selector: 'test'
				})
			);
			stat.addModifier(
				createModifier({
					label: 'B',
					source: 'B',
					value: 2,
					type: 'item',
					selector: 'test'
				})
			);

			expect(stat.getValue()).toBe(8); // 5 + 1 + 2

			stat.clearModifiers();
			expect(stat.getValue()).toBe(5);
		});
	});

	describe('Stacking Rules', () => {
		it('should not stack same-type bonuses', () => {
			stat.addModifier(
				createModifier({
					label: 'Bless',
					source: 'Bless',
					value: 1,
					type: 'status',
					selector: 'attack'
				})
			);
			stat.addModifier(
				createModifier({
					label: 'Heroism',
					source: 'Heroism',
					value: 2,
					type: 'status',
					selector: 'attack'
				})
			);

			expect(stat.getValue()).toBe(7); // 5 base + 2 (highest status)
		});

		it('should stack untyped bonuses', () => {
			stat.addModifier(
				createModifier({
					label: 'A',
					source: 'A',
					value: 2,
					type: 'untyped',
					selector: 'test'
				})
			);
			stat.addModifier(
				createModifier({
					label: 'B',
					source: 'B',
					value: 3,
					type: 'untyped',
					selector: 'test'
				})
			);

			expect(stat.getValue()).toBe(10); // 5 + 2 + 3
		});

		it('should stack all penalties', () => {
			stat.addModifier(
				createModifier({
					label: 'Frightened',
					source: 'Frightened',
					value: -1,
					type: 'status',
					selector: 'test'
				})
			);
			stat.addModifier(
				createModifier({
					label: 'Sickened',
					source: 'Sickened',
					value: -1,
					type: 'status',
					selector: 'test'
				})
			);

			expect(stat.getValue()).toBe(3); // 5 - 1 - 1
		});

		it('should stack different types', () => {
			stat.addModifier(
				createModifier({
					label: 'Status',
					source: 'Status',
					value: 1,
					type: 'status',
					selector: 'test'
				})
			);
			stat.addModifier(
				createModifier({
					label: 'Circumstance',
					source: 'Circumstance',
					value: 1,
					type: 'circumstance',
					selector: 'test'
				})
			);
			stat.addModifier(
				createModifier({
					label: 'Item',
					source: 'Item',
					value: 1,
					type: 'item',
					selector: 'test'
				})
			);

			expect(stat.getValue()).toBe(8); // 5 + 1 + 1 + 1
		});
	});

	describe('Predicates', () => {
		it('should not apply conditional modifier when condition is not active', () => {
			const mod = createModifier({
				label: 'Rage Bonus',
				source: 'Rage',
				value: 2,
				type: 'status',
				selector: 'damage',
				predicate: ['raging']
			});

			stat.addModifier(mod);
			expect(stat.getValue()).toBe(5); // Condition not active
		});

		it('should apply conditional modifier when condition is active', () => {
			const mod = createModifier({
				label: 'Rage Bonus',
				source: 'Rage',
				value: 2,
				type: 'status',
				selector: 'damage',
				predicate: ['raging']
			});

			stat.addModifier(mod);
			stat.addCondition('raging');
			expect(stat.getValue()).toBe(7); // 5 + 2
		});

		it('should handle multiple predicates (all must be true)', () => {
			const mod = createModifier({
				label: 'Special',
				source: 'Special',
				value: 3,
				type: 'status',
				selector: 'test',
				predicate: ['flanking', 'studied-target']
			});

			stat.addModifier(mod);

			// Only one condition active
			stat.addCondition('flanking');
			expect(stat.getValue()).toBe(5); // Not applied

			// Both conditions active
			stat.addCondition('studied-target');
			expect(stat.getValue()).toBe(8); // 5 + 3
		});

		it('should update when conditions change', () => {
			const mod = createModifier({
				label: 'Conditional',
				source: 'Test',
				value: 2,
				type: 'status',
				selector: 'test',
				predicate: ['active']
			});

			stat.addModifier(mod);
			expect(stat.getValue()).toBe(5);

			stat.addCondition('active');
			expect(stat.getValue()).toBe(7);

			stat.removeCondition('active');
			expect(stat.getValue()).toBe(5);
		});
	});

	describe('Enabled/Disabled Modifiers', () => {
		it('should not apply disabled modifiers', () => {
			const mod = createModifier({
				label: 'Toggle',
				source: 'Toggle',
				value: 3,
				type: 'status',
				selector: 'test',
				enabled: false
			});

			stat.addModifier(mod);
			expect(stat.getValue()).toBe(5); // Not applied
		});

		it('should apply when enabled', () => {
			const mod = createModifier({
				label: 'Toggle',
				source: 'Toggle',
				value: 3,
				type: 'status',
				selector: 'test',
				enabled: true
			});

			stat.addModifier(mod);
			expect(stat.getValue()).toBe(8); // 5 + 3
		});
	});

	describe('Breakdown', () => {
		it('should provide detailed breakdown', () => {
			stat.addModifier(
				createModifier({
					label: 'Status',
					source: 'Status',
					value: 2,
					type: 'status',
					selector: 'test'
				})
			);
			stat.addModifier(
				createModifier({
					label: 'Item',
					source: 'Item',
					value: 1,
					type: 'item',
					selector: 'test'
				})
			);

			const breakdown = stat.getBreakdown();
			expect(breakdown.name).toBe('Attack');
			expect(breakdown.baseValue).toBe(5);
			expect(breakdown.totalModifier).toBe(3);
			expect(breakdown.finalValue).toBe(8);
			expect(breakdown.applicableModifiers.length).toBe(2);
		});

		it('should show which bonuses are applied vs suppressed', () => {
			stat.addModifier(
				createModifier({
					label: 'Low',
					source: 'Low',
					value: 1,
					type: 'status',
					selector: 'test'
				})
			);
			stat.addModifier(
				createModifier({
					label: 'High',
					source: 'High',
					value: 2,
					type: 'status',
					selector: 'test'
				})
			);

			const breakdown = stat.getBreakdown();
			const bonuses = breakdown.bonuses;

			expect(bonuses.length).toBe(2);
			expect(bonuses.find((b) => b.modifier.label === 'High')?.applied).toBe(true);
			expect(bonuses.find((b) => b.modifier.label === 'Low')?.applied).toBe(false);
		});

		it('should include penalties in breakdown', () => {
			stat.addModifier(
				createModifier({
					label: 'Frightened',
					source: 'Frightened',
					value: -1,
					type: 'status',
					selector: 'test'
				})
			);

			const breakdown = stat.getBreakdown();
			expect(breakdown.penalties.length).toBe(1);
			expect(breakdown.penalties[0].value).toBe(-1);
		});
	});

	describe('Remove by Source', () => {
		it('should remove all modifiers from a source', () => {
			stat.addModifier(
				createModifier({
					label: 'A',
					source: 'Spell',
					value: 1,
					type: 'status',
					selector: 'test'
				})
			);
			stat.addModifier(
				createModifier({
					label: 'B',
					source: 'Spell',
					value: 2,
					type: 'item',
					selector: 'test'
				})
			);
			stat.addModifier(
				createModifier({
					label: 'C',
					source: 'Feat',
					value: 1,
					type: 'untyped',
					selector: 'test'
				})
			);

			expect(stat.getValue()).toBe(9); // 5 + 1 + 2 + 1

			stat.removeModifiersBySource('Spell');
			expect(stat.getValue()).toBe(6); // 5 + 1 (only Feat remains)
		});
	});
});
