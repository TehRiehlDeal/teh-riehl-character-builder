/**
 * Tests for Heritage Repository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockHeritage } from '../../__tests__/fixtures';

vi.mock('../../database', () => ({
	QueryBuilder: {
		getAll: vi.fn(),
		getById: vi.fn(),
		filter: vi.fn(),
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
		byTrait: vi.fn((type, trait) => `trait:${type}:${trait}`),
		byAncestry: vi.fn((slug) => `ancestry:${slug}`)
	}
}));

describe('Heritage Repository', () => {
	let QueryBuilder: any;
	let QueryCache: any;
	let repository: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		const dbModule = await import('../../database');
		QueryBuilder = dbModule.QueryBuilder;
		QueryCache = dbModule.QueryCache;
		repository = await import('../heritageRepository');
	});

	describe('getAllHeritages()', () => {
		it('should use QueryCache with correct key', async () => {
			const mockHeritages = [createMockHeritage()];
			QueryCache.getOrFetch.mockResolvedValue(mockHeritages);

			const result = await repository.getAllHeritages();

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('all:heritage', expect.any(Function));
			expect(result).toEqual(mockHeritages);
		});
	});

	describe('getHeritageById()', () => {
		it('should return heritage by ID', async () => {
			const mockHeritage = createMockHeritage({ id: 'test-heritage' });
			QueryCache.getOrFetch.mockResolvedValue(mockHeritage);

			const result = await repository.getHeritageById('test-heritage');

			expect(result).toEqual(mockHeritage);
		});
	});

	describe('getHeritagesByAncestry()', () => {
		it('should filter by ancestry name case-insensitively', async () => {
			const mockHeritages = [
				createMockHeritage({ id: '1', ancestry: 'Elf', ancestrySlug: 'elf' }),
				createMockHeritage({ id: '2', ancestry: 'Dwarf', ancestrySlug: 'dwarf' })
			];
			QueryBuilder.getAll.mockResolvedValue(mockHeritages);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getHeritagesByAncestry('ELF');

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});
	});

	describe('getHeritagesByAncestrySlug()', () => {
		it('should filter by ancestry slug', async () => {
			const mockHeritages = [createMockHeritage({ ancestrySlug: 'elf' })];
			QueryBuilder.filter.mockResolvedValue(mockHeritages);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			await repository.getHeritagesByAncestrySlug('elf');

			expect(QueryBuilder.filter).toHaveBeenCalledWith({
				type: 'heritage',
				ancestrySlug: 'elf'
			});
		});
	});

	describe('getHeritageByName()', () => {
		it('should find heritage by name case-insensitively', async () => {
			const mockHeritages = [
				createMockHeritage({ name: 'Ancient Elf' }),
				createMockHeritage({ name: 'Half-Elf' })
			];
			QueryBuilder.getAll.mockResolvedValue(mockHeritages);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getHeritageByName('ANCIENT ELF');

			expect(result?.name).toBe('Ancient Elf');
		});

		it('should return null when not found', async () => {
			QueryBuilder.getAll.mockResolvedValue([]);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getHeritageByName('Nonexistent');

			expect(result).toBeNull();
		});
	});

	describe('getHeritagesByTrait()', () => {
		it('should filter by trait', async () => {
			const mockHeritages = [createMockHeritage({ traits: ['heritage'] })];
			QueryCache.getOrFetch.mockResolvedValue(mockHeritages);

			await repository.getHeritagesByTrait('heritage');

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('trait:heritage:heritage', expect.any(Function));
		});
	});

	describe('searchHeritages()', () => {
		it('should search by name', async () => {
			const mockHeritages = [createMockHeritage({ name: 'Ancient Elf' })];
			QueryBuilder.searchByName.mockResolvedValue(mockHeritages);

			await repository.searchHeritages('ancient');

			expect(QueryBuilder.searchByName).toHaveBeenCalledWith('heritage', 'ancient');
		});

		it('should return empty for empty query', async () => {
			const result = await repository.searchHeritages('');
			expect(result).toEqual([]);
		});
	});

	describe('getHeritages()', () => {
		it('should use SQL filter when only ancestrySlug provided', async () => {
			const mockHeritages = [createMockHeritage()];
			QueryBuilder.filter.mockResolvedValue(mockHeritages);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			await repository.getHeritages({ ancestrySlug: 'elf' });

			expect(QueryBuilder.filter).toHaveBeenCalled();
		});

		it('should filter by ancestry in memory', async () => {
			const mockHeritages = [
				createMockHeritage({ id: '1', ancestry: 'Elf' }),
				createMockHeritage({ id: '2', ancestry: 'Dwarf' })
			];
			QueryBuilder.getAll.mockResolvedValue(mockHeritages);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getHeritages({ ancestry: 'Elf' });

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});

		it('should filter by rarity in memory', async () => {
			const mockHeritages = [
				createMockHeritage({ id: '1', rarity: 'common' }),
				createMockHeritage({ id: '2', rarity: 'uncommon' })
			];
			QueryBuilder.getAll.mockResolvedValue(mockHeritages);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getHeritages({ rarity: 'uncommon' });

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('2');
		});
	});

	describe('getVersatileHeritages()', () => {
		it('should return heritages with versatile trait', async () => {
			const mockHeritages = [createMockHeritage({ traits: ['versatile'] })];
			QueryCache.getOrFetch.mockResolvedValue(mockHeritages);

			await repository.getVersatileHeritages();

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('trait:heritage:versatile', expect.any(Function));
		});
	});

	describe('clearHeritagesCache()', () => {
		it('should invalidate cache prefixes', () => {
			repository.clearHeritagesCache();

			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('all:heritage');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('trait:heritage');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('ancestry:');
		});
	});
});
