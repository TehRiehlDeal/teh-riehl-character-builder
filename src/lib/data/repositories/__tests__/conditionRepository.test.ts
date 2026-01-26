/**
 * Tests for Condition Repository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockCondition } from '../../__tests__/fixtures';

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

describe('Condition Repository', () => {
	let QueryBuilder: any;
	let QueryCache: any;
	let repository: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		const dbModule = await import('../../database');
		QueryBuilder = dbModule.QueryBuilder;
		QueryCache = dbModule.QueryCache;
		repository = await import('../conditionRepository');
	});

	describe('getAllConditions()', () => {
		it('should use QueryCache with correct key', async () => {
			const mockConditions = [createMockCondition()];
			QueryCache.getOrFetch.mockResolvedValue(mockConditions);

			const result = await repository.getAllConditions();

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('all:condition', expect.any(Function));
			expect(result).toEqual(mockConditions);
		});
	});

	describe('getConditionById()', () => {
		it('should return condition by ID', async () => {
			const mockCondition = createMockCondition({ id: 'test-condition' });
			QueryCache.getOrFetch.mockResolvedValue(mockCondition);

			const result = await repository.getConditionById('test-condition');

			expect(result).toEqual(mockCondition);
		});
	});

	describe('getValuedConditions()', () => {
		it('should filter conditions with numeric values', async () => {
			const mockConditions = [
				createMockCondition({
					id: '1',
					value: { isValued: true, value: 1, immutable: false }
				}),
				createMockCondition({ id: '2', value: undefined }),
				createMockCondition({
					id: '3',
					value: { isValued: true, value: 2, immutable: false }
				})
			];
			QueryBuilder.getAll.mockResolvedValue(mockConditions);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getValuedConditions();

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe('1');
			expect(result[1].id).toBe('3');
		});
	});

	describe('searchConditions()', () => {
		it('should search by name', async () => {
			const mockConditions = [createMockCondition({ name: 'Frightened' })];
			QueryBuilder.searchByName.mockResolvedValue(mockConditions);

			await repository.searchConditions('fright');

			expect(QueryBuilder.searchByName).toHaveBeenCalledWith('condition', 'fright');
		});

		it('should return empty for empty query', async () => {
			const result = await repository.searchConditions('');
			expect(result).toEqual([]);
		});
	});

	describe('getConditionsByTrait()', () => {
		it('should filter by trait', async () => {
			const mockConditions = [createMockCondition({ traits: ['condition'] })];
			QueryCache.getOrFetch.mockResolvedValue(mockConditions);

			await repository.getConditionsByTrait('condition');

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('trait:condition:condition', expect.any(Function));
		});
	});

	describe('clearConditionCache()', () => {
		it('should invalidate cache prefixes', () => {
			repository.clearConditionCache();

			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('all:condition');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('trait:condition');
		});
	});
});
