/**
 * Tests for QueryBuilder
 *
 * Covers basic methods, filter building, helper methods, and SQL generation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockFeat } from '../../__tests__/fixtures';

// Mock DatabaseManager before importing QueryBuilder
vi.mock('../DatabaseManager', () => ({
	DatabaseManager: {
		query: vi.fn(),
		queryOne: vi.fn(),
		queryItems: vi.fn(),
		queryItem: vi.fn(),
		count: vi.fn(),
		searchText: vi.fn()
	}
}));

describe('QueryBuilder', () => {
	let DatabaseManager: any;
	let QueryBuilder: any;

	beforeEach(async () => {
		// Import mocked DatabaseManager and QueryBuilder
		const dbModule = await import('../DatabaseManager');
		const qbModule = await import('../QueryBuilder');
		DatabaseManager = dbModule.DatabaseManager;
		QueryBuilder = qbModule.QueryBuilder;

		// Reset all mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Methods', () => {
		it('getAll() should query items by type with ORDER BY name', async () => {
			const mockFeats = [createMockFeat()];
			DatabaseManager.queryItems.mockResolvedValue(mockFeats);

			const result = await QueryBuilder.getAll('feat');

			expect(DatabaseManager.queryItems).toHaveBeenCalledWith(
				'SELECT data FROM items WHERE type = ? ORDER BY name',
				['feat']
			);
			expect(result).toEqual(mockFeats);
		});

		it('getById() should return single item by ID', async () => {
			const mockFeat = createMockFeat();
			DatabaseManager.queryItem.mockResolvedValue(mockFeat);

			const result = await QueryBuilder.getById('test-feat-id');

			expect(DatabaseManager.queryItem).toHaveBeenCalledWith(
				'SELECT data FROM items WHERE id = ?',
				['test-feat-id']
			);
			expect(result).toEqual(mockFeat);
		});

		it('getById() should return null when not found', async () => {
			DatabaseManager.queryItem.mockResolvedValue(null);

			const result = await QueryBuilder.getById('nonexistent');

			expect(result).toBeNull();
		});

		it('getByIds() should return items by IDs using IN clause', async () => {
			const mockFeats = [createMockFeat({ id: 'feat-1' }), createMockFeat({ id: 'feat-2' })];
			DatabaseManager.queryItems.mockResolvedValue(mockFeats);

			const result = await QueryBuilder.getByIds(['feat-1', 'feat-2']);

			expect(DatabaseManager.queryItems).toHaveBeenCalledWith(
				'SELECT data FROM items WHERE id IN (?, ?)',
				['feat-1', 'feat-2']
			);
			expect(result).toEqual(mockFeats);
		});

		it('getByIds() should return empty array for empty input', async () => {
			const result = await QueryBuilder.getByIds([]);

			expect(DatabaseManager.queryItems).not.toHaveBeenCalled();
			expect(result).toEqual([]);
		});

		it('getByLevel() should query items by type and exact level', async () => {
			const mockFeats = [createMockFeat({ level: 5 })];
			DatabaseManager.queryItems.mockResolvedValue(mockFeats);

			const result = await QueryBuilder.getByLevel('feat', 5);

			expect(DatabaseManager.queryItems).toHaveBeenCalledWith(
				'SELECT data FROM items WHERE type = ? AND level = ? ORDER BY name',
				['feat', 5]
			);
			expect(result).toEqual(mockFeats);
		});

		it('getAvailableAtLevel() should query items with level <= characterLevel', async () => {
			const mockFeats = [createMockFeat({ level: 1 }), createMockFeat({ level: 3 })];
			DatabaseManager.queryItems.mockResolvedValue(mockFeats);

			const result = await QueryBuilder.getAvailableAtLevel('feat', 5);

			expect(DatabaseManager.queryItems).toHaveBeenCalledWith(
				'SELECT data FROM items WHERE type = ? AND level <= ? ORDER BY level, name',
				['feat', 5]
			);
			expect(result).toEqual(mockFeats);
		});
	});

	describe('Filter Building', () => {
		it('filter() should handle type-only filter', async () => {
			const mockFeats = [createMockFeat()];
			DatabaseManager.queryItems.mockResolvedValue(mockFeats);

			await QueryBuilder.filter({ type: 'feat' });

			const sqlCall = DatabaseManager.queryItems.mock.calls[0][0];
			const params = DatabaseManager.queryItems.mock.calls[0][1];

			expect(sqlCall).toContain('WHERE i.type = ?');
			expect(sqlCall).toContain('ORDER BY i.name ASC');
			expect(params).toEqual(['feat']);
		});

		it('filter() should handle level filter', async () => {
			DatabaseManager.queryItems.mockResolvedValue([]);

			await QueryBuilder.filter({ type: 'feat', level: 5 });

			const sqlCall = DatabaseManager.queryItems.mock.calls[0][0];
			const params = DatabaseManager.queryItems.mock.calls[0][1];

			expect(sqlCall).toContain('i.type = ?');
			expect(sqlCall).toContain('i.level = ?');
			expect(params).toEqual(['feat', 5]);
		});

		it('filter() should handle minLevel and maxLevel', async () => {
			DatabaseManager.queryItems.mockResolvedValue([]);

			await QueryBuilder.filter({ type: 'feat', minLevel: 1, maxLevel: 10 });

			const sqlCall = DatabaseManager.queryItems.mock.calls[0][0];
			const params = DatabaseManager.queryItems.mock.calls[0][1];

			expect(sqlCall).toContain('i.level >= ?');
			expect(sqlCall).toContain('i.level <= ?');
			expect(params).toEqual(['feat', 1, 10]);
		});

		it('filter() should handle rarity filter', async () => {
			DatabaseManager.queryItems.mockResolvedValue([]);

			await QueryBuilder.filter({ type: 'feat', rarity: 'uncommon' });

			const sqlCall = DatabaseManager.queryItems.mock.calls[0][0];
			const params = DatabaseManager.queryItems.mock.calls[0][1];

			expect(sqlCall).toContain('i.rarity = ?');
			expect(params).toEqual(['feat', 'uncommon']);
		});

		it('filter() should handle single trait with JOIN', async () => {
			DatabaseManager.queryItems.mockResolvedValue([]);

			await QueryBuilder.filter({ type: 'feat', trait: 'general' });

			const sqlCall = DatabaseManager.queryItems.mock.calls[0][0];
			const params = DatabaseManager.queryItems.mock.calls[0][1];

			expect(sqlCall).toContain('JOIN item_traits t ON i.id = t.item_id');
			expect(sqlCall).toContain('t.trait = ?');
			expect(params).toEqual(['feat', 'general']);
		});

		it('filter() should handle multiple traits with mode=any (IN clause)', async () => {
			DatabaseManager.queryItems.mockResolvedValue([]);

			await QueryBuilder.filter({ type: 'feat', traits: ['general', 'skill'], traitsMode: 'any' });

			const sqlCall = DatabaseManager.queryItems.mock.calls[0][0];
			const params = DatabaseManager.queryItems.mock.calls[0][1];

			expect(sqlCall).toContain('JOIN item_traits t ON i.id = t.item_id');
			expect(sqlCall).toContain('t.trait IN (?, ?)');
			expect(params).toEqual(['feat', 'general', 'skill']);
		});

		it('filter() should handle multiple traits with mode=all (multiple JOINs)', async () => {
			DatabaseManager.queryItems.mockResolvedValue([]);

			await QueryBuilder.filter({ type: 'feat', traits: ['general', 'skill'], traitsMode: 'all' });

			const sqlCall = DatabaseManager.queryItems.mock.calls[0][0];
			const params = DatabaseManager.queryItems.mock.calls[0][1];

			expect(sqlCall).toContain('JOIN item_traits t0 ON i.id = t0.item_id');
			expect(sqlCall).toContain('t0.trait = ?');
			expect(sqlCall).toContain('JOIN item_traits t1 ON i.id = t1.item_id');
			expect(sqlCall).toContain('t1.trait = ?');
			expect(params).toEqual(['feat', 'general', 'skill']);
		});

		it('filter() should handle feat category filter', async () => {
			DatabaseManager.queryItems.mockResolvedValue([]);

			await QueryBuilder.filter({ type: 'feat', category: 'general' });

			const sqlCall = DatabaseManager.queryItems.mock.calls[0][0];
			const params = DatabaseManager.queryItems.mock.calls[0][1];

			expect(sqlCall).toContain('JOIN feat_categories fc ON i.id = fc.item_id');
			expect(sqlCall).toContain('fc.category = ?');
			expect(params).toEqual(['feat', 'general']);
		});

		it('filter() should handle spell tradition filter', async () => {
			DatabaseManager.queryItems.mockResolvedValue([]);

			await QueryBuilder.filter({ type: 'spell', tradition: 'arcane' });

			const sqlCall = DatabaseManager.queryItems.mock.calls[0][0];
			const params = DatabaseManager.queryItems.mock.calls[0][1];

			expect(sqlCall).toContain('JOIN spell_traditions st ON i.id = st.item_id');
			expect(sqlCall).toContain('st.tradition = ?');
			expect(params).toEqual(['spell', 'arcane']);
		});

		it('filter() should handle spell traditions filter', async () => {
			DatabaseManager.queryItems.mockResolvedValue([]);

			await QueryBuilder.filter({ type: 'spell', traditions: ['arcane', 'occult'] });

			const sqlCall = DatabaseManager.queryItems.mock.calls[0][0];
			const params = DatabaseManager.queryItems.mock.calls[0][1];

			expect(sqlCall).toContain('JOIN spell_traditions st ON i.id = st.item_id');
			expect(sqlCall).toContain('st.tradition IN (?, ?)');
			expect(params).toEqual(['spell', 'arcane', 'occult']);
		});

		it('filter() should handle equipment type filter', async () => {
			DatabaseManager.queryItems.mockResolvedValue([]);

			await QueryBuilder.filter({ type: 'equipment', equipmentType: 'weapon' });

			const sqlCall = DatabaseManager.queryItems.mock.calls[0][0];
			const params = DatabaseManager.queryItems.mock.calls[0][1];

			expect(sqlCall).toContain('JOIN equipment_meta em ON i.id = em.item_id');
			expect(sqlCall).toContain('em.equipment_type = ?');
			expect(params).toEqual(['equipment', 'weapon']);
		});

		it('filter() should handle equipment category filter', async () => {
			DatabaseManager.queryItems.mockResolvedValue([]);

			await QueryBuilder.filter({ type: 'equipment', category: 'simple' });

			const sqlCall = DatabaseManager.queryItems.mock.calls[0][0];
			const params = DatabaseManager.queryItems.mock.calls[0][1];

			expect(sqlCall).toContain('JOIN equipment_meta em ON i.id = em.item_id');
			expect(sqlCall).toContain('em.category = ?');
			expect(params).toEqual(['equipment', 'simple']);
		});

		it('filter() should handle heritage ancestry filter', async () => {
			DatabaseManager.queryItems.mockResolvedValue([]);

			await QueryBuilder.filter({ type: 'heritage', ancestrySlug: 'elf' });

			const sqlCall = DatabaseManager.queryItems.mock.calls[0][0];
			const params = DatabaseManager.queryItems.mock.calls[0][1];

			expect(sqlCall).toContain('JOIN heritage_ancestry ha ON i.id = ha.item_id');
			expect(sqlCall).toContain('ha.ancestry_slug = ?');
			expect(params).toEqual(['heritage', 'elf']);
		});

		it('filter() should handle custom ORDER BY', async () => {
			DatabaseManager.queryItems.mockResolvedValue([]);

			await QueryBuilder.filter({ type: 'feat', orderBy: 'level', orderDir: 'DESC' });

			const sqlCall = DatabaseManager.queryItems.mock.calls[0][0];

			expect(sqlCall).toContain('ORDER BY i.level DESC');
		});

		it('filter() should handle LIMIT', async () => {
			DatabaseManager.queryItems.mockResolvedValue([]);

			await QueryBuilder.filter({ type: 'feat', limit: 10 });

			const sqlCall = DatabaseManager.queryItems.mock.calls[0][0];

			expect(sqlCall).toContain('LIMIT 10');
		});

		it('filter() should handle LIMIT and OFFSET', async () => {
			DatabaseManager.queryItems.mockResolvedValue([]);

			await QueryBuilder.filter({ type: 'feat', limit: 10, offset: 20 });

			const sqlCall = DatabaseManager.queryItems.mock.calls[0][0];

			expect(sqlCall).toContain('LIMIT 10 OFFSET 20');
		});

		it('filter() should handle complex combination of filters', async () => {
			DatabaseManager.queryItems.mockResolvedValue([]);

			await QueryBuilder.filter({
				type: 'feat',
				minLevel: 1,
				maxLevel: 5,
				rarity: 'common',
				traits: ['general'],
				traitsMode: 'any',
				category: 'general',
				orderBy: 'level',
				orderDir: 'ASC',
				limit: 20,
				offset: 10
			});

			const sqlCall = DatabaseManager.queryItems.mock.calls[0][0];
			const params = DatabaseManager.queryItems.mock.calls[0][1];

			expect(sqlCall).toContain('WHERE i.type = ?');
			expect(sqlCall).toContain('i.level >= ?');
			expect(sqlCall).toContain('i.level <= ?');
			expect(sqlCall).toContain('i.rarity = ?');
			expect(sqlCall).toContain('JOIN item_traits t ON i.id = t.item_id');
			expect(sqlCall).toContain('t.trait IN (?)');
			expect(sqlCall).toContain('JOIN feat_categories fc ON i.id = fc.item_id');
			expect(sqlCall).toContain('fc.category = ?');
			expect(sqlCall).toContain('ORDER BY i.level ASC');
			expect(sqlCall).toContain('LIMIT 20 OFFSET 10');
			expect(params).toEqual(['feat', 1, 5, 'common', 'general', 'general']);
		});
	});

	describe('Helper Methods', () => {
		it('searchByName() should use LIKE with COLLATE NOCASE', async () => {
			const mockFeats = [createMockFeat()];
			DatabaseManager.queryItems.mockResolvedValue(mockFeats);

			await QueryBuilder.searchByName('feat', 'test');

			expect(DatabaseManager.queryItems).toHaveBeenCalledWith(
				'SELECT data FROM items WHERE type = ? AND name LIKE ? COLLATE NOCASE ORDER BY name',
				['feat', '%test%']
			);
		});

		it('fullTextSearch() should delegate to DatabaseManager.searchText', async () => {
			const mockFeats = [createMockFeat()];
			DatabaseManager.searchText.mockResolvedValue(mockFeats);

			const result = await QueryBuilder.fullTextSearch('feat', 'test query');

			expect(DatabaseManager.searchText).toHaveBeenCalledWith('test query', 'feat');
			expect(result).toEqual(mockFeats);
		});

		it('getByTrait() should delegate to filter()', async () => {
			const mockFeats = [createMockFeat()];
			DatabaseManager.queryItems.mockResolvedValue(mockFeats);

			await QueryBuilder.getByTrait('feat', 'general');

			const sqlCall = DatabaseManager.queryItems.mock.calls[0][0];
			const params = DatabaseManager.queryItems.mock.calls[0][1];

			expect(sqlCall).toContain('JOIN item_traits t ON i.id = t.item_id');
			expect(sqlCall).toContain('t.trait = ?');
			expect(params).toEqual(['feat', 'general']);
		});

		it('countFilter() should use COUNT with same filters as filter()', async () => {
			DatabaseManager.count.mockResolvedValue(42);

			const result = await QueryBuilder.countFilter({
				type: 'feat',
				level: 5,
				rarity: 'common'
			});

			const sqlCall = DatabaseManager.count.mock.calls[0][0];
			const params = DatabaseManager.count.mock.calls[0][1];

			expect(sqlCall).toContain('COUNT(DISTINCT i.id)');
			expect(sqlCall).toContain('WHERE i.type = ?');
			expect(sqlCall).toContain('i.level = ?');
			expect(sqlCall).toContain('i.rarity = ?');
			expect(params).toEqual(['feat', 5, 'common']);
			expect(result).toBe(42);
		});

		it('getDistinctValues() should return distinct rarity values', async () => {
			DatabaseManager.query.mockResolvedValue([{ rarity: 'common' }, { rarity: 'uncommon' }]);

			const result = await QueryBuilder.getDistinctValues('feat', 'rarity');

			expect(DatabaseManager.query).toHaveBeenCalledWith(
				'SELECT DISTINCT rarity FROM items WHERE type = ? ORDER BY rarity',
				['feat']
			);
			expect(result).toEqual(['common', 'uncommon']);
		});

		it('getDistinctValues() should return distinct level values', async () => {
			DatabaseManager.query.mockResolvedValue([{ level: 1 }, { level: 2 }, { level: 3 }]);

			const result = await QueryBuilder.getDistinctValues('feat', 'level');

			expect(DatabaseManager.query).toHaveBeenCalledWith(
				'SELECT DISTINCT level FROM items WHERE type = ? ORDER BY level',
				['feat']
			);
			expect(result).toEqual(['1', '2', '3']);
		});

		it('getTraitsForType() should JOIN item_traits table', async () => {
			DatabaseManager.query.mockResolvedValue([{ trait: 'general' }, { trait: 'skill' }]);

			const result = await QueryBuilder.getTraitsForType('feat');

			const sqlCall = DatabaseManager.query.mock.calls[0][0];
			const params = DatabaseManager.query.mock.calls[0][1];

			expect(sqlCall).toContain('JOIN items i ON t.item_id = i.id');
			expect(sqlCall).toContain('WHERE i.type = ?');
			expect(params).toEqual(['feat']);
			expect(result).toEqual(['general', 'skill']);
		});
	});
});
