import { describe, it, expect } from 'vitest';
import {
	adaptWeapon,
	adaptArmor,
	adaptEquipment,
	adaptWeapons,
	adaptArmors
} from './equipmentAdapter';
import type { FoundryWeapon, FoundryArmor, FoundryEquipment } from '../types/foundry';

describe('Equipment Adapter', () => {
	const mockFoundryWeapon: FoundryWeapon = {
		_id: 'test-weapon-id',
		folder: 'folder-id',
		img: 'path/to/image.webp',
		name: 'Longsword',
		type: 'weapon',
		system: {
			description: {
				value: '<p>A versatile blade</p>'
			},
			level: {
				value: 0
			},
			category: 'martial',
			group: 'sword',
			damage: {
				dice: 1,
				die: 'd8',
				damageType: 'slashing'
			},
			range: null,
			reload: {
				value: null
			},
			price: {
				value: { gp: 1 }
			},
			bulk: {
				value: 1
			},
			usage: {
				value: 'held-in-one-hand'
			},
			traits: {
				rarity: 'common',
				value: ['versatile-p']
			},
			publication: {
				license: 'ORC',
				remaster: true,
				title: 'Pathfinder Player Core'
			},
			rules: []
		}
	};

	const mockFoundryArmor: FoundryArmor = {
		_id: 'test-armor-id',
		folder: 'folder-id',
		img: 'path/to/image.webp',
		name: 'Chain Mail',
		type: 'armor',
		system: {
			description: {
				value: '<p>Heavy metal armor</p>'
			},
			level: {
				value: 0
			},
			category: 'heavy',
			group: 'chain',
			acBonus: 5,
			dexCap: 1,
			checkPenalty: -2,
			speedPenalty: -5,
			strength: 3,
			price: {
				value: { gp: 6 }
			},
			bulk: {
				value: 2
			},
			traits: {
				rarity: 'common',
				value: ['bulwark']
			},
			publication: {
				license: 'ORC',
				remaster: true,
				title: 'Pathfinder Player Core'
			},
			rules: []
		}
	};

	const mockFoundryEquipment: FoundryEquipment = {
		_id: 'test-equip-id',
		folder: 'folder-id',
		img: 'path/to/image.webp',
		name: 'Rope',
		type: 'equipment',
		system: {
			description: {
				value: '<p>50 feet of hemp rope</p>'
			},
			level: {
				value: 0
			},
			price: {
				value: { sp: 5 }
			},
			bulk: {
				value: 0.1
			},
			usage: {
				value: 'held'
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

	describe('adaptWeapon', () => {
		it('should transform basic weapon properties', () => {
			const weapon = adaptWeapon(mockFoundryWeapon);

			expect(weapon.id).toBe('test-weapon-id');
			expect(weapon.name).toBe('Longsword');
			expect(weapon.type).toBe('equipment');
			expect(weapon.equipmentType).toBe('weapon');
			expect(weapon.description).toBe('<p>A versatile blade</p>');
		});

		it('should extract weapon stats', () => {
			const weapon = adaptWeapon(mockFoundryWeapon);

			expect(weapon.category).toBe('martial');
			expect(weapon.group).toBe('sword');
			expect(weapon.damage.dice).toBe(1);
			expect(weapon.damage.die).toBe('d8');
			expect(weapon.damage.damageType).toBe('slashing');
		});

		it('should convert price to copper and create display', () => {
			const weapon = adaptWeapon(mockFoundryWeapon);

			expect(weapon.price.value).toBe(100); // 1 gp = 100 cp
			expect(weapon.price.display).toBe('1 gp');
		});

		it('should handle complex prices', () => {
			const expensiveWeapon: FoundryWeapon = {
				...mockFoundryWeapon,
				system: {
					...mockFoundryWeapon.system,
					price: {
						value: { pp: 1, gp: 5, sp: 3, cp: 7 }
					}
				}
			};

			const weapon = adaptWeapon(expensiveWeapon);
			expect(weapon.price.value).toBe(1537); // 1000 + 500 + 30 + 7
			expect(weapon.price.display).toBe('1 pp, 5 gp, 3 sp, 7 cp');
		});

		it('should convert bulk and create display', () => {
			const weapon = adaptWeapon(mockFoundryWeapon);

			expect(weapon.bulk.value).toBe(1);
			expect(weapon.bulk.display).toBe('1');
		});

		it('should handle light bulk', () => {
			const lightWeapon: FoundryWeapon = {
				...mockFoundryWeapon,
				system: {
					...mockFoundryWeapon.system,
					bulk: {
						value: 0.1
					}
				}
			};

			const weapon = adaptWeapon(lightWeapon);
			expect(weapon.bulk.value).toBe(0.1);
			expect(weapon.bulk.display).toBe('L');
		});

		it('should handle negligible bulk', () => {
			const negligibleWeapon: FoundryWeapon = {
				...mockFoundryWeapon,
				system: {
					...mockFoundryWeapon.system,
					bulk: {
						value: 0
					}
				}
			};

			const weapon = adaptWeapon(negligibleWeapon);
			expect(weapon.bulk.value).toBe(0);
			expect(weapon.bulk.display).toBe('—');
		});

		it('should extract hands from usage', () => {
			const weapon = adaptWeapon(mockFoundryWeapon);
			expect(weapon.hands).toBe(1);
		});

		it('should detect two-handed weapons', () => {
			const twoHandedWeapon: FoundryWeapon = {
				...mockFoundryWeapon,
				system: {
					...mockFoundryWeapon.system,
					usage: {
						value: 'held-in-two-hands'
					}
				}
			};

			const weapon = adaptWeapon(twoHandedWeapon);
			expect(weapon.hands).toBe(2);
		});

		it('should extract traits and rarity', () => {
			const weapon = adaptWeapon(mockFoundryWeapon);

			expect(weapon.traits).toEqual(['versatile-p']);
			expect(weapon.weaponTraits).toEqual(['versatile-p']);
			expect(weapon.rarity).toBe('common');
		});

		it('should extract source information', () => {
			const weapon = adaptWeapon(mockFoundryWeapon);

			expect(weapon.source.title).toBe('Pathfinder Player Core');
			expect(weapon.source.license).toBe('ORC');
			expect(weapon.source.remaster).toBe(true);
		});
	});

	describe('adaptArmor', () => {
		it('should transform basic armor properties', () => {
			const armor = adaptArmor(mockFoundryArmor);

			expect(armor.id).toBe('test-armor-id');
			expect(armor.name).toBe('Chain Mail');
			expect(armor.type).toBe('equipment');
			expect(armor.equipmentType).toBe('armor');
			expect(armor.description).toBe('<p>Heavy metal armor</p>');
		});

		it('should extract armor stats', () => {
			const armor = adaptArmor(mockFoundryArmor);

			expect(armor.category).toBe('heavy');
			expect(armor.group).toBe('chain');
			expect(armor.acBonus).toBe(5);
			expect(armor.dexCap).toBe(1);
			expect(armor.checkPenalty).toBe(-2);
			expect(armor.speedPenalty).toBe(-5);
			expect(armor.strength).toBe(3);
		});

		it('should convert price correctly', () => {
			const armor = adaptArmor(mockFoundryArmor);

			expect(armor.price.value).toBe(600); // 6 gp = 600 cp
			expect(armor.price.display).toBe('6 gp');
		});

		it('should convert bulk correctly', () => {
			const armor = adaptArmor(mockFoundryArmor);

			expect(armor.bulk.value).toBe(2);
			expect(armor.bulk.display).toBe('2');
		});

		it('should extract traits and rarity', () => {
			const armor = adaptArmor(mockFoundryArmor);

			expect(armor.traits).toEqual(['bulwark']);
			expect(armor.rarity).toBe('common');
		});

		it('should extract source information', () => {
			const armor = adaptArmor(mockFoundryArmor);

			expect(armor.source.title).toBe('Pathfinder Player Core');
			expect(armor.source.license).toBe('ORC');
			expect(armor.source.remaster).toBe(true);
		});
	});

	describe('adaptEquipment', () => {
		it('should transform basic equipment properties', () => {
			const equipment = adaptEquipment(mockFoundryEquipment);

			expect(equipment.id).toBe('test-equip-id');
			expect(equipment.name).toBe('Rope');
			expect(equipment.type).toBe('equipment');
			expect(equipment.equipmentType).toBe('adventuring-gear');
		});

		it('should convert price with silver', () => {
			const equipment = adaptEquipment(mockFoundryEquipment);

			expect(equipment.price.value).toBe(50); // 5 sp = 50 cp
			expect(equipment.price.display).toBe('5 sp');
		});

		it('should handle consumable type', () => {
			const consumable: FoundryEquipment = {
				...mockFoundryEquipment,
				type: 'consumable'
			};

			const equipment = adaptEquipment(consumable);
			expect(equipment.equipmentType).toBe('consumable');
		});

		it('should handle shield type', () => {
			const shield: FoundryEquipment = {
				...mockFoundryEquipment,
				type: 'shield'
			};

			const equipment = adaptEquipment(shield);
			expect(equipment.equipmentType).toBe('shield');
		});
	});

	describe('adaptWeapons', () => {
		it('should adapt multiple weapons', () => {
			const weapons = adaptWeapons([mockFoundryWeapon, mockFoundryWeapon]);
			expect(weapons).toHaveLength(2);
			expect(weapons[0].name).toBe('Longsword');
			expect(weapons[1].name).toBe('Longsword');
		});
	});

	describe('adaptArmors', () => {
		it('should adapt multiple armors', () => {
			const armors = adaptArmors([mockFoundryArmor, mockFoundryArmor]);
			expect(armors).toHaveLength(2);
			expect(armors[0].name).toBe('Chain Mail');
			expect(armors[1].name).toBe('Chain Mail');
		});
	});
});
