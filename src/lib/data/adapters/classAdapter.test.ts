import { describe, it, expect } from 'vitest';
import {
	adaptClass,
	getFeatSlotsAtLevel,
	getTotalTrainedSkills,
	hasArmorProficiency
} from './classAdapter';
import type { FoundryClass } from '../types/foundry';

describe('Class Adapter', () => {
	const mockFoundryClass: FoundryClass = {
		_id: 'test-class-id',
		folder: 'folder-id',
		img: 'path/to/image.webp',
		name: 'Test Class',
		type: 'class',
		system: {
			description: {
				value: '<p>Test class description</p>'
			},
			hp: 10,
			keyAbility: {
				value: ['str', 'dex']
			},
			perception: 2,
			savingThrows: {
				fortitude: 2,
				reflex: 2,
				will: 1
			},
			attacks: {
				simple: 2,
				martial: 2,
				advanced: 1,
				unarmed: 2
			},
			defenses: {
				unarmored: 1,
				light: 1,
				medium: 1,
				heavy: 1
			},
			ancestryFeatLevels: {
				value: [1, 5, 9, 13, 17]
			},
			classFeatLevels: {
				value: [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
			},
			generalFeatLevels: {
				value: [3, 7, 11, 15, 19]
			},
			skillFeatLevels: {
				value: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
			},
			trainedSkills: {
				value: [],
				additional: 3
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

	describe('adaptClass', () => {
		it('should transform basic class properties', () => {
			const classData = adaptClass(mockFoundryClass);

			expect(classData.id).toBe('test-class-id');
			expect(classData.name).toBe('Test Class');
			expect(classData.type).toBe('class');
			expect(classData.description).toBe('<p>Test class description</p>');
		});

		it('should extract HP and key ability', () => {
			const classData = adaptClass(mockFoundryClass);

			expect(classData.hp).toBe(10);
			expect(classData.keyAbility).toEqual(['str', 'dex']);
		});

		it('should extract proficiencies', () => {
			const classData = adaptClass(mockFoundryClass);

			expect(classData.proficiencies.perception).toBe(2);
			expect(classData.proficiencies.fortitude).toBe(2);
			expect(classData.proficiencies.reflex).toBe(2);
			expect(classData.proficiencies.will).toBe(1);
			expect(classData.proficiencies.classDC).toBe(1);
		});

		it('should extract attack proficiencies', () => {
			const classData = adaptClass(mockFoundryClass);

			expect(classData.proficiencies.attacks.simple).toBe(2);
			expect(classData.proficiencies.attacks.martial).toBe(2);
			expect(classData.proficiencies.attacks.advanced).toBe(1);
			expect(classData.proficiencies.attacks.unarmed).toBe(2);
		});

		it('should extract defense proficiencies', () => {
			const classData = adaptClass(mockFoundryClass);

			expect(classData.proficiencies.defenses.unarmored).toBe(1);
			expect(classData.proficiencies.defenses.light).toBe(1);
			expect(classData.proficiencies.defenses.medium).toBe(1);
			expect(classData.proficiencies.defenses.heavy).toBe(1);
		});

		it('should extract skill training', () => {
			const classData = adaptClass(mockFoundryClass);

			expect(classData.skills.trained).toEqual([]);
			expect(classData.skills.additional).toBe(3);
		});

		it('should extract feat slots', () => {
			const classData = adaptClass(mockFoundryClass);

			expect(classData.featSlots.ancestry).toEqual([1, 5, 9, 13, 17]);
			expect(classData.featSlots.class).toEqual([1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
			expect(classData.featSlots.general).toEqual([3, 7, 11, 15, 19]);
			expect(classData.featSlots.skill).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
		});

		it('should extract traits and source', () => {
			const classData = adaptClass(mockFoundryClass);

			expect(classData.traits).toEqual([]);
			expect(classData.rarity).toBe('common');
			expect(classData.source.title).toBe('Pathfinder Player Core');
			expect(classData.source.license).toBe('ORC');
			expect(classData.source.remaster).toBe(true);
		});
	});

	describe('Helper Functions', () => {
		it('should get feat slots at level 1', () => {
			const classData = adaptClass(mockFoundryClass);
			const slots = getFeatSlotsAtLevel(classData, 1);

			expect(slots.ancestry).toBe(true);
			expect(slots.class).toBe(true);
			expect(slots.general).toBe(false);
			expect(slots.skill).toBe(false);
		});

		it('should get feat slots at level 2', () => {
			const classData = adaptClass(mockFoundryClass);
			const slots = getFeatSlotsAtLevel(classData, 2);

			expect(slots.ancestry).toBe(false);
			expect(slots.class).toBe(true);
			expect(slots.general).toBe(false);
			expect(slots.skill).toBe(true);
		});

		it('should get total trained skills', () => {
			const classData = adaptClass(mockFoundryClass);
			expect(getTotalTrainedSkills(classData)).toBe(3);
		});

		it('should check armor proficiency', () => {
			const classData = adaptClass(mockFoundryClass);

			expect(hasArmorProficiency(classData, 'unarmored')).toBe(true);
			expect(hasArmorProficiency(classData, 'light')).toBe(true);
			expect(hasArmorProficiency(classData, 'medium')).toBe(true);
			expect(hasArmorProficiency(classData, 'heavy')).toBe(true);
		});

		it('should return false for untrained armor', () => {
			const classNoHeavy: FoundryClass = {
				...mockFoundryClass,
				system: {
					...mockFoundryClass.system,
					defenses: {
						unarmored: 1,
						light: 1,
						medium: 1,
						heavy: 0
					}
				}
			};

			const classData = adaptClass(classNoHeavy);
			expect(hasArmorProficiency(classData, 'heavy')).toBe(false);
		});
	});
});
