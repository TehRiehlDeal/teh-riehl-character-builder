/**
 * Tests for Class Feature Choices
 */

import { describe, it, expect } from 'vitest';
import {
	extractChoiceInfo,
	findClassFeaturesByTag,
	getCompleteChoiceInfo,
	extractFeatureMappings,
	resolveSpecializedClassFeature
} from '../classFeatureChoices';
import type { ClassFeature } from '$lib/data/types/app';

describe('Class Feature Choices', () => {
	describe('extractChoiceInfo()', () => {
		it('should return none when no rules', () => {
			const classFeature: ClassFeature = {
				id: 'test',
				name: 'Test Feature',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: [],
				rules: []
			};

			const result = extractChoiceInfo(classFeature);

			expect(result.hasChoice).toBe(false);
			expect(result.choiceType).toBe('none');
			expect(result.choices).toEqual([]);
		});

		it('should return none when no ChoiceSet rule', () => {
			const classFeature: ClassFeature = {
				id: 'test',
				name: 'Test Feature',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: [],
				rules: [
					{
						key: 'FlatModifier',
						selector: 'ac',
						value: 1
					}
				]
			};

			const result = extractChoiceInfo(classFeature);

			expect(result.hasChoice).toBe(false);
			expect(result.choiceType).toBe('none');
		});

		it('should extract inline choices', () => {
			const classFeature: ClassFeature = {
				id: 'test',
				name: 'Test Feature',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: [],
				rules: [
					{
						key: 'ChoiceSet',
						flag: 'testChoice',
						choices: [
							{ label: 'Option A', value: 'optionA' },
							{ label: 'Option B', value: 'optionB' }
						]
					}
				]
			};

			const result = extractChoiceInfo(classFeature);

			expect(result.hasChoice).toBe(true);
			expect(result.choiceType).toBe('inline');
			expect(result.choiceFlag).toBe('testChoice');
			expect(result.choices).toHaveLength(2);
			expect(result.choices[0]).toEqual({ label: 'Option A', value: 'optionA' });
			expect(result.choices[1]).toEqual({ label: 'Option B', value: 'optionB' });
		});

		it('should extract label from UUID when not provided', () => {
			const classFeature: ClassFeature = {
				id: 'test',
				name: 'Test Feature',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: [],
				rules: [
					{
						key: 'ChoiceSet',
						flag: 'testChoice',
						choices: [
							{ value: 'Compendium.pf2e.classfeatures.Item.Pride' },
							{ label: 'Custom Label', value: 'Compendium.pf2e.classfeatures.Item.Wrath' }
						]
					}
				]
			};

			const result = extractChoiceInfo(classFeature);

			expect(result.choices[0].label).toBe('Pride');
			expect(result.choices[1].label).toBe('Custom Label');
		});

		it('should handle tag-based choices', () => {
			const classFeature: ClassFeature = {
				id: 'test',
				name: 'Test Feature',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: [],
				rules: [
					{
						key: 'ChoiceSet',
						flag: 'researchField',
						choices: {
							filter: ['item:tag:alchemist-research-field']
						}
					}
				]
			};

			const result = extractChoiceInfo(classFeature);

			expect(result.hasChoice).toBe(true);
			expect(result.choiceType).toBe('tag-based');
			expect(result.choiceFlag).toBe('researchField');
			expect(result.filterTag).toBe('alchemist-research-field');
			expect(result.choices).toEqual([]);
		});

		it('should handle tag filter with multiple predicates', () => {
			const classFeature: ClassFeature = {
				id: 'test',
				name: 'Test Feature',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: [],
				rules: [
					{
						key: 'ChoiceSet',
						flag: 'testChoice',
						choices: {
							filter: ['item:type:feat', 'item:tag:wizard-school']
						}
					}
				]
			};

			const result = extractChoiceInfo(classFeature);

			expect(result.hasChoice).toBe(true);
			expect(result.choiceType).toBe('tag-based');
			expect(result.filterTag).toBe('wizard-school');
		});

		it('should return none when tag filter not found', () => {
			const classFeature: ClassFeature = {
				id: 'test',
				name: 'Test Feature',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: [],
				rules: [
					{
						key: 'ChoiceSet',
						flag: 'testChoice',
						choices: {
							filter: ['item:type:feat']
						}
					}
				]
			};

			const result = extractChoiceInfo(classFeature);

			expect(result.hasChoice).toBe(false);
			expect(result.choiceType).toBe('none');
		});
	});

	describe('findClassFeaturesByTag()', () => {
		const mockFeatures: ClassFeature[] = [
			{
				id: '1',
				name: 'Feature 1',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: ['alchemist-research-field']
			},
			{
				id: '2',
				name: 'Feature 2',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: ['wizard-school']
			},
			{
				id: '3',
				name: 'Feature 3',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: ['alchemist-research-field', 'other-trait']
			}
		];

		it('should find features by exact tag', () => {
			const result = findClassFeaturesByTag(mockFeatures, 'alchemist-research-field');

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe('1');
			expect(result[1].id).toBe('3');
		});

		it('should find features case-insensitively', () => {
			const result = findClassFeaturesByTag(mockFeatures, 'ALCHEMIST-RESEARCH-FIELD');

			expect(result).toHaveLength(2);
		});

		it('should return empty for non-matching tag', () => {
			const result = findClassFeaturesByTag(mockFeatures, 'nonexistent-tag');

			expect(result).toEqual([]);
		});

		it('should handle features with multiple traits', () => {
			const result = findClassFeaturesByTag(mockFeatures, 'other-trait');

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('3');
		});
	});

	describe('getCompleteChoiceInfo()', () => {
		it('should return inline choices unchanged', async () => {
			const classFeature: ClassFeature = {
				id: 'test',
				name: 'Test Feature',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: [],
				rules: [
					{
						key: 'ChoiceSet',
						flag: 'testChoice',
						choices: [
							{ label: 'Option A', value: 'optionA' },
							{ label: 'Option B', value: 'optionB' }
						]
					}
				]
			};

			const result = await getCompleteChoiceInfo(classFeature);

			expect(result.choiceType).toBe('inline');
			expect(result.choices).toHaveLength(2);
		});

		it('should populate tag-based choices', async () => {
			const classFeature: ClassFeature = {
				id: 'test',
				name: 'Test Feature',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: [],
				rules: [
					{
						key: 'ChoiceSet',
						flag: 'researchField',
						choices: {
							filter: ['item:tag:alchemist-research-field']
						}
					}
				]
			};

			const allClassFeatures: ClassFeature[] = [
				{
					id: 'bomber',
					name: 'Bomber',
					type: 'class-feature',
					level: 1,
					description: 'Bomber description',
					traits: ['alchemist-research-field']
				},
				{
					id: 'chirurgeon',
					name: 'Chirurgeon',
					type: 'class-feature',
					level: 1,
					description: 'Chirurgeon description',
					traits: ['alchemist-research-field']
				},
				{
					id: 'other',
					name: 'Other',
					type: 'class-feature',
					level: 1,
					description: 'Other',
					traits: ['wizard-school']
				}
			];

			const result = await getCompleteChoiceInfo(classFeature, allClassFeatures);

			expect(result.hasChoice).toBe(true);
			expect(result.choiceType).toBe('tag-based');
			expect(result.choices).toHaveLength(2);
			expect(result.choices[0]).toEqual({
				label: 'Bomber',
				value: 'bomber',
				description: 'Bomber description',
				uuid: 'Compendium.pf2e.classfeatures.Item.Bomber'
			});
			expect(result.choices[1]).toEqual({
				label: 'Chirurgeon',
				value: 'chirurgeon',
				description: 'Chirurgeon description',
				uuid: 'Compendium.pf2e.classfeatures.Item.Chirurgeon'
			});
		});

		it('should handle tag-based with no matching features', async () => {
			const classFeature: ClassFeature = {
				id: 'test',
				name: 'Test Feature',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: [],
				rules: [
					{
						key: 'ChoiceSet',
						flag: 'testChoice',
						choices: {
							filter: ['item:tag:nonexistent-tag']
						}
					}
				]
			};

			const allClassFeatures: ClassFeature[] = [];

			const result = await getCompleteChoiceInfo(classFeature, allClassFeatures);

			expect(result.choiceType).toBe('tag-based');
			expect(result.choices).toEqual([]);
		});

		it('should work without allClassFeatures for inline', async () => {
			const classFeature: ClassFeature = {
				id: 'test',
				name: 'Test Feature',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: [],
				rules: [
					{
						key: 'ChoiceSet',
						flag: 'testChoice',
						choices: [{ label: 'Option', value: 'option' }]
					}
				]
			};

			const result = await getCompleteChoiceInfo(classFeature);

			expect(result.choices).toHaveLength(1);
		});
	});

	describe('extractFeatureMappings()', () => {
		it('should extract mappings from ActiveEffectLike rules', () => {
			const classFeature: ClassFeature = {
				id: 'test',
				name: 'Test Feature',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: [],
				rules: [
					{
						key: 'ActiveEffectLike',
						value: {
							fieldDiscovery: 'Compendium.pf2e.classfeatures.Item.Bomber Field Discovery',
							perpetualInfusions: 'Compendium.pf2e.classfeatures.Item.Bomber Perpetual Infusions'
						}
					}
				]
			};

			const result = extractFeatureMappings(classFeature);

			expect(result).toEqual({
				fieldDiscovery: 'Compendium.pf2e.classfeatures.Item.Bomber Field Discovery',
				perpetualInfusions: 'Compendium.pf2e.classfeatures.Item.Bomber Perpetual Infusions'
			});
		});

		it('should return empty object when no ActiveEffectLike rules', () => {
			const classFeature: ClassFeature = {
				id: 'test',
				name: 'Test Feature',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: [],
				rules: [
					{
						key: 'FlatModifier',
						selector: 'ac',
						value: 1
					}
				]
			};

			const result = extractFeatureMappings(classFeature);

			expect(result).toEqual({});
		});

		it('should return empty object when no rules', () => {
			const classFeature: ClassFeature = {
				id: 'test',
				name: 'Test Feature',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: [],
				rules: []
			};

			const result = extractFeatureMappings(classFeature);

			expect(result).toEqual({});
		});

		it('should only include Compendium UUIDs', () => {
			const classFeature: ClassFeature = {
				id: 'test',
				name: 'Test Feature',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: [],
				rules: [
					{
						key: 'ActiveEffectLike',
						value: {
							valid: 'Compendium.pf2e.classfeatures.Item.Valid',
							invalid: 'notACompendiumUUID',
							nonString: 123
						}
					}
				]
			};

			const result = extractFeatureMappings(classFeature);

			expect(result).toEqual({
				valid: 'Compendium.pf2e.classfeatures.Item.Valid'
			});
		});

		it('should handle multiple ActiveEffectLike rules', () => {
			const classFeature: ClassFeature = {
				id: 'test',
				name: 'Test Feature',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: [],
				rules: [
					{
						key: 'ActiveEffectLike',
						value: {
							mapping1: 'Compendium.pf2e.classfeatures.Item.Feature1'
						}
					},
					{
						key: 'ActiveEffectLike',
						value: {
							mapping2: 'Compendium.pf2e.classfeatures.Item.Feature2'
						}
					}
				]
			};

			const result = extractFeatureMappings(classFeature);

			expect(result).toEqual({
				mapping1: 'Compendium.pf2e.classfeatures.Item.Feature1',
				mapping2: 'Compendium.pf2e.classfeatures.Item.Feature2'
			});
		});
	});

	describe('resolveSpecializedClassFeature()', () => {
		const allClassFeatures: ClassFeature[] = [
			{
				id: 'bomber',
				name: 'Bomber',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: ['alchemist-research-field'],
				rules: [
					{
						key: 'ActiveEffectLike',
						value: {
							fieldDiscovery: 'Compendium.pf2e.classfeatures.Item.Bomber Field Discovery',
							perpetualInfusions: 'Compendium.pf2e.classfeatures.Item.Bomber Perpetual Infusions'
						}
					}
				]
			},
			{
				id: 'chirurgeon',
				name: 'Chirurgeon',
				type: 'class-feature',
				level: 1,
				description: 'Test',
				traits: ['alchemist-research-field'],
				rules: [
					{
						key: 'ActiveEffectLike',
						value: {
							fieldDiscovery: 'Compendium.pf2e.classfeatures.Item.Chirurgeon Field Discovery'
						}
					}
				]
			}
		];

		it('should resolve specialized feature from generic', () => {
			const genericFeature = {
				name: 'Field Discovery',
				uuid: 'Compendium.pf2e.classfeatures.Item.Field Discovery'
			};

			const selections = {
				researchField: 'bomber'
			};

			const result = resolveSpecializedClassFeature(genericFeature, selections, allClassFeatures);

			expect(result.name).toBe('Bomber Field Discovery');
			expect(result.uuid).toBe('Compendium.pf2e.classfeatures.Item.Bomber Field Discovery');
		});

		it('should handle camelCase conversion', () => {
			const genericFeature = {
				name: 'Perpetual Infusions',
				uuid: 'Compendium.pf2e.classfeatures.Item.Perpetual Infusions'
			};

			const selections = {
				researchField: 'bomber'
			};

			const result = resolveSpecializedClassFeature(genericFeature, selections, allClassFeatures);

			expect(result.name).toBe('Bomber Perpetual Infusions');
		});

		it('should return original when no mapping found', () => {
			const genericFeature = {
				name: 'Unmapped Feature',
				uuid: 'Compendium.pf2e.classfeatures.Item.Unmapped Feature'
			};

			const selections = {
				researchField: 'bomber'
			};

			const result = resolveSpecializedClassFeature(genericFeature, selections, allClassFeatures);

			expect(result).toEqual(genericFeature);
		});

		it('should return original when selection not found', () => {
			const genericFeature = {
				name: 'Field Discovery',
				uuid: 'Compendium.pf2e.classfeatures.Item.Field Discovery'
			};

			const selections = {
				researchField: 'nonexistent'
			};

			const result = resolveSpecializedClassFeature(genericFeature, selections, allClassFeatures);

			expect(result).toEqual(genericFeature);
		});

		it('should return original when no selections', () => {
			const genericFeature = {
				name: 'Field Discovery',
				uuid: 'Compendium.pf2e.classfeatures.Item.Field Discovery'
			};

			const selections = {};

			const result = resolveSpecializedClassFeature(genericFeature, selections, allClassFeatures);

			expect(result).toEqual(genericFeature);
		});

		it('should check multiple selections', () => {
			const genericFeature = {
				name: 'Field Discovery',
				uuid: 'Compendium.pf2e.classfeatures.Item.Field Discovery'
			};

			const selections = {
				otherChoice: 'other',
				researchField: 'chirurgeon'
			};

			const result = resolveSpecializedClassFeature(genericFeature, selections, allClassFeatures);

			expect(result.name).toBe('Chirurgeon Field Discovery');
		});

		it('should preserve additional properties', () => {
			const genericFeature = {
				name: 'Field Discovery',
				uuid: 'Compendium.pf2e.classfeatures.Item.Field Discovery',
				level: 5,
				custom: 'property'
			};

			const selections = {
				researchField: 'bomber'
			};

			const result = resolveSpecializedClassFeature(genericFeature, selections, allClassFeatures);

			expect(result).toEqual({
				name: 'Bomber Field Discovery',
				uuid: 'Compendium.pf2e.classfeatures.Item.Bomber Field Discovery',
				level: 5,
				custom: 'property'
			});
		});
	});
});
