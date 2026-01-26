/**
 * Tests for Effect Repository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockEffect } from '../../__tests__/fixtures';

vi.mock('../../database', () => ({
	QueryBuilder: {
		getAll: vi.fn(),
		getById: vi.fn(),
		getByLevel: vi.fn(),
		searchByName: vi.fn()
	},
	QueryCache: {
		getOrFetch: vi.fn(),
		invalidatePrefix: vi.fn()
	},
	CacheKeys: {
		all: vi.fn((type) => `all:${type}`),
		byId: vi.fn((id) => `id:${id}`),
		byLevel: vi.fn((type, level) => `level:${type}:${level}`)
	}
}));

describe('Effect Repository', () => {
	let QueryBuilder: any;
	let QueryCache: any;
	let repository: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		const dbModule = await import('../../database');
		QueryBuilder = dbModule.QueryBuilder;
		QueryCache = dbModule.QueryCache;
		repository = await import('../effectRepository');
	});

	describe('getAllEffects()', () => {
		it('should use QueryCache with correct key', async () => {
			const mockEffects = [createMockEffect()];
			QueryCache.getOrFetch.mockResolvedValue(mockEffects);

			const result = await repository.getAllEffects();

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('all:effect', expect.any(Function));
			expect(result).toEqual(mockEffects);
		});
	});

	describe('getEffectById()', () => {
		it('should return effect by ID', async () => {
			const mockEffect = createMockEffect({ id: 'test-effect' });
			QueryCache.getOrFetch.mockResolvedValue(mockEffect);

			const result = await repository.getEffectById('test-effect');

			expect(result).toEqual(mockEffect);
		});
	});

	describe('searchEffects()', () => {
		it('should search by name', async () => {
			const mockEffects = [createMockEffect({ name: 'Effect: Rage' })];
			QueryBuilder.searchByName.mockResolvedValue(mockEffects);

			await repository.searchEffects('rage');

			expect(QueryBuilder.searchByName).toHaveBeenCalledWith('effect', 'rage');
		});

		it('should return empty for empty query', async () => {
			const result = await repository.searchEffects('');
			expect(result).toEqual([]);
		});
	});

	describe('getEffectsByLevel()', () => {
		it('should filter by level', async () => {
			const mockEffects = [createMockEffect({ level: 5 })];
			QueryCache.getOrFetch.mockResolvedValue(mockEffects);

			await repository.getEffectsByLevel(5);

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('level:effect:5', expect.any(Function));
		});
	});

	describe('getSustainedEffects()', () => {
		it('should filter effects with sustained=true', async () => {
			const mockEffects = [
				createMockEffect({
					id: '1',
					duration: { expiry: null, sustained: true, unit: 'rounds', value: 1 }
				}),
				createMockEffect({
					id: '2',
					duration: { expiry: null, sustained: false, unit: 'rounds', value: 1 }
				}),
				createMockEffect({
					id: '3',
					duration: { expiry: null, sustained: true, unit: 'minutes', value: 1 }
				})
			];
			QueryBuilder.getAll.mockResolvedValue(mockEffects);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getSustainedEffects();

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe('1');
			expect(result[1].id).toBe('3');
		});
	});

	describe('clearEffectCache()', () => {
		it('should invalidate cache prefixes', () => {
			repository.clearEffectCache();

			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('all:effect');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('level:effect');
		});
	});
});
