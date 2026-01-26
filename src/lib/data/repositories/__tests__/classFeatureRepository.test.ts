/**
 * Tests for Class Feature Repository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockFeat } from '../../__tests__/fixtures';

vi.mock('../../database', () => ({
	QueryBuilder: {
		getById: vi.fn(),
		filter: vi.fn()
	},
	QueryCache: {
		getOrFetch: vi.fn(),
		invalidatePrefix: vi.fn()
	},
	CacheKeys: {
		byId: vi.fn((id) => `id:${id}`)
	}
}));

describe('Class Feature Repository', () => {
	let QueryBuilder: any;
	let QueryCache: any;
	let repository: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		const dbModule = await import('../../database');
		QueryBuilder = dbModule.QueryBuilder;
		QueryCache = dbModule.QueryCache;
		repository = await import('../classFeatureRepository');
	});

	describe('loadAllClassFeatures()', () => {
		it('should use QueryCache with correct key', async () => {
			const mockFeatures = [createMockFeat({ category: 'classfeature' })];
			QueryCache.getOrFetch.mockResolvedValue(mockFeatures);

			const result = await repository.loadAllClassFeatures();

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('all:classfeature', expect.any(Function));
			expect(result).toEqual(mockFeatures);
		});

		it('should filter for classfeature category', async () => {
			const mockFeatures = [createMockFeat({ category: 'classfeature' })];
			QueryBuilder.filter.mockResolvedValue(mockFeatures);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			await repository.loadAllClassFeatures();

			expect(QueryBuilder.filter).toHaveBeenCalledWith({
				type: 'feat',
				category: 'classfeature'
			});
		});
	});

	describe('getClassFeatureById()', () => {
		it('should return class feature by ID', async () => {
			const mockFeature = createMockFeat({ id: 'test-feature', category: 'classfeature' });
			QueryCache.getOrFetch.mockResolvedValue(mockFeature);

			const result = await repository.getClassFeatureById('test-feature');

			expect(result).toEqual(mockFeature);
		});
	});

	describe('getClassFeatureByName()', () => {
		it('should find class feature by name case-insensitively', async () => {
			const mockFeatures = [
				createMockFeat({ name: 'Rage', category: 'classfeature' }),
				createMockFeat({ name: 'Sneak Attack', category: 'classfeature' })
			];
			QueryBuilder.filter.mockResolvedValue(mockFeatures);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClassFeatureByName('RAGE');

			expect(result?.name).toBe('Rage');
		});

		it('should return null when not found', async () => {
			QueryBuilder.filter.mockResolvedValue([]);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClassFeatureByName('Nonexistent');

			expect(result).toBeNull();
		});
	});

	describe('getClassFeaturesByClass()', () => {
		it('should filter by class trait case-insensitively', async () => {
			const mockFeatures = [
				createMockFeat({ id: '1', category: 'classfeature', traits: ['barbarian'] }),
				createMockFeat({ id: '2', category: 'classfeature', traits: ['fighter'] }),
				createMockFeat({ id: '3', category: 'classfeature', traits: ['barbarian'] })
			];
			QueryBuilder.filter.mockResolvedValue(mockFeatures);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClassFeaturesByClass('Barbarian');

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe('1');
			expect(result[1].id).toBe('3');
		});

		it('should use cached query with lowercase key', async () => {
			QueryBuilder.filter.mockResolvedValue([]);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			await repository.getClassFeaturesByClass('Wizard');

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('classfeature:class:wizard', expect.any(Function));
		});
	});

	describe('getClassFeaturesByLevel()', () => {
		it('should filter by class and level', async () => {
			const mockFeatures = [
				createMockFeat({ id: '1', category: 'classfeature', level: 1, traits: ['barbarian'] }),
				createMockFeat({ id: '2', category: 'classfeature', level: 3, traits: ['barbarian'] }),
				createMockFeat({ id: '3', category: 'classfeature', level: 1, traits: ['barbarian'] })
			];
			QueryBuilder.filter.mockResolvedValue(mockFeatures);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClassFeaturesByLevel('barbarian', 1);

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe('1');
			expect(result[1].id).toBe('3');
		});
	});

	describe('searchClassFeatures()', () => {
		it('should search by name, description, and traits', async () => {
			const mockFeatures = [
				createMockFeat({
					id: '1',
					name: 'Rage',
					description: 'test',
					category: 'classfeature'
				}),
				createMockFeat({
					id: '2',
					name: 'Other',
					description: 'Rage description',
					category: 'classfeature'
				}),
				createMockFeat({
					id: '3',
					name: 'Third',
					description: 'test',
					traits: ['rage'],
					category: 'classfeature'
				}),
				createMockFeat({
					id: '4',
					name: 'Fourth',
					description: 'test',
					category: 'classfeature'
				})
			];
			QueryBuilder.filter.mockResolvedValue(mockFeatures);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.searchClassFeatures('rage');

			expect(result).toHaveLength(3);
			expect(result.map((f) => f.id)).toEqual(['1', '2', '3']);
		});

		it('should return empty for empty query', async () => {
			const result = await repository.searchClassFeatures('');
			expect(result).toEqual([]);
		});
	});

	describe('clearClassFeatureCache()', () => {
		it('should invalidate cache prefixes', () => {
			repository.clearClassFeatureCache();

			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('all:classfeature');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('classfeature:class:');
		});
	});
});
