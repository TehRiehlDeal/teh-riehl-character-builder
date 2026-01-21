import { describe, it, expect } from 'vitest';
import { processFlatModifier, type FlatModifierRuleElement } from './flatModifier';

describe('FlatModifier Rule Element', () => {
	const context = {
		source: 'Test Source',
		level: 5,
		actor: {
			level: 5
		}
	};

	describe('Basic Processing', () => {
		it('should create a modifier with numeric value', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'speed',
				value: 5,
				type: 'untyped',
				label: 'Fleet Feat'
			};

			const modifier = processFlatModifier(rule, context);

			expect(modifier).not.toBeNull();
			expect(modifier?.value).toBe(5);
			expect(modifier?.type).toBe('untyped');
			expect(modifier?.selector).toBe('speed');
			expect(modifier?.label).toBe('Fleet Feat');
			expect(modifier?.source).toBe('Test Source');
		});

		it('should default to untyped if no type specified', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'ac',
				value: 1
			};

			const modifier = processFlatModifier(rule, context);

			expect(modifier?.type).toBe('untyped');
		});

		it('should generate label if not provided', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'attack',
				value: 2,
				type: 'status'
			};

			const modifier = processFlatModifier(rule, context);

			expect(modifier?.label).toBe('+2 Attack');
		});

		it('should handle negative values in label', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'ac',
				value: -2
			};

			const modifier = processFlatModifier(rule, context);

			expect(modifier?.label).toBe('-2 Ac');
		});
	});

	describe('Formula Evaluation', () => {
		it('should resolve @actor.level', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'damage',
				value: '@actor.level'
			};

			const modifier = processFlatModifier(rule, context);

			expect(modifier?.value).toBe(5); // context.level is 5
		});

		it('should resolve @actor.level * 2', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'damage',
				value: '@actor.level * 2'
			};

			const modifier = processFlatModifier(rule, context);

			expect(modifier?.value).toBe(10); // 5 * 2
		});

		it('should resolve @actor.level / 2', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'damage',
				value: '@actor.level / 2'
			};

			const modifier = processFlatModifier(rule, context);

			expect(modifier?.value).toBe(2); // floor(5 / 2)
		});

		it('should handle string numbers', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'ac',
				value: '3'
			};

			const modifier = processFlatModifier(rule, context);

			expect(modifier?.value).toBe(3);
		});

		it('should return null for unparseable formulas', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'ac',
				value: '@invalid.formula'
			};

			const modifier = processFlatModifier(rule, context);

			expect(modifier).toBeNull();
		});
	});

	describe('Predicates', () => {
		it('should include predicate in modifier', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'damage',
				value: 2,
				predicate: ['raging']
			};

			const modifier = processFlatModifier(rule, context);

			expect(modifier?.predicate).toEqual(['raging']);
		});

		it('should handle multiple predicates', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'attack',
				value: 1,
				predicate: ['flanking', 'studied-target']
			};

			const modifier = processFlatModifier(rule, context);

			expect(modifier?.predicate).toEqual(['flanking', 'studied-target']);
		});
	});

	describe('Enabled State', () => {
		it('should default to enabled if not specified', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'ac',
				value: 1
			};

			const modifier = processFlatModifier(rule, context);

			expect(modifier?.enabled).toBe(true);
		});

		it('should respect enabled: false', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'ac',
				value: 1,
				enabled: false
			};

			const modifier = processFlatModifier(rule, context);

			expect(modifier?.enabled).toBe(false);
		});
	});

	describe('Different Modifier Types', () => {
		it('should create status modifier', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'attack',
				value: 1,
				type: 'status'
			};

			const modifier = processFlatModifier(rule, context);

			expect(modifier?.type).toBe('status');
		});

		it('should create circumstance modifier', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'ac',
				value: 2,
				type: 'circumstance'
			};

			const modifier = processFlatModifier(rule, context);

			expect(modifier?.type).toBe('circumstance');
		});

		it('should create item modifier', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'attack',
				value: 1,
				type: 'item'
			};

			const modifier = processFlatModifier(rule, context);

			expect(modifier?.type).toBe('item');
		});

		it('should create untyped modifier', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'speed',
				value: 10,
				type: 'untyped'
			};

			const modifier = processFlatModifier(rule, context);

			expect(modifier?.type).toBe('untyped');
		});
	});

	describe('Real-World Examples', () => {
		it('should process Fleet feat correctly', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'speed',
				value: 5,
				type: 'untyped',
				label: 'Fleet'
			};

			const modifier = processFlatModifier(rule, context);

			expect(modifier?.label).toBe('Fleet');
			expect(modifier?.value).toBe(5);
			expect(modifier?.type).toBe('untyped');
			expect(modifier?.selector).toBe('speed');
		});

		it('should process Bless spell correctly', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'attack',
				value: 1,
				type: 'status',
				label: 'Bless'
			};

			const modifier = processFlatModifier(rule, {
				source: 'Bless Spell',
				level: 5
			});

			expect(modifier?.label).toBe('Bless');
			expect(modifier?.value).toBe(1);
			expect(modifier?.type).toBe('status');
			expect(modifier?.source).toBe('Bless Spell');
		});

		it('should process level-scaled modifier', () => {
			const rule: FlatModifierRuleElement = {
				key: 'FlatModifier',
				selector: 'damage',
				value: '@actor.level / 2',
				label: 'Rage Damage'
			};

			const modifier = processFlatModifier(rule, {
				source: 'Rage',
				level: 10,
				actor: { level: 10 }
			});

			expect(modifier?.value).toBe(5); // floor(10 / 2)
		});
	});
});
