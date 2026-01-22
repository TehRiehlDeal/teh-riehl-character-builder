/**
 * Journal Loader
 *
 * Provides access to journal entry data using SQLite.
 * Maintains the same public API as the previous JSON-based implementation.
 */

import type { JournalEntry, JournalPage } from '../types/app';
import {
	getAllJournals,
	getJournalById as getJournalByIdFromRepo,
	getPageById as getPageByIdFromRepo,
	getPageWithJournal as getPageWithJournalFromRepo,
	getPageByName as getPageByNameFromRepo,
	searchPages as searchPagesFromRepo
} from '../repositories/journalRepository';

/**
 * Journal loader class
 * Provides a compatible interface with the previous implementation
 */
export class JournalLoader {
	/**
	 * Load and index all journal entries
	 * Note: With SQLite, this is a no-op as data is queried on-demand
	 */
	async loadAll(): Promise<void> {
		// No longer needed - data is loaded from SQLite on demand
	}

	/**
	 * Get a journal entry by ID
	 */
	async getJournalById(journalId: string): Promise<JournalEntry | null> {
		return getJournalByIdFromRepo(journalId);
	}

	/**
	 * Get a specific page by its ID
	 */
	async getPageById(pageId: string): Promise<JournalPage | null> {
		return getPageByIdFromRepo(pageId);
	}

	/**
	 * Get a page and its parent journal by page ID
	 */
	async getPageWithJournal(
		pageId: string
	): Promise<{ journal: JournalEntry; page: JournalPage } | null> {
		return getPageWithJournalFromRepo(pageId);
	}

	/**
	 * Get a page from a specific journal by page name
	 */
	async getPageByName(journalId: string, pageName: string): Promise<JournalPage | null> {
		return getPageByNameFromRepo(journalId, pageName);
	}

	/**
	 * Search for pages by name across all journals
	 */
	async searchPages(query: string): Promise<JournalPage[]> {
		return searchPagesFromRepo(query);
	}
}

// Export singleton instance
export const journalLoader = new JournalLoader();
