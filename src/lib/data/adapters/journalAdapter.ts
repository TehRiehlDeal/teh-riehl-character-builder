/**
 * Journal Adapter
 *
 * Transforms Foundry VTT PF2e journal entry data into our application schema.
 *
 * Transformation Notes (Apache 2.0 requirement):
 * - Foundry's `_id` is mapped to our `id`
 * - Journal pages array is transformed to extract only necessary fields
 * - Text content is preserved as HTML for rich rendering
 * - Sort order is preserved for correct page ordering
 */

import type { FoundryJournalEntry, FoundryJournalPage } from '../types/foundry-journal';
import type { JournalEntry, JournalPage } from '../types/app';

/**
 * Transform a Foundry journal page into our app schema
 */
export function adaptJournalPage(foundryPage: FoundryJournalPage): JournalPage {
	return {
		id: foundryPage._id,
		name: foundryPage.name,
		type: foundryPage.type,
		content: foundryPage.text?.content || '',
		sortOrder: foundryPage.sort
	};
}

/**
 * Transform a Foundry journal entry into our app schema
 */
export function adaptJournalEntry(foundryEntry: FoundryJournalEntry): JournalEntry {
	return {
		id: foundryEntry._id,
		name: foundryEntry.name,
		pages: foundryEntry.pages
			.map(adaptJournalPage)
			.sort((a, b) => a.sortOrder - b.sortOrder) // Ensure pages are in correct order
	};
}

/**
 * Get a specific page from a journal entry by page ID
 */
export function getPageById(journal: JournalEntry, pageId: string): JournalPage | null {
	return journal.pages.find(page => page.id === pageId) || null;
}

/**
 * Get a specific page from a journal entry by page name
 */
export function getPageByName(journal: JournalEntry, pageName: string): JournalPage | null {
	return journal.pages.find(page =>
		page.name.toLowerCase() === pageName.toLowerCase()
	) || null;
}
