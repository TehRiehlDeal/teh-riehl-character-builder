/**
 * Tests for Spell Repository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockSpell } from '../../__tests__/fixtures';

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
		byLevel: vi.fn((type, level) => `level:${type}:${level}`),
		byTrait: vi.fn((type, trait) => `trait:${type}:${trait}`),
		byTradition: vi.fn((trad) => `tradition:${trad}`)
	}
}));

describe('Spell Repository', () => {
	let QueryBuilder: any;
	let QueryCache: any;
	let repository: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		const dbModule = await import('../../database');
		QueryBuilder = dbModule.QueryBuilder;
		QueryCache = dbModule.QueryCache;
		repository = await import('../spellRepository');
	});

	describe('getAllSpells()', () => {
		it('should use QueryCache with correct key', async () => {
			const mockSpells = [createMockSpell()];
			QueryCache.getOrFetch.mockResolvedValue(mockSpells);

			const result = await repository.getAllSpells();

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('all:spell', expect.any(Function));
			expect(result).toEqual(mockSpells);
		});
	});

	describe('getSpellById()', () => {
		it('should return spell by ID', async () => {
			const mockSpell = createMockSpell({ id: 'test-spell' });
			QueryCache.getOrFetch.mockResolvedValue(mockSpell);

			const result = await repository.getSpellById('test-spell');

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('id:test-spell', expect.any(Function));
			expect(result).toEqual(mockSpell);
		});
	});

	describe('getSpellsByLevel()', () => {
		it('should return spells by level', async () => {
			const mockSpells = [createMockSpell({ level: 3 })];
			QueryCache.getOrFetch.mockResolvedValue(mockSpells);

			await repository.getSpellsByLevel(3);

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('level:spell:3', expect.any(Function));
		});
	});

	describe('getSpellsByTradition()', () => {
		it('should filter by tradition', async () => {
			const mockSpells = [createMockSpell({ traditions: ['arcane'] })];
			QueryBuilder.filter.mockResolvedValue(mockSpells);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			await repository.getSpellsByTradition('arcane');

			expect(QueryBuilder.filter).toHaveBeenCalledWith({
				type: 'spell',
				tradition: 'arcane'
			});
		});
	});

	describe('getSpellsByType()', () => {
		it('should filter spells by type in memory', async () => {
			const mockSpells = [
				createMockSpell({ id: 'spell-1', spellType: 'standard' }),
				createMockSpell({ id: 'spell-2', spellType: 'focus' }),
				createMockSpell({ id: 'spell-3', spellType: 'standard' })
			];
			QueryBuilder.getAll.mockResolvedValue(mockSpells);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getSpellsByType('standard');

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe('spell-1');
			expect(result[1].id).toBe('spell-3');
		});
	});

	describe('getSpellsByTrait()', () => {
		it('should filter by trait', async () => {
			const mockSpells = [createMockSpell({ traits: ['evocation'] })];
			QueryCache.getOrFetch.mockResolvedValue(mockSpells);

			await repository.getSpellsByTrait('evocation');

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('trait:spell:evocation', expect.any(Function));
		});
	});

	describe('searchSpells()', () => {
		it('should search by name', async () => {
			const mockSpells = [createMockSpell({ name: 'Fireball' })];
			QueryBuilder.searchByName.mockResolvedValue(mockSpells);

			await repository.searchSpells('fire');

			expect(QueryBuilder.searchByName).toHaveBeenCalledWith('spell', 'fire');
		});

		it('should return empty for empty query', async () => {
			const result = await repository.searchSpells('');
			expect(result).toEqual([]);
		});
	});

	describe('getCantrips()', () => {
		it('should return level 0 spells', async () => {
			const mockCantrips = [createMockSpell({ level: 0 })];
			QueryCache.getOrFetch.mockResolvedValue(mockCantrips);

			await repository.getCantrips();

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('level:spell:0', expect.any(Function));
		});
	});

	describe('filterSpells()', () => {
		it('should apply SQL filters', async () => {
			const mockSpells = [createMockSpell()];
			QueryBuilder.filter.mockResolvedValue(mockSpells);

			await repository.filterSpells({
				level: 3,
				tradition: 'arcane',
				trait: 'evocation'
			});

			expect(QueryBuilder.filter).toHaveBeenCalledWith({
				type: 'spell',
				level: 3,
				tradition: 'arcane',
				trait: 'evocation',
				minLevel: undefined,
				maxLevel: undefined
			});
		});

		it('should apply in-memory spellType filter', async () => {
			const mockSpells = [
				createMockSpell({ id: 'spell-1', spellType: 'focus' }),
				createMockSpell({ id: 'spell-2', spellType: 'standard' })
			];
			QueryBuilder.filter.mockResolvedValue(mockSpells);

			const result = await repository.filterSpells({ spellType: 'focus' });

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('spell-1');
		});
	});

	describe('clearSpellCache()', () => {
		it('should invalidate all spell cache prefixes', () => {
			repository.clearSpellCache();

			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('all:spell');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('level:spell');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('tradition:');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('trait:spell');
		});
	});
});
