/**
 * Tests for Ancestry Repository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockAncestry } from '../../__tests__/fixtures';

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

describe('Ancestry Repository', () => {
	let QueryBuilder: any;
	let QueryCache: any;
	let repository: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		const dbModule = await import('../../database');
		QueryBuilder = dbModule.QueryBuilder;
		QueryCache = dbModule.QueryCache;
		repository = await import('../ancestryRepository');
	});

	describe('getAllAncestries()', () => {
		it('should use QueryCache with correct key', async () => {
			const mockAncestries = [createMockAncestry()];
			QueryCache.getOrFetch.mockResolvedValue(mockAncestries);

			const result = await repository.getAllAncestries();

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('all:ancestry', expect.any(Function));
			expect(result).toEqual(mockAncestries);
		});
	});

	describe('getAncestryById()', () => {
		it('should return ancestry by ID', async () => {
			const mockAncestry = createMockAncestry({ id: 'test-ancestry' });
			QueryCache.getOrFetch.mockResolvedValue(mockAncestry);

			const result = await repository.getAncestryById('test-ancestry');

			expect(result).toEqual(mockAncestry);
		});
	});

	describe('getAncestryByName()', () => {
		it('should find ancestry by name case-insensitively', async () => {
			const mockAncestries = [
				createMockAncestry({ name: 'Elf' }),
				createMockAncestry({ name: 'Dwarf' })
			];
			QueryBuilder.getAll.mockResolvedValue(mockAncestries);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getAncestryByName('ELF');

			expect(result?.name).toBe('Elf');
		});

		it('should return null when not found', async () => {
			QueryBuilder.getAll.mockResolvedValue([]);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getAncestryByName('Nonexistent');

			expect(result).toBeNull();
		});
	});

	describe('getAncestriesByTrait()', () => {
		it('should filter by trait', async () => {
			const mockAncestries = [createMockAncestry({ traits: ['humanoid'] })];
			QueryCache.getOrFetch.mockResolvedValue(mockAncestries);

			await repository.getAncestriesByTrait('humanoid');

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('trait:ancestry:humanoid', expect.any(Function));
		});
	});

	describe('searchAncestries()', () => {
		it('should search by name', async () => {
			const mockAncestries = [createMockAncestry({ name: 'Elf' })];
			QueryBuilder.searchByName.mockResolvedValue(mockAncestries);

			await repository.searchAncestries('elf');

			expect(QueryBuilder.searchByName).toHaveBeenCalledWith('ancestry', 'elf');
		});

		it('should return empty for empty query', async () => {
			const result = await repository.searchAncestries('');
			expect(result).toEqual([]);
		});
	});

	describe('getAncestries()', () => {
		it('should filter by minSpeed', async () => {
			const mockAncestries = [
				createMockAncestry({ id: '1', speed: 20 }),
				createMockAncestry({ id: '2', speed: 25 }),
				createMockAncestry({ id: '3', speed: 30 })
			];
			QueryBuilder.getAll.mockResolvedValue(mockAncestries);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getAncestries({ minSpeed: 25 });

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe('2');
			expect(result[1].id).toBe('3');
		});

		it('should filter by maxSpeed', async () => {
			const mockAncestries = [
				createMockAncestry({ id: '1', speed: 20 }),
				createMockAncestry({ id: '2', speed: 25 })
			];
			QueryBuilder.getAll.mockResolvedValue(mockAncestries);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getAncestries({ maxSpeed: 20 });

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});

		it('should filter by size', async () => {
			const mockAncestries = [
				createMockAncestry({ id: '1', size: 'sm' }),
				createMockAncestry({ id: '2', size: 'med' })
			];
			QueryBuilder.getAll.mockResolvedValue(mockAncestries);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getAncestries({ size: 'med' });

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('2');
		});

		it('should filter by vision', async () => {
			const mockAncestries = [
				createMockAncestry({ id: '1', vision: 'normal' }),
				createMockAncestry({ id: '2', vision: 'darkvision' })
			];
			QueryBuilder.getAll.mockResolvedValue(mockAncestries);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getAncestries({ vision: 'darkvision' });

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('2');
		});
	});

	describe('getAncestriesWithDarkvision()', () => {
		it('should return only darkvision ancestries', async () => {
			const mockAncestries = [
				createMockAncestry({ id: '1', vision: 'darkvision' }),
				createMockAncestry({ id: '2', vision: 'normal' })
			];
			QueryBuilder.getAll.mockResolvedValue(mockAncestries);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getAncestriesWithDarkvision();

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});
	});

	describe('getAncestriesWithLowLightVision()', () => {
		it('should return only low-light vision ancestries', async () => {
			const mockAncestries = [
				createMockAncestry({ id: '1', vision: 'low-light-vision' }),
				createMockAncestry({ id: '2', vision: 'normal' })
			];
			QueryBuilder.getAll.mockResolvedValue(mockAncestries);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getAncestriesWithLowLightVision();

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});
	});

	describe('getAncestriesBySize()', () => {
		it('should filter by size', async () => {
			const mockAncestries = [
				createMockAncestry({ id: '1', size: 'sm' }),
				createMockAncestry({ id: '2', size: 'med' })
			];
			QueryBuilder.getAll.mockResolvedValue(mockAncestries);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getAncestriesBySize('sm');

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});
	});

	describe('clearAncestriesCache()', () => {
		it('should invalidate cache prefixes', () => {
			repository.clearAncestriesCache();

			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('all:ancestry');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('trait:ancestry');
		});
	});
});
