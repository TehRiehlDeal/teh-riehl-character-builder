/**
 * Tests for Action Repository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockAction } from '../../__tests__/fixtures';

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

describe('Action Repository', () => {
	let QueryBuilder: any;
	let QueryCache: any;
	let repository: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		const dbModule = await import('../../database');
		QueryBuilder = dbModule.QueryBuilder;
		QueryCache = dbModule.QueryCache;
		repository = await import('../actionRepository');
	});

	describe('getAllActions()', () => {
		it('should use QueryCache with correct key', async () => {
			const mockActions = [createMockAction()];
			QueryCache.getOrFetch.mockResolvedValue(mockActions);

			const result = await repository.getAllActions();

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('all:action', expect.any(Function));
			expect(result).toEqual(mockActions);
		});
	});

	describe('getActionById()', () => {
		it('should return action by ID', async () => {
			const mockAction = createMockAction({ id: 'test-action' });
			QueryCache.getOrFetch.mockResolvedValue(mockAction);

			const result = await repository.getActionById('test-action');

			expect(result).toEqual(mockAction);
		});
	});

	describe('getActionsByType()', () => {
		it('should filter by action type in memory', async () => {
			const mockActions = [
				createMockAction({ id: '1', actionType: 'action' }),
				createMockAction({ id: '2', actionType: 'reaction' }),
				createMockAction({ id: '3', actionType: 'action' })
			];
			QueryBuilder.getAll.mockResolvedValue(mockActions);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getActionsByType('action');

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe('1');
			expect(result[1].id).toBe('3');
		});
	});

	describe('searchActions()', () => {
		it('should search by name', async () => {
			const mockActions = [createMockAction({ name: 'Strike' })];
			QueryBuilder.searchByName.mockResolvedValue(mockActions);

			await repository.searchActions('strike');

			expect(QueryBuilder.searchByName).toHaveBeenCalledWith('action', 'strike');
		});

		it('should return empty for empty query', async () => {
			const result = await repository.searchActions('');
			expect(result).toEqual([]);
		});
	});

	describe('getActionsByTrait()', () => {
		it('should filter by trait', async () => {
			const mockActions = [createMockAction({ traits: ['attack'] })];
			QueryCache.getOrFetch.mockResolvedValue(mockActions);

			await repository.getActionsByTrait('attack');

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('trait:action:attack', expect.any(Function));
		});
	});

	describe('clearActionCache()', () => {
		it('should invalidate cache prefixes', () => {
			repository.clearActionCache();

			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('all:action');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('trait:action');
		});
	});
});
