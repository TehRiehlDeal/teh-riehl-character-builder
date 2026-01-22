/**
 * Journal Repository
 *
 * Provides access to journal data using SQLite.
 */

import type { JournalEntry, JournalPage } from '../types/app';
import { DatabaseManager, QueryCache } from '../database';

/**
 * Get all journals
 */
export async function getAllJournals(): Promise<JournalEntry[]> {
	return QueryCache.getOrFetch('all:journals', async () => {
		const rows = await DatabaseManager.query<{ data: string }>(
			'SELECT data FROM journals ORDER BY name'
		);
		return rows.map((row) => JSON.parse(row.data) as JournalEntry);
	});
}

/**
 * Get a journal by ID
 */
export async function getJournalById(id: string): Promise<JournalEntry | null> {
	return QueryCache.getOrFetch(`journal:${id}`, async () => {
		const row = await DatabaseManager.queryOne<{ data: string }>(
			'SELECT data FROM journals WHERE id = ?',
			[id]
		);
		return row ? (JSON.parse(row.data) as JournalEntry) : null;
	});
}

/**
 * Get a journal page by ID
 */
export async function getPageById(pageId: string): Promise<JournalPage | null> {
	return QueryCache.getOrFetch(`journal-page:${pageId}`, async () => {
		const row = await DatabaseManager.queryOne<{
			id: string;
			journal_id: string;
			name: string;
			type: string;
			content: string;
			sort_order: number;
		}>('SELECT id, journal_id, name, type, content, sort_order FROM journal_pages WHERE id = ?', [
			pageId
		]);

		if (!row) return null;

		return {
			id: row.id,
			name: row.name,
			type: row.type as 'text' | 'image' | 'pdf' | 'video',
			content: row.content || '',
			sortOrder: row.sort_order
		};
	});
}

/**
 * Get a page with its parent journal
 */
export async function getPageWithJournal(
	pageId: string
): Promise<{ journal: JournalEntry; page: JournalPage } | null> {
	const row = await DatabaseManager.queryOne<{
		journal_id: string;
		page_id: string;
		page_name: string;
		page_type: string;
		page_content: string;
		page_sort_order: number;
	}>(
		`SELECT
			jp.journal_id,
			jp.id as page_id,
			jp.name as page_name,
			jp.type as page_type,
			jp.content as page_content,
			jp.sort_order as page_sort_order
		FROM journal_pages jp
		WHERE jp.id = ?`,
		[pageId]
	);

	if (!row) return null;

	const journal = await getJournalById(row.journal_id);
	if (!journal) return null;

	const page: JournalPage = {
		id: row.page_id,
		name: row.page_name,
		type: row.page_type as 'text' | 'image' | 'pdf' | 'video',
		content: row.page_content || '',
		sortOrder: row.page_sort_order
	};

	return { journal, page };
}

/**
 * Get a page by name from a specific journal
 */
export async function getPageByName(
	journalId: string,
	pageName: string
): Promise<JournalPage | null> {
	const row = await DatabaseManager.queryOne<{
		id: string;
		name: string;
		type: string;
		content: string;
		sort_order: number;
	}>(
		'SELECT id, name, type, content, sort_order FROM journal_pages WHERE journal_id = ? AND name = ? COLLATE NOCASE',
		[journalId, pageName]
	);

	if (!row) return null;

	return {
		id: row.id,
		name: row.name,
		type: row.type as 'text' | 'image' | 'pdf' | 'video',
		content: row.content || '',
		sortOrder: row.sort_order
	};
}

/**
 * Search for pages by name across all journals
 */
export async function searchPages(query: string): Promise<JournalPage[]> {
	if (!query || query.trim() === '') return [];

	const rows = await DatabaseManager.query<{
		id: string;
		name: string;
		type: string;
		content: string;
		sort_order: number;
	}>('SELECT id, name, type, content, sort_order FROM journal_pages WHERE name LIKE ? COLLATE NOCASE', [
		`%${query}%`
	]);

	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		type: row.type as 'text' | 'image' | 'pdf' | 'video',
		content: row.content || '',
		sortOrder: row.sort_order
	}));
}

/**
 * Clear the journal cache
 */
export function clearJournalCache(): void {
	QueryCache.invalidatePrefix('all:journals');
	QueryCache.invalidatePrefix('journal:');
	QueryCache.invalidatePrefix('journal-page:');
}
