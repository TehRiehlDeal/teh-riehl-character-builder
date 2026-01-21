import { describe, it, expect } from 'vitest';
import {
	evaluatePredicate,
	createPredicateContext,
	addRollOption,
	removeRollOption,
	hasRollOption,
	type PredicateContext
} from './index';

describe('Predicate System', () => {
	describe('evaluatePredicate', () => {
		it('returns true for undefined predicate', () => {
			const context = createPredicateContext({});
			expect(evaluatePredicate(undefined, context)).toBe(true);
		});

		it('returns true for empty predicate array', () => {
			const context = createPredicateContext({});
			expect(evaluatePredicate([], context)).toBe(true);
		});

		it('evaluates simple roll option predicates', () => {
			const context = createPredicateContext({ options: ['flanking', 'flat-footed'] });

			expect(evaluatePredicate(['flanking'], context)).toBe(true);
			expect(evaluatePredicate(['flat-footed'], context)).toBe(true);
			expect(evaluatePredicate(['rage'], context)).toBe(false);
		});

		it('evaluates effect predicates', () => {
			const context = createPredicateContext({
				effects: ['rage', 'bless']
			});

			expect(evaluatePredicate(['self:effect:rage'], context)).toBe(true);
			expect(evaluatePredicate(['self:effect:bless'], context)).toBe(true);
			expect(evaluatePredicate(['self:effect:haste'], context)).toBe(false);
		});

		it('evaluates trait predicates', () => {
			const context = createPredicateContext({
				traits: ['human', 'humanoid']
			});

			expect(evaluatePredicate(['self:trait:human'], context)).toBe(true);
			expect(evaluatePredicate(['self:trait:humanoid'], context)).toBe(true);
			expect(evaluatePredicate(['self:trait:undead'], context)).toBe(false);
		});

		it('evaluates level predicates', () => {
			const context = createPredicateContext({ level: 5 });

			expect(evaluatePredicate(['self:level:5'], context)).toBe(true);
			expect(evaluatePredicate(['self:level:3'], context)).toBe(false);

			expect(evaluatePredicate(['self:level:gte:5'], context)).toBe(true);
			expect(evaluatePredicate(['self:level:gte:4'], context)).toBe(true);
			expect(evaluatePredicate(['self:level:gte:6'], context)).toBe(false);

			expect(evaluatePredicate(['self:level:lte:5'], context)).toBe(true);
			expect(evaluatePredicate(['self:level:lte:6'], context)).toBe(true);
			expect(evaluatePredicate(['self:level:lte:4'], context)).toBe(false);

			expect(evaluatePredicate(['self:level:gt:4'], context)).toBe(true);
			expect(evaluatePredicate(['self:level:gt:5'], context)).toBe(false);

			expect(evaluatePredicate(['self:level:lt:6'], context)).toBe(true);
			expect(evaluatePredicate(['self:level:lt:5'], context)).toBe(false);
		});

		it('evaluates multiple predicates with AND logic', () => {
			const context = createPredicateContext({
				options: ['flanking'],
				effects: ['rage'],
				level: 5
			});

			// All must be true
			expect(evaluatePredicate(['flanking', 'self:effect:rage'], context)).toBe(true);
			expect(evaluatePredicate(['flanking', 'self:effect:rage', 'self:level:gte:5'], context)).toBe(
				true
			);

			// If any is false, result is false
			expect(evaluatePredicate(['flanking', 'self:effect:haste'], context)).toBe(false);
			expect(evaluatePredicate(['flanking', 'self:level:gte:10'], context)).toBe(false);
		});

		it('evaluates complex predicates with AND/OR/NOT', () => {
			const context = createPredicateContext({
				options: ['flanking'],
				effects: ['rage']
			});

			// AND logic
			expect(
				evaluatePredicate(
					[
						{
							and: ['flanking', 'self:effect:rage']
						}
					],
					context
				)
			).toBe(true);

			expect(
				evaluatePredicate(
					[
						{
							and: ['flanking', 'self:effect:haste']
						}
					],
					context
				)
			).toBe(false);

			// OR logic
			expect(
				evaluatePredicate(
					[
						{
							or: ['flanking', 'self:effect:haste']
						}
					],
					context
				)
			).toBe(true);

			expect(
				evaluatePredicate(
					[
						{
							or: ['flat-footed', 'self:effect:haste']
						}
					],
					context
				)
			).toBe(false);

			// NOT logic
			expect(
				evaluatePredicate(
					[
						{
							not: 'self:effect:haste'
						}
					],
					context
				)
			).toBe(true);

			expect(
				evaluatePredicate(
					[
						{
							not: 'self:effect:rage'
						}
					],
					context
				)
			).toBe(false);
		});
	});

	describe('Roll Option Management', () => {
		it('creates context with roll options', () => {
			const context = createPredicateContext({ options: ['flanking', 'flat-footed'] });
			expect(hasRollOption(context, 'flanking')).toBe(true);
			expect(hasRollOption(context, 'flat-footed')).toBe(true);
			expect(hasRollOption(context, 'rage')).toBe(false);
		});

		it('adds roll options', () => {
			const context = createPredicateContext({});
			expect(hasRollOption(context, 'flanking')).toBe(false);

			addRollOption(context, 'flanking');
			expect(hasRollOption(context, 'flanking')).toBe(true);
		});

		it('removes roll options', () => {
			const context = createPredicateContext({ options: ['flanking'] });
			expect(hasRollOption(context, 'flanking')).toBe(true);

			removeRollOption(context, 'flanking');
			expect(hasRollOption(context, 'flanking')).toBe(false);
		});
	});
});
