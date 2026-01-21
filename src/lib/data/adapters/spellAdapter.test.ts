import { describe, it, expect } from 'vitest';
import { adaptSpell, adaptSpells } from './spellAdapter';
import type { FoundrySpell } from '../types/foundry';

describe('Spell Adapter', () => {
	const mockFoundrySpell: FoundrySpell = {
		_id: 'test-spell-id',
		folder: 'folder-id',
		img: 'path/to/image.webp',
		name: 'Test Spell',
		type: 'spell',
		system: {
			description: {
				value: '<p>Test spell description</p>'
			},
			level: {
				value: 1
			},
			time: {
				value: '2'
			},
			range: {
				value: '30 feet'
			},
			target: {
				value: '1 creature'
			},
			area: null,
			duration: {
				value: '1 minute',
				sustained: false
			},
			defense: null,
			traits: {
				rarity: 'common',
				value: ['evocation', 'fire'],
				traditions: ['arcane', 'primal']
			} as any,
			publication: {
				license: 'ORC',
				remaster: true,
				title: 'Pathfinder Player Core'
			},
			rules: []
		}
	};

	describe('adaptSpell', () => {
		it('should transform basic spell properties', () => {
			const spell = adaptSpell(mockFoundrySpell);

			expect(spell.id).toBe('test-spell-id');
			expect(spell.name).toBe('Test Spell');
			expect(spell.type).toBe('spell');
			expect(spell.description).toBe('<p>Test spell description</p>');
			expect(spell.level).toBe(1);
		});

		it('should extract casting details', () => {
			const spell = adaptSpell(mockFoundrySpell);

			expect(spell.castingTime).toBe('2');
			expect(spell.range).toBe('30 feet');
			expect(spell.target).toBe('1 creature');
			expect(spell.duration).toBe('1 minute');
			expect(spell.sustained).toBe(false);
		});

		it('should extract traditions', () => {
			const spell = adaptSpell(mockFoundrySpell);

			expect(spell.traditions).toEqual(['arcane', 'primal']);
		});

		it('should handle missing traditions gracefully', () => {
			const spellWithoutTraditions: FoundrySpell = {
				...mockFoundrySpell,
				system: {
					...mockFoundrySpell.system,
					traits: {
						...mockFoundrySpell.system.traits,
						traditions: undefined
					} as any
				}
			};

			const spell = adaptSpell(spellWithoutTraditions);
			expect(spell.traditions).toEqual([]);
		});

		it('should extract traits and rarity', () => {
			const spell = adaptSpell(mockFoundrySpell);

			expect(spell.traits).toEqual(['evocation', 'fire']);
			expect(spell.rarity).toBe('common');
		});

		it('should extract source information', () => {
			const spell = adaptSpell(mockFoundrySpell);

			expect(spell.source.title).toBe('Pathfinder Player Core');
			expect(spell.source.license).toBe('ORC');
			expect(spell.source.remaster).toBe(true);
		});

		it('should default to standard spell type', () => {
			const spell = adaptSpell(mockFoundrySpell);
			expect(spell.spellType).toBe('standard');
		});

		it('should accept custom spell type', () => {
			const spell = adaptSpell(mockFoundrySpell, 'focus');
			expect(spell.spellType).toBe('focus');
		});

		it('should handle area spells', () => {
			const areaSpell: FoundrySpell = {
				...mockFoundrySpell,
				system: {
					...mockFoundrySpell.system,
					area: {
						type: 'burst',
						value: 20
					}
				}
			};

			const spell = adaptSpell(areaSpell);
			expect(spell.area).toBe('20-foot burst');
		});

		it('should handle area without value', () => {
			const areaSpell: FoundrySpell = {
				...mockFoundrySpell,
				system: {
					...mockFoundrySpell.system,
					area: {
						type: 'cone'
					}
				}
			};

			const spell = adaptSpell(areaSpell);
			expect(spell.area).toBe('cone');
		});

		it('should handle defense saves', () => {
			const saveSpell: FoundrySpell = {
				...mockFoundrySpell,
				system: {
					...mockFoundrySpell.system,
					defense: {
						save: {
							statistic: 'fortitude',
							basic: true
						}
					}
				}
			};

			const spell = adaptSpell(saveSpell);
			expect(spell.defense).toBe('basic fortitude');
		});

		it('should handle non-basic saves', () => {
			const saveSpell: FoundrySpell = {
				...mockFoundrySpell,
				system: {
					...mockFoundrySpell.system,
					defense: {
						save: {
							statistic: 'will',
							basic: false
						}
					}
				}
			};

			const spell = adaptSpell(saveSpell);
			expect(spell.defense).toBe('will');
		});

		it('should handle sustained spells', () => {
			const sustainedSpell: FoundrySpell = {
				...mockFoundrySpell,
				system: {
					...mockFoundrySpell.system,
					duration: {
						value: 'sustained up to 1 minute',
						sustained: true
					}
				}
			};

			const spell = adaptSpell(sustainedSpell);
			expect(spell.sustained).toBe(true);
			expect(spell.duration).toBe('sustained up to 1 minute');
		});

		it('should pass through heightening information', () => {
			const heightenedSpell: FoundrySpell = {
				...mockFoundrySpell,
				system: {
					...mockFoundrySpell.system,
					heightening: {
						type: 'fixed',
						levels: {
							3: { damage: '2d6' },
							5: { damage: '3d6' }
						}
					}
				}
			};

			const spell = adaptSpell(heightenedSpell);
			expect(spell.heightening?.type).toBe('fixed');
			expect(spell.heightening?.levels).toBeDefined();
		});
	});

	describe('adaptSpells', () => {
		it('should adapt multiple spells', () => {
			const spells = adaptSpells([mockFoundrySpell, mockFoundrySpell]);
			expect(spells).toHaveLength(2);
			expect(spells[0].name).toBe('Test Spell');
			expect(spells[1].name).toBe('Test Spell');
		});

		it('should apply spell type to all spells', () => {
			const spells = adaptSpells([mockFoundrySpell, mockFoundrySpell], 'focus');
			expect(spells[0].spellType).toBe('focus');
			expect(spells[1].spellType).toBe('focus');
		});
	});
});
