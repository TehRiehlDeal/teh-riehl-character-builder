import { describe, it, expect } from 'vitest';
import { adaptFeat, filterFeatsByCategory, filterFeatsByLevel, hasPrerequisites } from './featAdapter';
import type { FoundryFeat } from '../types/foundry';

describe('Feat Adapter', () => {
	const mockFoundryFeat: FoundryFeat = {
		_id: 'test-feat-id',
		folder: 'folder-id',
		img: 'path/to/image.webp',
		name: 'Test Feat',
		type: 'feat',
		system: {
			description: {
				value: '<p>Test description</p>'
			},
			level: {
				value: 1
			},
			category: 'general',
			prerequisites: {
				value: []
			},
			actionType: {
				value: 'passive'
			},
			actions: {
				value: null
			},
			traits: {
				rarity: 'common',
				value: ['general']
			},
			publication: {
				license: 'ORC',
				remaster: true,
				title: 'Pathfinder Player Core'
			},
			rules: [
				{
					key: 'FlatModifier',
					selector: 'speed',
					value: 5
				}
			]
		}
	};

	describe('adaptFeat', () => {
		it('should transform basic feat properties', () => {
			const feat = adaptFeat(mockFoundryFeat);

			expect(feat.id).toBe('test-feat-id');
			expect(feat.name).toBe('Test Feat');
			expect(feat.type).toBe('feat');
			expect(feat.description).toBe('<p>Test description</p>');
			expect(feat.level).toBe(1);
			expect(feat.category).toBe('general');
		});

		it('should extract traits and rarity', () => {
			const feat = adaptFeat(mockFoundryFeat);

			expect(feat.traits).toEqual(['general']);
			expect(feat.rarity).toBe('common');
		});

		it('should extract source information', () => {
			const feat = adaptFeat(mockFoundryFeat);

			expect(feat.source.title).toBe('Pathfinder Player Core');
			expect(feat.source.license).toBe('ORC');
			expect(feat.source.remaster).toBe(true);
		});

		it('should pass through rule elements unchanged', () => {
			const feat = adaptFeat(mockFoundryFeat);

			expect(feat.rules).toHaveLength(1);
			expect(feat.rules[0]).toEqual({
				key: 'FlatModifier',
				selector: 'speed',
				value: 5
			});
		});

		it('should handle empty prerequisites', () => {
			const feat = adaptFeat(mockFoundryFeat);

			expect(feat.prerequisites).toEqual([]);
		});

		it('should extract prerequisites correctly', () => {
			const featWithPrereqs: FoundryFeat = {
				...mockFoundryFeat,
				system: {
					...mockFoundryFeat.system,
					prerequisites: {
						value: [
							{ value: 'trained in Athletics' },
							{ value: 'Strength 14' }
						]
					}
				}
			};

			const feat = adaptFeat(featWithPrereqs);

			expect(feat.prerequisites).toEqual([
				'trained in Athletics',
				'Strength 14'
			]);
		});

		it('should not set actionType for passive abilities', () => {
			const feat = adaptFeat(mockFoundryFeat);

			expect(feat.actionType).toBeUndefined();
			expect(feat.actions).toBeUndefined();
		});

		it('should extract action type for action abilities', () => {
			const actionFeat: FoundryFeat = {
				...mockFoundryFeat,
				system: {
					...mockFoundryFeat.system,
					actionType: {
						value: 'action'
					},
					actions: {
						value: 1
					}
				}
			};

			const feat = adaptFeat(actionFeat);

			expect(feat.actionType).toBe('action');
			expect(feat.actions).toBe(1);
		});

		it('should handle reaction feats', () => {
			const reactionFeat: FoundryFeat = {
				...mockFoundryFeat,
				system: {
					...mockFoundryFeat.system,
					actionType: {
						value: 'reaction'
					}
				}
			};

			const feat = adaptFeat(reactionFeat);

			expect(feat.actionType).toBe('reaction');
		});

		it('should handle free action feats', () => {
			const freeFeat: FoundryFeat = {
				...mockFoundryFeat,
				system: {
					...mockFoundryFeat.system,
					actionType: {
						value: 'free'
					}
				}
			};

			const feat = adaptFeat(freeFeat);

			expect(feat.actionType).toBe('free');
		});
	});

	describe('filterFeatsByCategory', () => {
		const mockFeats = [
			adaptFeat(mockFoundryFeat),
			adaptFeat({ ...mockFoundryFeat, _id: '2', system: { ...mockFoundryFeat.system, category: 'skill' } }),
			adaptFeat({ ...mockFoundryFeat, _id: '3', system: { ...mockFoundryFeat.system, category: 'class' } })
		];

		it('should filter feats by category', () => {
			const generalFeats = filterFeatsByCategory(mockFeats, 'general');
			expect(generalFeats).toHaveLength(1);
			expect(generalFeats[0].category).toBe('general');

			const skillFeats = filterFeatsByCategory(mockFeats, 'skill');
			expect(skillFeats).toHaveLength(1);
			expect(skillFeats[0].category).toBe('skill');
		});
	});

	describe('filterFeatsByLevel', () => {
		const mockFeats = [
			adaptFeat(mockFoundryFeat),
			adaptFeat({ ...mockFoundryFeat, _id: '2', system: { ...mockFoundryFeat.system, level: { value: 3 } } }),
			adaptFeat({ ...mockFoundryFeat, _id: '3', system: { ...mockFoundryFeat.system, level: { value: 7 } } })
		];

		it('should filter feats by level', () => {
			const level1Feats = filterFeatsByLevel(mockFeats, 1);
			expect(level1Feats).toHaveLength(1);
			expect(level1Feats[0].level).toBe(1);

			const level3Feats = filterFeatsByLevel(mockFeats, 3);
			expect(level3Feats).toHaveLength(1);
			expect(level3Feats[0].level).toBe(3);
		});
	});

	describe('hasPrerequisites', () => {
		it('should return false for feats without prerequisites', () => {
			const feat = adaptFeat(mockFoundryFeat);
			expect(hasPrerequisites(feat)).toBe(false);
		});

		it('should return true for feats with prerequisites', () => {
			const featWithPrereqs: FoundryFeat = {
				...mockFoundryFeat,
				system: {
					...mockFoundryFeat.system,
					prerequisites: {
						value: [{ value: 'trained in Athletics' }]
					}
				}
			};

			const feat = adaptFeat(featWithPrereqs);
			expect(hasPrerequisites(feat)).toBe(true);
		});
	});
});
