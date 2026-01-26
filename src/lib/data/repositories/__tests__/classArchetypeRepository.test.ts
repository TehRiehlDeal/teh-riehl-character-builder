/**
 * Tests for Class Archetype Repository
 *
 * Tests complex filtering logic, universal archetypes, and prerequisite checks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockClassArchetype } from '../../__tests__/fixtures';

// Mock the database module
vi.mock('../../database', () => ({
	QueryBuilder: {
		filter: vi.fn()
	},
	QueryCache: {
		getOrFetch: vi.fn(),
		invalidate: vi.fn()
	}
}));

describe('Class Archetype Repository', () => {
	let QueryBuilder: any;
	let QueryCache: any;
	let repository: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();

		const dbModule = await import('../../database');
		QueryBuilder = dbModule.QueryBuilder;
		QueryCache = dbModule.QueryCache;

		repository = await import('../classArchetypeRepository');
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('loadAllClassArchetypes()', () => {
		it('should use QueryCache.getOrFetch with correct key', async () => {
			const mockArchetypes = [createMockClassArchetype()];
			QueryCache.getOrFetch.mockResolvedValue(mockArchetypes);

			const result = await repository.loadAllClassArchetypes();

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('all:class-archetype', expect.any(Function));
			expect(result).toEqual(mockArchetypes);
		});

		it('should filter class features for class-archetype trait', async () => {
			const mockFeatures = [
				createMockClassArchetype({ id: 'arch-1', traits: ['class-archetype', 'wizard'] }),
				createMockClassArchetype({ id: 'feat-2', traits: ['feat'] }), // Not an archetype
				createMockClassArchetype({ id: 'arch-3', traits: ['CLASS-ARCHETYPE'] }) // Case insensitive
			];

			QueryBuilder.filter.mockResolvedValue(mockFeatures);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.loadAllClassArchetypes();

			expect(QueryBuilder.filter).toHaveBeenCalledWith({
				type: 'feat',
				category: 'classfeature'
			});
			expect(result).toHaveLength(2);
			expect(result[0].id).toBe('arch-1');
			expect(result[1].id).toBe('arch-3');
		});

		it('should cache results across calls', async () => {
			const mockArchetypes = [createMockClassArchetype()];
			QueryCache.getOrFetch.mockResolvedValue(mockArchetypes);

			// First call
			const result1 = await repository.loadAllClassArchetypes();

			// Second call
			const result2 = await repository.loadAllClassArchetypes();

			// QueryCache should only be called once due to module-level cache
			expect(result1).toEqual(result2);
		});
	});

	describe('getClassArchetypesForClass()', () => {
		beforeEach(() => {
			// Clear module cache before each test to avoid cross-test pollution
			repository.clearClassArchetypeCache();
		});

		it('should return class-specific archetypes', async () => {
			const mockArchetypes = [
				createMockClassArchetype({
					id: 'wizard-arch',
					name: 'School Wizard',
					baseClass: 'wizard',
					isUniversal: false,
					traits: ['class-archetype']
				}),
				createMockClassArchetype({
					id: 'fighter-arch',
					name: 'Brawler',
					baseClass: 'fighter',
					isUniversal: false,
					traits: ['class-archetype']
				})
			];

			QueryBuilder.filter.mockResolvedValue(mockArchetypes);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClassArchetypesForClass('Wizard');

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('wizard-arch');
		});

		it('should match class name case-insensitively', async () => {
			const mockArchetypes = [
				createMockClassArchetype({
					id: 'wizard-arch',
					name: 'School Wizard',
					baseClass: 'wizard',
					isUniversal: false,
					traits: ['class-archetype']
				})
			];

			QueryBuilder.filter.mockResolvedValue(mockArchetypes);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result1 = await repository.getClassArchetypesForClass('WIZARD');
			repository.clearClassArchetypeCache();
			const result2 = await repository.getClassArchetypesForClass('Wizard');
			repository.clearClassArchetypeCache();
			const result3 = await repository.getClassArchetypesForClass('wizard');

			expect(result1).toHaveLength(1);
			expect(result2).toHaveLength(1);
			expect(result3).toHaveLength(1);
		});

		it('should include Flexible Spell Preparation for prepared casters', async () => {
			const mockArchetypes = [
				createMockClassArchetype({
					id: 'flex-prep',
					name: 'Flexible Spell Preparation',
					baseClass: null,
					isUniversal: true,
					traits: ['class-archetype']
				})
			];

			QueryBuilder.filter.mockResolvedValue(mockArchetypes);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			// Test all prepared spellcasting classes
			for (const className of ['cleric', 'druid', 'witch', 'wizard', 'animist']) {
				repository.clearClassArchetypeCache();
				const result = await repository.getClassArchetypesForClass(className);
				expect(result).toHaveLength(1);
				expect(result[0].name).toBe('Flexible Spell Preparation');
			}
		});

		it('should exclude Flexible Spell Preparation for spontaneous casters', async () => {
			const mockArchetypes = [
				createMockClassArchetype({
					id: 'flex-prep',
					name: 'Flexible Spell Preparation',
					baseClass: null,
					isUniversal: true,
					traits: ['class-archetype']
				})
			];

			QueryBuilder.filter.mockResolvedValue(mockArchetypes);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			// Test spontaneous casters should NOT get Flexible Spell Preparation
			for (const className of ['bard', 'oracle', 'sorcerer', 'psychic', 'summoner']) {
				repository.clearClassArchetypeCache();
				const result = await repository.getClassArchetypesForClass(className);
				expect(result).toHaveLength(0);
			}
		});

		it('should include Wellspring Magic for spontaneous casters', async () => {
			const mockArchetypes = [
				createMockClassArchetype({
					id: 'wellspring',
					name: 'Wellspring Magic',
					baseClass: null,
					isUniversal: true,
					traits: ['class-archetype']
				})
			];

			QueryBuilder.filter.mockResolvedValue(mockArchetypes);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			// Test all spontaneous spellcasting classes
			for (const className of ['bard', 'oracle', 'sorcerer', 'psychic', 'summoner']) {
				repository.clearClassArchetypeCache();
				const result = await repository.getClassArchetypesForClass(className);
				expect(result).toHaveLength(1);
				expect(result[0].name).toBe('Wellspring Magic');
			}
		});

		it('should include Elemental Magic for arcane/primal classes', async () => {
			const mockArchetypes = [
				createMockClassArchetype({
					id: 'elemental',
					name: 'Elemental Magic',
					baseClass: null,
					isUniversal: true,
					traits: ['class-archetype']
				})
			];

			QueryBuilder.filter.mockResolvedValue(mockArchetypes);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			// Test arcane/primal spellcasting classes
			for (const className of ['wizard', 'magus', 'druid', 'sorcerer', 'summoner', 'witch']) {
				repository.clearClassArchetypeCache();
				const result = await repository.getClassArchetypesForClass(className);
				expect(result).toHaveLength(1);
				expect(result[0].name).toBe('Elemental Magic');
			}
		});

		it('should exclude universal archetypes for non-spellcasters', async () => {
			const mockArchetypes = [
				createMockClassArchetype({
					id: 'universal',
					name: 'Flexible Spell Preparation',
					baseClass: null,
					isUniversal: true,
					traits: ['class-archetype']
				})
			];

			QueryBuilder.filter.mockResolvedValue(mockArchetypes);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClassArchetypesForClass('fighter');

			expect(result).toHaveLength(0);
		});

		it('should combine class-specific and universal archetypes', async () => {
			const mockArchetypes = [
				createMockClassArchetype({
					id: 'wizard-specific',
					name: 'School Wizard',
					baseClass: 'wizard',
					isUniversal: false,
					traits: ['class-archetype']
				}),
				createMockClassArchetype({
					id: 'flex-prep',
					name: 'Flexible Spell Preparation',
					baseClass: null,
					isUniversal: true,
					traits: ['class-archetype']
				})
			];

			QueryBuilder.filter.mockResolvedValue(mockArchetypes);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClassArchetypesForClass('wizard');

			expect(result).toHaveLength(2);
			expect(result.map((a) => a.id)).toEqual(['wizard-specific', 'flex-prep']);
		});
	});

	describe('getClassArchetypeById()', () => {
		beforeEach(() => {
			repository.clearClassArchetypeCache();
		});

		it('should return archetype by ID', async () => {
			const mockArchetypes = [
				createMockClassArchetype({ id: 'arch-1', name: 'Archetype 1', traits: ['class-archetype'] }),
				createMockClassArchetype({ id: 'arch-2', name: 'Archetype 2', traits: ['class-archetype'] })
			];

			QueryBuilder.filter.mockResolvedValue(mockArchetypes);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClassArchetypeById('arch-2');

			expect(result).not.toBeNull();
			expect(result?.id).toBe('arch-2');
			expect(result?.name).toBe('Archetype 2');
		});

		it('should return null when ID not found', async () => {
			const mockArchetypes = [createMockClassArchetype({ id: 'arch-1', traits: ['class-archetype'] })];

			QueryBuilder.filter.mockResolvedValue(mockArchetypes);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClassArchetypeById('nonexistent');

			expect(result).toBeNull();
		});
	});

	describe('getClassArchetypeByName()', () => {
		beforeEach(() => {
			repository.clearClassArchetypeCache();
		});

		it('should return archetype by name', async () => {
			const mockArchetypes = [
				createMockClassArchetype({ id: 'arch-1', name: 'School Wizard', traits: ['class-archetype'] }),
				createMockClassArchetype({ id: 'arch-2', name: 'Brawler', traits: ['class-archetype'] })
			];

			QueryBuilder.filter.mockResolvedValue(mockArchetypes);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClassArchetypeByName('Brawler');

			expect(result).not.toBeNull();
			expect(result?.id).toBe('arch-2');
			expect(result?.name).toBe('Brawler');
		});

		it('should match name case-insensitively', async () => {
			const mockArchetypes = [
				createMockClassArchetype({ id: 'arch-1', name: 'School Wizard', traits: ['class-archetype'] })
			];

			QueryBuilder.filter.mockResolvedValue(mockArchetypes);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result1 = await repository.getClassArchetypeByName('SCHOOL WIZARD');
			repository.clearClassArchetypeCache();
			const result2 = await repository.getClassArchetypeByName('school wizard');
			repository.clearClassArchetypeCache();
			const result3 = await repository.getClassArchetypeByName('School Wizard');

			expect(result1?.id).toBe('arch-1');
			expect(result2?.id).toBe('arch-1');
			expect(result3?.id).toBe('arch-1');
		});

		it('should return null when name not found', async () => {
			const mockArchetypes = [
				createMockClassArchetype({ name: 'School Wizard', traits: ['class-archetype'] })
			];

			QueryBuilder.filter.mockResolvedValue(mockArchetypes);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClassArchetypeByName('Nonexistent');

			expect(result).toBeNull();
		});
	});

	describe('clearClassArchetypeCache()', () => {
		it('should clear module cache and QueryCache', () => {
			repository.clearClassArchetypeCache();

			expect(QueryCache.invalidate).toHaveBeenCalledWith('all:class-archetype');
		});
	});
});
