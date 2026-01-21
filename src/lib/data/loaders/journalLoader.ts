/**
 * Journal Loader
 *
 * Loads journal entry data from static directory using fetch.
 */

import type { FoundryJournalEntry } from '../types/foundry-journal';
import type { JournalEntry, JournalPage } from '../types/app';
import { adaptJournalEntry, getPageByName } from '../adapters/journalAdapter';
import { loadAllData } from '../dataLoader';

/**
 * Journal loader class
 */
export class JournalLoader {
	private journals: Map<string, JournalEntry> = new Map();
	private pages: Map<string, { journal: JournalEntry; page: JournalPage }> = new Map();
	private loaded = false;

	/**
	 * Load and index all journal entries
	 */
	async loadAll(): Promise<void> {
		if (this.loaded) return;

		try {
			// Load all journal entries from static directory
			const foundryJournals = await loadAllData<FoundryJournalEntry>('journals');

			// Adapt and index each journal entry
			for (const foundryJournal of foundryJournals) {
				const journal = adaptJournalEntry(foundryJournal);
				this.journals.set(journal.id, journal);

				// Index all pages for quick lookup
				for (const page of journal.pages) {
					this.pages.set(page.id, { journal, page });
				}
			}

			this.loaded = true;
		} catch (error) {
			console.error('Failed to load journal data:', error);
			throw error;
		}
	}

	/**
	 * Get a journal entry by ID
	 */
	async getJournalById(journalId: string): Promise<JournalEntry | null> {
		await this.loadAll();
		return this.journals.get(journalId) || null;
	}

	/**
	 * Get a specific page by its ID
	 */
	async getPageById(pageId: string): Promise<JournalPage | null> {
		await this.loadAll();
		const result = this.pages.get(pageId);
		return result?.page || null;
	}

	/**
	 * Get a page and its parent journal by page ID
	 */
	async getPageWithJournal(pageId: string): Promise<{ journal: JournalEntry; page: JournalPage } | null> {
		await this.loadAll();
		return this.pages.get(pageId) || null;
	}

	/**
	 * Get a page from a specific journal by page name
	 */
	async getPageByName(journalId: string, pageName: string): Promise<JournalPage | null> {
		const journal = await this.getJournalById(journalId);
		if (!journal) return null;
		return getPageByName(journal, pageName);
	}

	/**
	 * Search for pages by name across all journals
	 */
	async searchPages(query: string): Promise<JournalPage[]> {
		await this.loadAll();
		const results: JournalPage[] = [];
		const lowerQuery = query.toLowerCase();

		for (const { page } of this.pages.values()) {
			if (page.name.toLowerCase().includes(lowerQuery)) {
				results.push(page);
			}
		}

		return results;
	}
}

// Export singleton instance
export const journalLoader = new JournalLoader();
