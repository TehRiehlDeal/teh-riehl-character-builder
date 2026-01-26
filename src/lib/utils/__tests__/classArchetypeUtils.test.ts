/**
 * Tests for Class Archetype Utilities
 */

import { describe, it, expect } from 'vitest';
import {
	extractGrantedItems,
	extractItemNameFromUUID,
	isDedicationFeat,
	isClassFeature,
	getGrantedItemsAtLevel,
	getDedicationFeat,
	getImmediateClassFeatures,
	type GrantedItem
} from '../classArchetypeUtils';
import type { ClassArchetype } from '$lib/data/types/app';

describe('Class Archetype Utils', () => {
	describe('extractGrantedItems()', () => {
		it('should extract GrantItem rules', () => {
			const archetype: ClassArchetype = {
				id: 'test',
				name: 'Test Archetype',
				type: 'class-archetype',
				category: 'class',
				description: 'Test',
				traits: ['class-archetype'],
				rarity: 'common',
				rules: [
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.feats.Item.Test Dedication'
					}
				]
			};

			const result = extractGrantedItems(archetype);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				uuid: 'Compendium.pf2e.feats.Item.Test Dedication',
				level: 1,
				flag: undefined,
				isDynamic: false
			});
		});

		it('should parse level from predicate', () => {
			const archetype: ClassArchetype = {
				id: 'test',
				name: 'Test Archetype',
				type: 'class-archetype',
				category: 'class',
				description: 'Test',
				traits: ['class-archetype'],
				rarity: 'common',
				rules: [
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.feats.Item.Advanced Feature',
						predicate: [{ gte: ['self:level', 4] }]
					}
				]
			};

			const result = extractGrantedItems(archetype);

			expect(result[0].level).toBe(4);
		});

		it('should default to level 1 when no predicate', () => {
			const archetype: ClassArchetype = {
				id: 'test',
				name: 'Test Archetype',
				type: 'class-archetype',
				category: 'class',
				description: 'Test',
				traits: ['class-archetype'],
				rarity: 'common',
				rules: [
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.classfeatures.Item.Immediate Feature'
					}
				]
			};

			const result = extractGrantedItems(archetype);

			expect(result[0].level).toBe(1);
		});

		it('should detect dynamic grants with curly braces', () => {
			const archetype: ClassArchetype = {
				id: 'test',
				name: 'Test Archetype',
				type: 'class-archetype',
				category: 'class',
				description: 'Test',
				traits: ['class-archetype'],
				rarity: 'common',
				rules: [
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.classfeatures.Item.{item|flags.pf2e.rulesSelections.researchField}'
					}
				]
			};

			const result = extractGrantedItems(archetype);

			expect(result[0].isDynamic).toBe(true);
		});

		it('should detect dynamic grants with pipe', () => {
			const archetype: ClassArchetype = {
				id: 'test',
				name: 'Test Archetype',
				type: 'class-archetype',
				category: 'class',
				description: 'Test',
				traits: ['class-archetype'],
				rarity: 'common',
				rules: [
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.classfeatures.Item.Advanced Field Discovery|fieldDiscovery'
					}
				]
			};

			const result = extractGrantedItems(archetype);

			expect(result[0].isDynamic).toBe(true);
		});

		it('should include flag when present', () => {
			const archetype: ClassArchetype = {
				id: 'test',
				name: 'Test Archetype',
				type: 'class-archetype',
				category: 'class',
				description: 'Test',
				traits: ['class-archetype'],
				rarity: 'common',
				rules: [
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.classfeatures.Item.Feature',
						flag: 'testFlag'
					}
				]
			};

			const result = extractGrantedItems(archetype);

			expect(result[0].flag).toBe('testFlag');
		});

		it('should return empty array when no GrantItem rules', () => {
			const archetype: ClassArchetype = {
				id: 'test',
				name: 'Test Archetype',
				type: 'class-archetype',
				category: 'class',
				description: 'Test',
				traits: ['class-archetype'],
				rarity: 'common',
				rules: [
					{
						key: 'FlatModifier',
						selector: 'ac',
						value: 1
					}
				]
			};

			const result = extractGrantedItems(archetype);

			expect(result).toEqual([]);
		});

		it('should handle multiple GrantItem rules', () => {
			const archetype: ClassArchetype = {
				id: 'test',
				name: 'Test Archetype',
				type: 'class-archetype',
				category: 'class',
				description: 'Test',
				traits: ['class-archetype'],
				rarity: 'common',
				rules: [
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.feats.Item.Test Dedication'
					},
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.classfeatures.Item.Feature1',
						predicate: [{ gte: ['self:level', 2] }]
					},
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.classfeatures.Item.Feature2',
						predicate: [{ gte: ['self:level', 4] }]
					}
				]
			};

			const result = extractGrantedItems(archetype);

			expect(result).toHaveLength(3);
			expect(result[0].level).toBe(1);
			expect(result[1].level).toBe(2);
			expect(result[2].level).toBe(4);
		});
	});

	describe('extractItemNameFromUUID()', () => {
		it('should extract name from standard UUID', () => {
			const uuid = 'Compendium.pf2e.classfeatures.Item.School of Thassilonian Rune Magic';
			const result = extractItemNameFromUUID(uuid);
			expect(result).toBe('School of Thassilonian Rune Magic');
		});

		it('should handle names with multiple periods', () => {
			const uuid = 'Compendium.pf2e.classfeatures.Item.Name.With.Periods';
			const result = extractItemNameFromUUID(uuid);
			expect(result).toBe('Name.With.Periods');
		});

		it('should return null for non-Compendium UUID', () => {
			const uuid = 'Some.Other.Format';
			const result = extractItemNameFromUUID(uuid);
			expect(result).toBeNull();
		});

		it('should return null for malformed UUID', () => {
			const uuid = 'Compendium.pf2e.classfeatures';
			const result = extractItemNameFromUUID(uuid);
			expect(result).toBeNull();
		});

		it('should handle feat UUIDs', () => {
			const uuid = 'Compendium.pf2e.feats.Item.Test Dedication';
			const result = extractItemNameFromUUID(uuid);
			expect(result).toBe('Test Dedication');
		});
	});

	describe('isDedicationFeat()', () => {
		it('should return true for dedication feat', () => {
			const item: GrantedItem = {
				uuid: 'Compendium.pf2e.feats.Item.Alchemist Dedication',
				level: 2,
				isDynamic: false
			};

			expect(isDedicationFeat(item)).toBe(true);
		});

		it('should return false for non-dedication feat', () => {
			const item: GrantedItem = {
				uuid: 'Compendium.pf2e.feats.Item.Power Attack',
				level: 1,
				isDynamic: false
			};

			expect(isDedicationFeat(item)).toBe(false);
		});

		it('should return true for dedication in class feature', () => {
			const item: GrantedItem = {
				uuid: 'Compendium.pf2e.classfeatures.Item.Champion Dedication',
				level: 2,
				isDynamic: false
			};

			expect(isDedicationFeat(item)).toBe(true);
		});
	});

	describe('isClassFeature()', () => {
		it('should return true for class feature', () => {
			const item: GrantedItem = {
				uuid: 'Compendium.pf2e.classfeatures.Item.Rage',
				level: 1,
				isDynamic: false
			};

			expect(isClassFeature(item)).toBe(true);
		});

		it('should return false for feat', () => {
			const item: GrantedItem = {
				uuid: 'Compendium.pf2e.feats.Item.Test Dedication',
				level: 2,
				isDynamic: false
			};

			expect(isClassFeature(item)).toBe(false);
		});
	});

	describe('getGrantedItemsAtLevel()', () => {
		const mockArchetype: ClassArchetype = {
			id: 'test',
			name: 'Test Archetype',
			type: 'class-archetype',
			category: 'class',
			description: 'Test',
			traits: ['class-archetype'],
			rarity: 'common',
			rules: [
				{
					key: 'GrantItem',
					uuid: 'Compendium.pf2e.classfeatures.Item.Feature1'
				},
				{
					key: 'GrantItem',
					uuid: 'Compendium.pf2e.feats.Item.Test Dedication',
					predicate: [{ gte: ['self:level', 2] }]
				},
				{
					key: 'GrantItem',
					uuid: 'Compendium.pf2e.classfeatures.Item.Feature2',
					predicate: [{ gte: ['self:level', 4] }]
				}
			]
		};

		it('should return items granted at level 1', () => {
			const result = getGrantedItemsAtLevel(mockArchetype, 1);

			expect(result).toHaveLength(1);
			expect(result[0].uuid).toContain('Feature1');
		});

		it('should return items granted at level 2', () => {
			const result = getGrantedItemsAtLevel(mockArchetype, 2);

			expect(result).toHaveLength(1);
			expect(result[0].uuid).toContain('Dedication');
		});

		it('should return items granted at level 4', () => {
			const result = getGrantedItemsAtLevel(mockArchetype, 4);

			expect(result).toHaveLength(1);
			expect(result[0].uuid).toContain('Feature2');
		});

		it('should return empty array for level with no grants', () => {
			const result = getGrantedItemsAtLevel(mockArchetype, 10);

			expect(result).toEqual([]);
		});
	});

	describe('getDedicationFeat()', () => {
		it('should return dedication feat', () => {
			const archetype: ClassArchetype = {
				id: 'test',
				name: 'Test Archetype',
				type: 'class-archetype',
				category: 'class',
				description: 'Test',
				traits: ['class-archetype'],
				rarity: 'common',
				rules: [
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.classfeatures.Item.Feature'
					},
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.feats.Item.Test Dedication',
						predicate: [{ gte: ['self:level', 2] }]
					}
				]
			};

			const result = getDedicationFeat(archetype);

			expect(result).not.toBeNull();
			expect(result?.uuid).toContain('Dedication');
			expect(result?.level).toBe(2);
		});

		it('should return null when no dedication', () => {
			const archetype: ClassArchetype = {
				id: 'test',
				name: 'Test Archetype',
				type: 'class-archetype',
				category: 'class',
				description: 'Test',
				traits: ['class-archetype'],
				rarity: 'common',
				rules: [
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.classfeatures.Item.Feature'
					}
				]
			};

			const result = getDedicationFeat(archetype);

			expect(result).toBeNull();
		});

		it('should return first dedication when multiple exist', () => {
			const archetype: ClassArchetype = {
				id: 'test',
				name: 'Test Archetype',
				type: 'class-archetype',
				category: 'class',
				description: 'Test',
				traits: ['class-archetype'],
				rarity: 'common',
				rules: [
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.feats.Item.First Dedication',
						predicate: [{ gte: ['self:level', 2] }]
					},
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.feats.Item.Second Dedication',
						predicate: [{ gte: ['self:level', 4] }]
					}
				]
			};

			const result = getDedicationFeat(archetype);

			expect(result?.uuid).toContain('First Dedication');
		});
	});

	describe('getImmediateClassFeatures()', () => {
		it('should return level 1 class features', () => {
			const archetype: ClassArchetype = {
				id: 'test',
				name: 'Test Archetype',
				type: 'class-archetype',
				category: 'class',
				description: 'Test',
				traits: ['class-archetype'],
				rarity: 'common',
				rules: [
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.classfeatures.Item.Feature1'
					},
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.classfeatures.Item.Feature2'
					}
				]
			};

			const result = getImmediateClassFeatures(archetype);

			expect(result).toHaveLength(2);
			expect(result[0].uuid).toContain('Feature1');
			expect(result[1].uuid).toContain('Feature2');
		});

		it('should exclude feats', () => {
			const archetype: ClassArchetype = {
				id: 'test',
				name: 'Test Archetype',
				type: 'class-archetype',
				category: 'class',
				description: 'Test',
				traits: ['class-archetype'],
				rarity: 'common',
				rules: [
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.classfeatures.Item.Feature'
					},
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.feats.Item.Test Feat'
					}
				]
			};

			const result = getImmediateClassFeatures(archetype);

			expect(result).toHaveLength(1);
			expect(result[0].uuid).toContain('Feature');
		});

		it('should exclude higher level features', () => {
			const archetype: ClassArchetype = {
				id: 'test',
				name: 'Test Archetype',
				type: 'class-archetype',
				category: 'class',
				description: 'Test',
				traits: ['class-archetype'],
				rarity: 'common',
				rules: [
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.classfeatures.Item.Feature1'
					},
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.classfeatures.Item.Feature2',
						predicate: [{ gte: ['self:level', 4] }]
					}
				]
			};

			const result = getImmediateClassFeatures(archetype);

			expect(result).toHaveLength(1);
			expect(result[0].uuid).toContain('Feature1');
		});

		it('should exclude dynamic features', () => {
			const archetype: ClassArchetype = {
				id: 'test',
				name: 'Test Archetype',
				type: 'class-archetype',
				category: 'class',
				description: 'Test',
				traits: ['class-archetype'],
				rarity: 'common',
				rules: [
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.classfeatures.Item.Static Feature'
					},
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.classfeatures.Item.{item|flags.dynamic}'
					}
				]
			};

			const result = getImmediateClassFeatures(archetype);

			expect(result).toHaveLength(1);
			expect(result[0].uuid).toContain('Static Feature');
		});

		it('should return empty array when no immediate features', () => {
			const archetype: ClassArchetype = {
				id: 'test',
				name: 'Test Archetype',
				type: 'class-archetype',
				category: 'class',
				description: 'Test',
				traits: ['class-archetype'],
				rarity: 'common',
				rules: [
					{
						key: 'GrantItem',
						uuid: 'Compendium.pf2e.feats.Item.Test Dedication',
						predicate: [{ gte: ['self:level', 2] }]
					}
				]
			};

			const result = getImmediateClassFeatures(archetype);

			expect(result).toEqual([]);
		});
	});
});
