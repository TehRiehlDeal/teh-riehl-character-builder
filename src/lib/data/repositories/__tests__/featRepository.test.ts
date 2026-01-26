/**
 * Tests for Feat Repository
 *
 * Template pattern for testing repositories that use QueryCache and QueryBuilder
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockFeat } from '../../__tests__/fixtures';

// Mock the database module
vi.mock('../../database', () => ({
	QueryBuilder: {
		getAll: vi.fn(),
		getById: vi.fn(),
		filter: vi.fn(),
		getByLevel: vi.fn(),
		getByTrait: vi.fn(),
		searchByName: vi.fn(),
		getAvailableAtLevel: vi.fn()
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

describe('Feat Repository', () => {
	let QueryBuilder: any;
	let QueryCache: any;
	let CacheKeys: any;
	let featRepository: any;

	beforeEach(async () => {
		// Reset modules to get fresh imports
		vi.clearAllMocks();

		// Import mocked modules
		const dbModule = await import('../../database');
		QueryBuilder = dbModule.QueryBuilder;
		QueryCache = dbModule.QueryCache;
		CacheKeys = dbModule.CacheKeys;

		// Import repository
		featRepository = await import('../featRepository');
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('getAllFeats()', () => {
		it('should use QueryCache.getOrFetch with correct key', async () => {
			const mockFeats = [createMockFeat()];
			QueryCache.getOrFetch.mockResolvedValue(mockFeats);

			const result = await featRepository.getAllFeats();

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('all:feat', expect.any(Function));
			expect(result).toEqual(mockFeats);
		});

		it('should delegate to QueryBuilder.getAll', async () => {
			const mockFeats = [createMockFeat()];
			QueryBuilder.getAll.mockResolvedValue(mockFeats);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			await featRepository.getAllFeats();

			expect(QueryBuilder.getAll).toHaveBeenCalledWith('feat');
		});
	});

	describe('getFeatById()', () => {
		it('should use QueryCache.getOrFetch with ID-based key', async () => {
			const mockFeat = createMockFeat({ id: 'test-feat' });
			QueryCache.getOrFetch.mockResolvedValue(mockFeat);

			const result = await featRepository.getFeatById('test-feat');

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('id:test-feat', expect.any(Function));
			expect(result).toEqual(mockFeat);
		});

		it('should delegate to QueryBuilder.getById', async () => {
			const mockFeat = createMockFeat();
			QueryBuilder.getById.mockResolvedValue(mockFeat);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			await featRepository.getFeatById('test-id');

			expect(QueryBuilder.getById).toHaveBeenCalledWith('test-id');
		});

		it('should return null when feat not found', async () => {
			QueryBuilder.getById.mockResolvedValue(null);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await featRepository.getFeatById('nonexistent');

			expect(result).toBeNull();
		});
	});

	describe('getFeatsByCategory()', () => {
		it('should use QueryCache.getOrFetch with category-based key', async () => {
			const mockFeats = [createMockFeat({ category: 'general' })];
			QueryCache.getOrFetch.mockResolvedValue(mockFeats);

			const result = await featRepository.getFeatsByCategory('general');

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('cat:feat:general', expect.any(Function));
			expect(result).toEqual(mockFeats);
		});

		it('should delegate to QueryBuilder.filter with category', async () => {
			const mockFeats = [createMockFeat({ category: 'skill' })];
			QueryBuilder.filter.mockResolvedValue(mockFeats);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			await featRepository.getFeatsByCategory('skill');

			expect(QueryBuilder.filter).toHaveBeenCalledWith({
				type: 'feat',
				category: 'skill'
			});
		});
	});

	describe('getFeatsByLevel()', () => {
		it('should use QueryCache.getOrFetch with level-based key', async () => {
			const mockFeats = [createMockFeat({ level: 5 })];
			QueryCache.getOrFetch.mockResolvedValue(mockFeats);

			const result = await featRepository.getFeatsByLevel(5);

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('level:feat:5', expect.any(Function));
			expect(result).toEqual(mockFeats);
		});

		it('should delegate to QueryBuilder.getByLevel', async () => {
			const mockFeats = [createMockFeat({ level: 3 })];
			QueryBuilder.getByLevel.mockResolvedValue(mockFeats);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			await featRepository.getFeatsByLevel(3);

			expect(QueryBuilder.getByLevel).toHaveBeenCalledWith('feat', 3);
		});
	});

	describe('getFeatsByTrait()', () => {
		it('should use QueryCache.getOrFetch with trait-based key', async () => {
			const mockFeats = [createMockFeat({ traits: ['general'] })];
			QueryCache.getOrFetch.mockResolvedValue(mockFeats);

			const result = await featRepository.getFeatsByTrait('general');

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('trait:feat:general', expect.any(Function));
			expect(result).toEqual(mockFeats);
		});

		it('should delegate to QueryBuilder.getByTrait', async () => {
			const mockFeats = [createMockFeat({ traits: ['skill'] })];
			QueryBuilder.getByTrait.mockResolvedValue(mockFeats);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			await featRepository.getFeatsByTrait('skill');

			expect(QueryBuilder.getByTrait).toHaveBeenCalledWith('feat', 'skill');
		});
	});

	describe('searchFeats()', () => {
		it('should delegate to QueryBuilder.searchByName', async () => {
			const mockFeats = [createMockFeat({ name: 'Test Feat' })];
			QueryBuilder.searchByName.mockResolvedValue(mockFeats);

			const result = await featRepository.searchFeats('test');

			expect(QueryBuilder.searchByName).toHaveBeenCalledWith('feat', 'test');
			expect(result).toEqual(mockFeats);
		});

		it('should return empty array for empty query', async () => {
			const result = await featRepository.searchFeats('');

			expect(QueryBuilder.searchByName).not.toHaveBeenCalled();
			expect(result).toEqual([]);
		});

		it('should return empty array for whitespace-only query', async () => {
			const result = await featRepository.searchFeats('   ');

			expect(QueryBuilder.searchByName).not.toHaveBeenCalled();
			expect(result).toEqual([]);
		});
	});

	describe('getFeats()', () => {
		it('should filter by category', async () => {
			const mockFeats = [createMockFeat({ category: 'general' })];
			QueryBuilder.filter.mockResolvedValue(mockFeats);

			await featRepository.getFeats({ category: 'general' });

			expect(QueryBuilder.filter).toHaveBeenCalledWith({
				type: 'feat',
				category: 'general',
				level: undefined,
				trait: undefined
			});
		});

		it('should filter by level', async () => {
			const mockFeats = [createMockFeat({ level: 5 })];
			QueryBuilder.filter.mockResolvedValue(mockFeats);

			await featRepository.getFeats({ level: 5 });

			expect(QueryBuilder.filter).toHaveBeenCalledWith({
				type: 'feat',
				category: undefined,
				level: 5,
				trait: undefined
			});
		});

		it('should filter by trait', async () => {
			const mockFeats = [createMockFeat({ traits: ['general'] })];
			QueryBuilder.filter.mockResolvedValue(mockFeats);

			await featRepository.getFeats({ trait: 'general' });

			expect(QueryBuilder.filter).toHaveBeenCalledWith({
				type: 'feat',
				category: undefined,
				level: undefined,
				trait: 'general'
			});
		});

		it('should filter by hasPrerequisites=true in memory', async () => {
			const mockFeats = [
				createMockFeat({ id: 'feat-1', prerequisites: ['Level 5'] }),
				createMockFeat({ id: 'feat-2', prerequisites: [] }),
				createMockFeat({ id: 'feat-3', prerequisites: ['Strength 14'] })
			];
			QueryBuilder.filter.mockResolvedValue(mockFeats);

			const result = await featRepository.getFeats({ hasPrerequisites: true });

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe('feat-1');
			expect(result[1].id).toBe('feat-3');
		});

		it('should filter by hasPrerequisites=false in memory', async () => {
			const mockFeats = [
				createMockFeat({ id: 'feat-1', prerequisites: ['Level 5'] }),
				createMockFeat({ id: 'feat-2', prerequisites: [] }),
				createMockFeat({ id: 'feat-3', prerequisites: [] })
			];
			QueryBuilder.filter.mockResolvedValue(mockFeats);

			const result = await featRepository.getFeats({ hasPrerequisites: false });

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe('feat-2');
			expect(result[1].id).toBe('feat-3');
		});

		it('should handle multiple criteria', async () => {
			const mockFeats = [createMockFeat({ category: 'skill', level: 3, traits: ['skill'] })];
			QueryBuilder.filter.mockResolvedValue(mockFeats);

			await featRepository.getFeats({
				category: 'skill',
				level: 3,
				trait: 'skill'
			});

			expect(QueryBuilder.filter).toHaveBeenCalledWith({
				type: 'feat',
				category: 'skill',
				level: 3,
				trait: 'skill'
			});
		});
	});

	describe('getFeatsAvailableAtLevel()', () => {
		it('should delegate to QueryBuilder.getAvailableAtLevel', async () => {
			const mockFeats = [createMockFeat({ level: 1 }), createMockFeat({ level: 3 })];
			QueryBuilder.getAvailableAtLevel.mockResolvedValue(mockFeats);

			const result = await featRepository.getFeatsAvailableAtLevel(5);

			expect(QueryBuilder.getAvailableAtLevel).toHaveBeenCalledWith('feat', 5);
			expect(result).toEqual(mockFeats);
		});
	});

	describe('clearFeatsCache()', () => {
		it('should invalidate all feat-related cache prefixes', () => {
			featRepository.clearFeatsCache();

			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('all:feat');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('id:');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('level:feat');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('cat:feat');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('trait:feat');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledTimes(5);
		});
	});
});
