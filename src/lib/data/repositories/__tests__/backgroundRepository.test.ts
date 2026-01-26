/**
 * Tests for Background Repository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockBackground } from '../../__tests__/fixtures';

vi.mock('../../database', () => ({
	QueryBuilder: {
		getAll: vi.fn(),
		getById: vi.fn(),
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
		byTrait: vi.fn((type, trait) => `trait:${type}:${trait}`)
	}
}));

describe('Background Repository', () => {
	let QueryBuilder: any;
	let QueryCache: any;
	let repository: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		const dbModule = await import('../../database');
		QueryBuilder = dbModule.QueryBuilder;
		QueryCache = dbModule.QueryCache;
		repository = await import('../backgroundRepository');
	});

	describe('getAllBackgrounds()', () => {
		it('should use QueryCache with correct key', async () => {
			const mockBackgrounds = [createMockBackground()];
			QueryCache.getOrFetch.mockResolvedValue(mockBackgrounds);

			const result = await repository.getAllBackgrounds();

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('all:background', expect.any(Function));
			expect(result).toEqual(mockBackgrounds);
		});
	});

	describe('getBackgroundById()', () => {
		it('should return background by ID', async () => {
			const mockBackground = createMockBackground({ id: 'test-background' });
			QueryCache.getOrFetch.mockResolvedValue(mockBackground);

			const result = await repository.getBackgroundById('test-background');

			expect(result).toEqual(mockBackground);
		});
	});

	describe('getBackgroundByName()', () => {
		it('should find background by name case-insensitively', async () => {
			const mockBackgrounds = [
				createMockBackground({ name: 'Acolyte' }),
				createMockBackground({ name: 'Soldier' })
			];
			QueryBuilder.getAll.mockResolvedValue(mockBackgrounds);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getBackgroundByName('ACOLYTE');

			expect(result?.name).toBe('Acolyte');
		});

		it('should return null when not found', async () => {
			QueryBuilder.getAll.mockResolvedValue([]);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getBackgroundByName('Nonexistent');

			expect(result).toBeNull();
		});
	});

	describe('getBackgroundsByTrait()', () => {
		it('should filter by trait', async () => {
			const mockBackgrounds = [createMockBackground({ traits: ['background'] })];
			QueryCache.getOrFetch.mockResolvedValue(mockBackgrounds);

			await repository.getBackgroundsByTrait('background');

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('trait:background:background', expect.any(Function));
		});
	});

	describe('searchBackgrounds()', () => {
		it('should search by name', async () => {
			const mockBackgrounds = [createMockBackground({ name: 'Acolyte' })];
			QueryBuilder.searchByName.mockResolvedValue(mockBackgrounds);

			await repository.searchBackgrounds('aco');

			expect(QueryBuilder.searchByName).toHaveBeenCalledWith('background', 'aco');
		});

		it('should return empty for empty query', async () => {
			const result = await repository.searchBackgrounds('');
			expect(result).toEqual([]);
		});
	});

	describe('getBackgrounds()', () => {
		it('should filter by trainedSkill', async () => {
			const mockBackgrounds = [
				createMockBackground({ id: '1', trainedSkills: ['athletics'] }),
				createMockBackground({ id: '2', trainedSkills: ['arcana'] })
			];
			QueryBuilder.getAll.mockResolvedValue(mockBackgrounds);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getBackgrounds({ trainedSkill: 'athletics' });

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});

		it('should filter by hasAbilityBoost', async () => {
			const mockBackgrounds = [
				createMockBackground({ id: '1', boosts: [{ index: 0, options: ['str', 'dex'], free: false }] }),
				createMockBackground({ id: '2', boosts: [{ index: 0, options: ['int'], free: false }] })
			];
			QueryBuilder.getAll.mockResolvedValue(mockBackgrounds);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getBackgrounds({ hasAbilityBoost: 'str' });

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});

		it('should filter by hasFreeBoost', async () => {
			const mockBackgrounds = [
				createMockBackground({ id: '1', boosts: [{ index: 0, options: ['str', 'dex', 'con', 'int', 'wis', 'cha'], free: true }] }),
				createMockBackground({ id: '2', boosts: [{ index: 0, options: ['str'], free: false }] })
			];
			QueryBuilder.getAll.mockResolvedValue(mockBackgrounds);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getBackgrounds({ hasFreeBoost: true });

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});
	});

	describe('getBackgroundsBySkill()', () => {
		it('should return backgrounds that train specific skill', async () => {
			const mockBackgrounds = [
				createMockBackground({ id: '1', trainedSkills: ['athletics'] }),
				createMockBackground({ id: '2', trainedSkills: ['arcana'] })
			];
			QueryBuilder.getAll.mockResolvedValue(mockBackgrounds);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getBackgroundsBySkill('athletics');

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});
	});

	describe('getBackgroundsByAbilityBoost()', () => {
		it('should return backgrounds with specific ability boost', async () => {
			const mockBackgrounds = [
				createMockBackground({ id: '1', boosts: [{ index: 0, options: ['str', 'dex'], free: false }] }),
				createMockBackground({ id: '2', boosts: [{ index: 0, options: ['int'], free: false }] })
			];
			QueryBuilder.getAll.mockResolvedValue(mockBackgrounds);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getBackgroundsByAbilityBoost('str');

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});
	});

	describe('getBackgroundsWithFreeBoosts()', () => {
		it('should return backgrounds with free boosts', async () => {
			const mockBackgrounds = [
				createMockBackground({ id: '1', boosts: [{ index: 0, options: ['str', 'dex', 'con', 'int', 'wis', 'cha'], free: true }] }),
				createMockBackground({ id: '2', boosts: [{ index: 0, options: ['str'], free: false }] })
			];
			QueryBuilder.getAll.mockResolvedValue(mockBackgrounds);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getBackgroundsWithFreeBoosts();

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});
	});

	describe('clearBackgroundsCache()', () => {
		it('should invalidate cache prefixes', () => {
			repository.clearBackgroundsCache();

			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('all:background');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('trait:background');
		});
	});
});
