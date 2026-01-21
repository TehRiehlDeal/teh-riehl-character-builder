import { describe, it, expect } from 'vitest';
import {
	adaptBackground,
	getBoostCount,
	getFreeBoostCount,
	getTrainedSkills
} from './backgroundAdapter';
import type { FoundryBackground } from '../types/foundry';

describe('Background Adapter', () => {
	const mockFoundryBackground: FoundryBackground = {
		_id: 'test-background-id',
		folder: 'folder-id',
		img: 'path/to/image.webp',
		name: 'Test Background',
		type: 'background',
		system: {
			description: {
				value: '<p>Test background description</p>'
			},
			boosts: {
				'0': {
					value: ['int', 'wis']
				},
				'1': {
					value: ['str', 'dex', 'con', 'int', 'wis', 'cha']
				}
			},
			trainedSkills: {
				value: ['religion']
			},
			traits: {
				rarity: 'common',
				value: []
			},
			publication: {
				license: 'ORC',
				remaster: true,
				title: 'Pathfinder Player Core'
			},
			rules: []
		}
	};

	describe('adaptBackground', () => {
		it('should transform basic background properties', () => {
			const background = adaptBackground(mockFoundryBackground);

			expect(background.id).toBe('test-background-id');
			expect(background.name).toBe('Test Background');
			expect(background.type).toBe('background');
			expect(background.description).toBe('<p>Test background description</p>');
		});

		it('should extract ability boosts', () => {
			const background = adaptBackground(mockFoundryBackground);

			expect(background.boosts).toHaveLength(2);
			expect(background.boosts[0].index).toBe(0);
			expect(background.boosts[0].options).toEqual(['int', 'wis']);
			expect(background.boosts[0].free).toBe(false);
			expect(background.boosts[1].index).toBe(1);
			expect(background.boosts[1].free).toBe(true);
		});

		it('should extract trained skills', () => {
			const background = adaptBackground(mockFoundryBackground);

			expect(background.trainedSkills).toEqual(['religion']);
		});

		it('should handle multiple trained skills', () => {
			const bgWithMultipleSkills: FoundryBackground = {
				...mockFoundryBackground,
				system: {
					...mockFoundryBackground.system,
					trainedSkills: {
						value: ['athletics', 'acrobatics']
					}
				}
			};

			const background = adaptBackground(bgWithMultipleSkills);
			expect(background.trainedSkills).toEqual(['athletics', 'acrobatics']);
		});

		it('should extract traits and source', () => {
			const background = adaptBackground(mockFoundryBackground);

			expect(background.traits).toEqual([]);
			expect(background.rarity).toBe('common');
			expect(background.source.title).toBe('Pathfinder Player Core');
			expect(background.source.license).toBe('ORC');
			expect(background.source.remaster).toBe(true);
		});
	});

	describe('Helper Functions', () => {
		it('should count total boosts', () => {
			const background = adaptBackground(mockFoundryBackground);
			expect(getBoostCount(background)).toBe(2);
		});

		it('should count free boosts', () => {
			const background = adaptBackground(mockFoundryBackground);
			expect(getFreeBoostCount(background)).toBe(1);
		});

		it('should get trained skills', () => {
			const background = adaptBackground(mockFoundryBackground);
			expect(getTrainedSkills(background)).toEqual(['religion']);
		});

		it('should handle background with all free boosts', () => {
			const allFreeBoosts: FoundryBackground = {
				...mockFoundryBackground,
				system: {
					...mockFoundryBackground.system,
					boosts: {
						'0': {
							value: ['str', 'dex', 'con', 'int', 'wis', 'cha']
						},
						'1': {
							value: ['str', 'dex', 'con', 'int', 'wis', 'cha']
						}
					}
				}
			};

			const background = adaptBackground(allFreeBoosts);
			expect(getFreeBoostCount(background)).toBe(2);
		});
	});
});
