/**
 * Tests for Class Repository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockClass } from '../../__tests__/fixtures';

vi.mock('../../database', () => ({
	QueryBuilder: {
		getAll: vi.fn(),
		getById: vi.fn(),
		searchByName: vi.fn()
	},
	QueryCache: {
		getOrFetch: vi.fn(),
		invalidatePrefix: vi.fn()
	},
	CacheKeys: {
		all: vi.fn((type) => `all:${type}`),
		byId: vi.fn((id) => `id:${id}`)
	}
}));

describe('Class Repository', () => {
	let QueryBuilder: any;
	let QueryCache: any;
	let repository: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		const dbModule = await import('../../database');
		QueryBuilder = dbModule.QueryBuilder;
		QueryCache = dbModule.QueryCache;
		repository = await import('../classRepository');
	});

	describe('getAllClasses()', () => {
		it('should use QueryCache with correct key', async () => {
			const mockClasses = [createMockClass()];
			QueryCache.getOrFetch.mockResolvedValue(mockClasses);

			const result = await repository.getAllClasses();

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('all:class', expect.any(Function));
			expect(result).toEqual(mockClasses);
		});
	});

	describe('getClassById()', () => {
		it('should return class by ID', async () => {
			const mockClass = createMockClass({ id: 'test-class' });
			QueryCache.getOrFetch.mockResolvedValue(mockClass);

			const result = await repository.getClassById('test-class');

			expect(result).toEqual(mockClass);
		});
	});

	describe('getClassByName()', () => {
		it('should find class by name case-insensitively', async () => {
			const mockClasses = [
				createMockClass({ name: 'Fighter' }),
				createMockClass({ name: 'Wizard' })
			];
			QueryBuilder.getAll.mockResolvedValue(mockClasses);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClassByName('FIGHTER');

			expect(result?.name).toBe('Fighter');
		});

		it('should return null when not found', async () => {
			QueryBuilder.getAll.mockResolvedValue([]);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClassByName('Nonexistent');

			expect(result).toBeNull();
		});
	});

	describe('getClassesByKeyAbility()', () => {
		it('should filter by key ability', async () => {
			const mockClasses = [
				createMockClass({ id: '1', keyAbility: ['str'] }),
				createMockClass({ id: '2', keyAbility: ['int'] }),
				createMockClass({ id: '3', keyAbility: ['str', 'dex'] })
			];
			QueryBuilder.getAll.mockResolvedValue(mockClasses);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClassesByKeyAbility('str');

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe('1');
			expect(result[1].id).toBe('3');
		});
	});

	describe('searchClasses()', () => {
		it('should search by name', async () => {
			const mockClasses = [createMockClass({ name: 'Fighter' })];
			QueryBuilder.searchByName.mockResolvedValue(mockClasses);

			await repository.searchClasses('fight');

			expect(QueryBuilder.searchByName).toHaveBeenCalledWith('class', 'fight');
		});

		it('should return empty for empty query', async () => {
			const result = await repository.searchClasses('');
			expect(result).toEqual([]);
		});
	});

	describe('getClasses()', () => {
		it('should filter by minHP', async () => {
			const mockClasses = [
				createMockClass({ id: '1', hp: 6 }),
				createMockClass({ id: '2', hp: 10 })
			];
			QueryBuilder.getAll.mockResolvedValue(mockClasses);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClasses({ minHP: 10 });

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('2');
		});

		it('should filter by maxHP', async () => {
			const mockClasses = [
				createMockClass({ id: '1', hp: 6 }),
				createMockClass({ id: '2', hp: 10 })
			];
			QueryBuilder.getAll.mockResolvedValue(mockClasses);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClasses({ maxHP: 6 });

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});

		it('should filter by hasHeavyArmor', async () => {
			const mockClasses = [
				createMockClass({
					id: '1',
					proficiencies: {
						...createMockClass().proficiencies,
						defenses: { unarmored: 1, light: 1, medium: 1, heavy: 2 }
					}
				}),
				createMockClass({
					id: '2',
					proficiencies: {
						...createMockClass().proficiencies,
						defenses: { unarmored: 1, light: 1, medium: 1, heavy: 0 }
					}
				})
			];
			QueryBuilder.getAll.mockResolvedValue(mockClasses);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClasses({ hasHeavyArmor: true });

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});

		it('should filter by hasMartialWeapons', async () => {
			const mockClasses = [
				createMockClass({
					id: '1',
					proficiencies: {
						...createMockClass().proficiencies,
						attacks: { simple: 2, martial: 2, advanced: 0, unarmed: 2 }
					}
				}),
				createMockClass({
					id: '2',
					proficiencies: {
						...createMockClass().proficiencies,
						attacks: { simple: 2, martial: 0, advanced: 0, unarmed: 2 }
					}
				})
			];
			QueryBuilder.getAll.mockResolvedValue(mockClasses);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClasses({ hasMartialWeapons: true });

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});
	});

	describe('getHighHPClasses()', () => {
		it('should return classes with HP >= 10', async () => {
			const mockClasses = [
				createMockClass({ id: '1', hp: 10 }),
				createMockClass({ id: '2', hp: 6 }),
				createMockClass({ id: '3', hp: 12 })
			];
			QueryBuilder.getAll.mockResolvedValue(mockClasses);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getHighHPClasses();

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe('1');
			expect(result[1].id).toBe('3');
		});
	});

	describe('getClassesWithHeavyArmor()', () => {
		it('should return classes with heavy armor proficiency', async () => {
			const mockClasses = [
				createMockClass({
					id: '1',
					proficiencies: {
						...createMockClass().proficiencies,
						defenses: { unarmored: 1, light: 1, medium: 1, heavy: 2 }
					}
				}),
				createMockClass({ id: '2' })
			];
			QueryBuilder.getAll.mockResolvedValue(mockClasses);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClassesWithHeavyArmor();

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});
	});

	describe('getClassesWithMartialWeapons()', () => {
		it('should return classes with martial weapon proficiency', async () => {
			const mockClasses = [
				createMockClass({
					id: '1',
					proficiencies: {
						...createMockClass().proficiencies,
						attacks: { simple: 2, martial: 2, advanced: 0, unarmed: 2 }
					}
				}),
				createMockClass({
					id: '2',
					proficiencies: {
						...createMockClass().proficiencies,
						attacks: { simple: 2, martial: 0, advanced: 0, unarmed: 2 }
					}
				})
			];
			QueryBuilder.getAll.mockResolvedValue(mockClasses);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClassesWithMartialWeapons();

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});
	});

	describe('getClassesWithExpertPerception()', () => {
		it('should return classes with perception >= 2', async () => {
			const mockClasses = [
				createMockClass({
					id: '1',
					proficiencies: { ...createMockClass().proficiencies, perception: 2 }
				}),
				createMockClass({
					id: '2',
					proficiencies: { ...createMockClass().proficiencies, perception: 1 }
				})
			];
			QueryBuilder.getAll.mockResolvedValue(mockClasses);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getClassesWithExpertPerception();

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('1');
		});
	});

	describe('getFeatSlotsAtLevel()', () => {
		it('should return feat slots for a specific level', async () => {
			const mockClass = createMockClass({
				featSlots: {
					ancestry: [1, 5, 9],
					class: [1, 2, 4, 6],
					general: [3, 7],
					skill: [2, 4]
				}
			});
			QueryBuilder.getById.mockResolvedValue(mockClass);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getFeatSlotsAtLevel('test-class', 2);

			expect(result).toEqual({
				ancestry: false,
				class: true,
				general: false,
				skill: true
			});
		});

		it('should return null for nonexistent class', async () => {
			QueryBuilder.getById.mockResolvedValue(null);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getFeatSlotsAtLevel('nonexistent', 1);

			expect(result).toBeNull();
		});
	});

	describe('clearClassesCache()', () => {
		it('should invalidate cache prefix', () => {
			repository.clearClassesCache();

			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('all:class');
		});
	});
});
