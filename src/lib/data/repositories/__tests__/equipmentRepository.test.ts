/**
 * Tests for Equipment Repository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockEquipment, createMockWeapon, createMockArmor } from '../../__tests__/fixtures';

vi.mock('../../database', () => ({
	QueryBuilder: {
		getAll: vi.fn(),
		getById: vi.fn(),
		filter: vi.fn(),
		getByLevel: vi.fn(),
		getByTrait: vi.fn(),
		searchByName: vi.fn()
	},
	QueryCache: {
		getOrFetch: vi.fn(),
		invalidatePrefix: vi.fn()
	},
	CacheKeys: {
		all: vi.fn((type) => `all:${type}`),
		byId: vi.fn((id) => `id:${id}`),
		byCategory: vi.fn((type, cat) => `cat:${type}:${cat}`),
		byLevel: vi.fn((type, level) => `level:${type}:${level}`),
		byTrait: vi.fn((type, trait) => `trait:${type}:${trait}`)
	}
}));

describe('Equipment Repository', () => {
	let QueryBuilder: any;
	let QueryCache: any;
	let repository: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		const dbModule = await import('../../database');
		QueryBuilder = dbModule.QueryBuilder;
		QueryCache = dbModule.QueryCache;
		repository = await import('../equipmentRepository');
	});

	describe('getAllEquipment()', () => {
		it('should use QueryCache with correct key', async () => {
			const mockEquipment = [createMockEquipment()];
			QueryCache.getOrFetch.mockResolvedValue(mockEquipment);

			const result = await repository.getAllEquipment();

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('all:equipment', expect.any(Function));
			expect(result).toEqual(mockEquipment);
		});
	});

	describe('getEquipmentById()', () => {
		it('should return equipment by ID', async () => {
			const mockEquipment = createMockEquipment({ id: 'test-equipment' });
			QueryCache.getOrFetch.mockResolvedValue(mockEquipment);

			const result = await repository.getEquipmentById('test-equipment');

			expect(result).toEqual(mockEquipment);
		});
	});

	describe('getWeapons()', () => {
		it('should filter by weapon type', async () => {
			const mockWeapons = [createMockWeapon()];
			QueryBuilder.filter.mockResolvedValue(mockWeapons);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			await repository.getWeapons();

			expect(QueryBuilder.filter).toHaveBeenCalledWith({
				type: 'equipment',
				equipmentType: 'weapon'
			});
		});
	});

	describe('getArmor()', () => {
		it('should filter by armor type', async () => {
			const mockArmor = [createMockArmor()];
			QueryBuilder.filter.mockResolvedValue(mockArmor);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			await repository.getArmor();

			expect(QueryBuilder.filter).toHaveBeenCalledWith({
				type: 'equipment',
				equipmentType: 'armor'
			});
		});
	});

	describe('getEquipmentByType()', () => {
		it('should filter by equipment type', async () => {
			const mockEquipment = [createMockEquipment({ equipmentType: 'consumable' })];
			QueryBuilder.filter.mockResolvedValue(mockEquipment);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			await repository.getEquipmentByType('consumable');

			expect(QueryBuilder.filter).toHaveBeenCalledWith({
				type: 'equipment',
				equipmentType: 'consumable'
			});
		});
	});

	describe('getWeaponsByCategory()', () => {
		it('should filter weapons by category', async () => {
			const mockWeapons = [createMockWeapon({ category: 'martial' })];
			QueryBuilder.filter.mockResolvedValue(mockWeapons);

			await repository.getWeaponsByCategory('martial');

			expect(QueryBuilder.filter).toHaveBeenCalledWith({
				type: 'equipment',
				equipmentType: 'weapon',
				category: 'martial'
			});
		});
	});

	describe('getArmorByCategory()', () => {
		it('should filter armor by category', async () => {
			const mockArmor = [createMockArmor({ category: 'light' })];
			QueryBuilder.filter.mockResolvedValue(mockArmor);

			await repository.getArmorByCategory('light');

			expect(QueryBuilder.filter).toHaveBeenCalledWith({
				type: 'equipment',
				equipmentType: 'armor',
				category: 'light'
			});
		});
	});

	describe('getEquipmentByLevel()', () => {
		it('should filter by level', async () => {
			const mockEquipment = [createMockEquipment({ level: 5 })];
			QueryCache.getOrFetch.mockResolvedValue(mockEquipment);

			await repository.getEquipmentByLevel(5);

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('level:equipment:5', expect.any(Function));
		});
	});

	describe('getEquipmentByTrait()', () => {
		it('should filter by trait', async () => {
			const mockEquipment = [createMockEquipment({ traits: ['common'] })];
			QueryCache.getOrFetch.mockResolvedValue(mockEquipment);

			await repository.getEquipmentByTrait('common');

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('trait:equipment:common', expect.any(Function));
		});
	});

	describe('searchEquipment()', () => {
		it('should search by name', async () => {
			const mockEquipment = [createMockEquipment({ name: 'Longsword' })];
			QueryBuilder.searchByName.mockResolvedValue(mockEquipment);

			await repository.searchEquipment('sword');

			expect(QueryBuilder.searchByName).toHaveBeenCalledWith('equipment', 'sword');
		});

		it('should return empty for empty query', async () => {
			const result = await repository.searchEquipment('');
			expect(result).toEqual([]);
		});
	});

	describe('filterEquipment()', () => {
		it('should apply SQL filters', async () => {
			const mockEquipment = [createMockEquipment()];
			QueryBuilder.filter.mockResolvedValue(mockEquipment);

			await repository.filterEquipment({
				equipmentType: 'weapon',
				level: 5,
				rarity: 'common'
			});

			expect(QueryBuilder.filter).toHaveBeenCalledWith({
				type: 'equipment',
				equipmentType: 'weapon',
				level: 5,
				minLevel: undefined,
				maxLevel: undefined,
				trait: undefined,
				rarity: 'common'
			});
		});

		it('should apply weapon category filter in memory', async () => {
			const mockEquipment = [
				createMockWeapon({ id: '1', category: 'simple', equipmentType: 'weapon' }),
				createMockWeapon({ id: '2', category: 'martial', equipmentType: 'weapon' })
			];
			QueryBuilder.filter.mockResolvedValue(mockEquipment);

			const result = await repository.filterEquipment({ weaponCategory: 'martial' });

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('2');
		});

		it('should apply armor category filter in memory', async () => {
			const mockEquipment = [
				createMockArmor({ id: '1', category: 'light', equipmentType: 'armor' }),
				createMockArmor({ id: '2', category: 'heavy', equipmentType: 'armor' })
			];
			QueryBuilder.filter.mockResolvedValue(mockEquipment);

			const result = await repository.filterEquipment({ armorCategory: 'light' });

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});
	});

	describe('clearEquipmentCache()', () => {
		it('should invalidate cache prefixes', () => {
			repository.clearEquipmentCache();

			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('all:equipment');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('cat:equipment');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('level:equipment');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('trait:equipment');
		});
	});
});
