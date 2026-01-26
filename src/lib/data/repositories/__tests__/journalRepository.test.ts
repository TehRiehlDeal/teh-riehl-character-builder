/**
 * Tests for Journal Repository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create simple mock data
const createMockJournal = (overrides = {}) => ({
	id: 'test-journal',
	name: 'Test Journal',
	pages: [],
	...overrides
});

const createMockPage = (overrides = {}) => ({
	id: 'test-page',
	name: 'Test Page',
	type: 'text' as const,
	content: '<p>Test content</p>',
	sortOrder: 0,
	...overrides
});

vi.mock('../../database', () => ({
	DatabaseManager: {
		query: vi.fn(),
		queryOne: vi.fn()
	},
	QueryCache: {
		getOrFetch: vi.fn(),
		invalidatePrefix: vi.fn()
	}
}));

describe('Journal Repository', () => {
	let DatabaseManager: any;
	let QueryCache: any;
	let repository: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		const dbModule = await import('../../database');
		DatabaseManager = dbModule.DatabaseManager;
		QueryCache = dbModule.QueryCache;
		repository = await import('../journalRepository');
	});

	describe('getAllJournals()', () => {
		it('should use QueryCache with correct key', async () => {
			const mockJournals = [createMockJournal()];
			QueryCache.getOrFetch.mockResolvedValue(mockJournals);

			const result = await repository.getAllJournals();

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('all:journals', expect.any(Function));
			expect(result).toEqual(mockJournals);
		});

		it('should query and parse journal data', async () => {
			const mockJournal = createMockJournal();
			const mockRows = [{ data: JSON.stringify(mockJournal) }];
			DatabaseManager.query.mockResolvedValue(mockRows);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getAllJournals();

			expect(DatabaseManager.query).toHaveBeenCalledWith(
				'SELECT data FROM journals ORDER BY name'
			);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(mockJournal);
		});
	});

	describe('getJournalById()', () => {
		it('should return journal by ID', async () => {
			const mockJournal = createMockJournal({ id: 'test-journal' });
			QueryCache.getOrFetch.mockResolvedValue(mockJournal);

			const result = await repository.getJournalById('test-journal');

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('journal:test-journal', expect.any(Function));
			expect(result).toEqual(mockJournal);
		});

		it('should return null when not found', async () => {
			DatabaseManager.queryOne.mockResolvedValue(null);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getJournalById('nonexistent');

			expect(result).toBeNull();
		});
	});

	describe('getPageById()', () => {
		it('should return page by ID', async () => {
			const mockPage = createMockPage();
			QueryCache.getOrFetch.mockResolvedValue(mockPage);

			const result = await repository.getPageById('test-page');

			expect(QueryCache.getOrFetch).toHaveBeenCalledWith('journal-page:test-page', expect.any(Function));
			expect(result).toEqual(mockPage);
		});

		it('should transform database row to page object', async () => {
			const mockRow = {
				id: 'page-1',
				journal_id: 'journal-1',
				name: 'Page Name',
				type: 'text',
				content: '<p>Content</p>',
				sort_order: 5
			};
			DatabaseManager.queryOne.mockResolvedValue(mockRow);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getPageById('page-1');

			expect(result).toEqual({
				id: 'page-1',
				name: 'Page Name',
				type: 'text',
				content: '<p>Content</p>',
				sortOrder: 5
			});
		});

		it('should return null when not found', async () => {
			DatabaseManager.queryOne.mockResolvedValue(null);
			QueryCache.getOrFetch.mockImplementation((key, fetchFn) => fetchFn());

			const result = await repository.getPageById('nonexistent');

			expect(result).toBeNull();
		});
	});

	describe('getPageWithJournal()', () => {
		it('should return page with parent journal', async () => {
			const mockRow = {
				journal_id: 'journal-1',
				page_id: 'page-1',
				page_name: 'Page Name',
				page_type: 'text',
				page_content: '<p>Content</p>',
				page_sort_order: 0
			};
			const mockJournal = createMockJournal({ id: 'journal-1' });

			DatabaseManager.queryOne.mockResolvedValue(mockRow);
			QueryCache.getOrFetch.mockResolvedValue(mockJournal);

			const result = await repository.getPageWithJournal('page-1');

			expect(result).toEqual({
				journal: mockJournal,
				page: {
					id: 'page-1',
					name: 'Page Name',
					type: 'text',
					content: '<p>Content</p>',
					sortOrder: 0
				}
			});
		});

		it('should return null when page not found', async () => {
			DatabaseManager.queryOne.mockResolvedValue(null);

			const result = await repository.getPageWithJournal('nonexistent');

			expect(result).toBeNull();
		});

		it('should return null when journal not found', async () => {
			const mockRow = {
				journal_id: 'journal-1',
				page_id: 'page-1',
				page_name: 'Page Name',
				page_type: 'text',
				page_content: '<p>Content</p>',
				page_sort_order: 0
			};

			DatabaseManager.queryOne.mockResolvedValue(mockRow);
			QueryCache.getOrFetch.mockResolvedValue(null);

			const result = await repository.getPageWithJournal('page-1');

			expect(result).toBeNull();
		});
	});

	describe('getPageByName()', () => {
		it('should find page by name in journal', async () => {
			const mockRow = {
				id: 'page-1',
				name: 'Page Name',
				type: 'text',
				content: '<p>Content</p>',
				sort_order: 0
			};
			DatabaseManager.queryOne.mockResolvedValue(mockRow);

			const result = await repository.getPageByName('journal-1', 'Page Name');

			expect(DatabaseManager.queryOne).toHaveBeenCalledWith(
				'SELECT id, name, type, content, sort_order FROM journal_pages WHERE journal_id = ? AND name = ? COLLATE NOCASE',
				['journal-1', 'Page Name']
			);
			expect(result).toEqual({
				id: 'page-1',
				name: 'Page Name',
				type: 'text',
				content: '<p>Content</p>',
				sortOrder: 0
			});
		});

		it('should return null when not found', async () => {
			DatabaseManager.queryOne.mockResolvedValue(null);

			const result = await repository.getPageByName('journal-1', 'Nonexistent');

			expect(result).toBeNull();
		});
	});

	describe('searchPages()', () => {
		it('should search pages by name', async () => {
			const mockRows = [
				{
					id: 'page-1',
					name: 'Test Page',
					type: 'text',
					content: '<p>Content</p>',
					sort_order: 0
				},
				{
					id: 'page-2',
					name: 'Another Test',
					type: 'text',
					content: '<p>More</p>',
					sort_order: 1
				}
			];
			DatabaseManager.query.mockResolvedValue(mockRows);

			const result = await repository.searchPages('test');

			expect(DatabaseManager.query).toHaveBeenCalledWith(
				'SELECT id, name, type, content, sort_order FROM journal_pages WHERE name LIKE ? COLLATE NOCASE',
				['%test%']
			);
			expect(result).toHaveLength(2);
		});

		it('should return empty for empty query', async () => {
			const result = await repository.searchPages('');
			expect(result).toEqual([]);
		});
	});

	describe('clearJournalCache()', () => {
		it('should invalidate all journal cache prefixes', () => {
			repository.clearJournalCache();

			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('all:journals');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('journal:');
			expect(QueryCache.invalidatePrefix).toHaveBeenCalledWith('journal-page:');
		});
	});
});
