import { describe, it, expect } from 'vitest';
import {
	adaptAncestry,
	getFreeBoostCount,
	getFixedBoostCount,
	getAncestrySpeed
} from './ancestryAdapter';
import type { FoundryAncestry } from '../types/foundry';

describe('Ancestry Adapter', () => {
	const mockFoundryAncestry: FoundryAncestry = {
		_id: 'test-ancestry-id',
		folder: 'folder-id',
		img: 'path/to/image.webp',
		name: 'Test Ancestry',
		type: 'ancestry',
		system: {
			description: {
				value: '<p>Test description</p>'
			},
			hp: 8,
			size: 'med',
			speed: 25,
			boosts: {
				'0': {
					value: ['str', 'dex', 'con', 'int', 'wis', 'cha']
				},
				'1': {
					value: ['str', 'dex', 'con', 'int', 'wis', 'cha']
				}
			},
			flaws: {
				'0': {
					value: []
				}
			},
			languages: {
				value: ['common'],
				custom: ''
			},
			additionalLanguages: {
				count: 1,
				value: ['elvish', 'draconic', 'dwarven'],
				custom: ''
			},
			vision: 'normal',
			reach: 5,
			hands: 2,
			traits: {
				rarity: 'common',
				value: ['humanoid']
			},
			publication: {
				license: 'ORC',
				remaster: true,
				title: 'Pathfinder Player Core'
			},
			rules: []
		}
	};

	describe('adaptAncestry', () => {
		it('should transform basic ancestry properties', () => {
			const ancestry = adaptAncestry(mockFoundryAncestry);

			expect(ancestry.id).toBe('test-ancestry-id');
			expect(ancestry.name).toBe('Test Ancestry');
			expect(ancestry.type).toBe('ancestry');
			expect(ancestry.description).toBe('<p>Test description</p>');
		});

		it('should extract physical attributes', () => {
			const ancestry = adaptAncestry(mockFoundryAncestry);

			expect(ancestry.hp).toBe(8);
			expect(ancestry.size).toBe('med');
			expect(ancestry.speed).toBe(25);
			expect(ancestry.vision).toBe('normal');
		});

		it('should extract ability boosts', () => {
			const ancestry = adaptAncestry(mockFoundryAncestry);

			expect(ancestry.boosts).toHaveLength(2);
			expect(ancestry.boosts[0].index).toBe(0);
			expect(ancestry.boosts[0].options).toHaveLength(6);
			expect(ancestry.boosts[0].free).toBe(true);
			expect(ancestry.boosts[1].index).toBe(1);
			expect(ancestry.boosts[1].free).toBe(true);
		});

		it('should handle fixed ability boosts', () => {
			const ancestryWithFixedBoosts: FoundryAncestry = {
				...mockFoundryAncestry,
				system: {
					...mockFoundryAncestry.system,
					boosts: {
						'0': {
							value: ['con', 'wis']
						},
						'1': {
							value: ['str', 'dex', 'con', 'int', 'wis', 'cha']
						}
					}
				}
			};

			const ancestry = adaptAncestry(ancestryWithFixedBoosts);

			expect(ancestry.boosts[0].options).toEqual(['con', 'wis']);
			expect(ancestry.boosts[0].free).toBe(false);
			expect(ancestry.boosts[1].free).toBe(true);
		});

		it('should extract ability flaws', () => {
			const ancestryWithFlaws: FoundryAncestry = {
				...mockFoundryAncestry,
				system: {
					...mockFoundryAncestry.system,
					flaws: {
						'0': {
							value: ['int']
						}
					}
				}
			};

			const ancestry = adaptAncestry(ancestryWithFlaws);

			expect(ancestry.flaws).toHaveLength(1);
			expect(ancestry.flaws[0].index).toBe(0);
			expect(ancestry.flaws[0].options).toEqual(['int']);
		});

		it('should extract languages', () => {
			const ancestry = adaptAncestry(mockFoundryAncestry);

			expect(ancestry.languages).toEqual(['common']);
			expect(ancestry.additionalLanguages.count).toBe(1);
			expect(ancestry.additionalLanguages.options).toContain('elvish');
			expect(ancestry.additionalLanguages.options).toContain('draconic');
		});

		it('should extract traits and rarity', () => {
			const ancestry = adaptAncestry(mockFoundryAncestry);

			expect(ancestry.traits).toEqual(['humanoid']);
			expect(ancestry.rarity).toBe('common');
		});

		it('should extract source information', () => {
			const ancestry = adaptAncestry(mockFoundryAncestry);

			expect(ancestry.source.title).toBe('Pathfinder Player Core');
			expect(ancestry.source.license).toBe('ORC');
			expect(ancestry.source.remaster).toBe(true);
		});
	});

	describe('Helper Functions', () => {
		it('should get ancestry speed', () => {
			const ancestry = adaptAncestry(mockFoundryAncestry);
			expect(getAncestrySpeed(ancestry)).toBe(25);
		});

		it('should count free boosts correctly', () => {
			const ancestry = adaptAncestry(mockFoundryAncestry);
			expect(getFreeBoostCount(ancestry)).toBe(2);
		});

		it('should count fixed boosts correctly', () => {
			const ancestryWithMixedBoosts: FoundryAncestry = {
				...mockFoundryAncestry,
				system: {
					...mockFoundryAncestry.system,
					boosts: {
						'0': {
							value: ['con', 'wis']
						},
						'1': {
							value: ['str', 'dex', 'con', 'int', 'wis', 'cha']
						}
					}
				}
			};

			const ancestry = adaptAncestry(ancestryWithMixedBoosts);
			expect(getFixedBoostCount(ancestry)).toBe(1);
			expect(getFreeBoostCount(ancestry)).toBe(1);
		});
	});
});
