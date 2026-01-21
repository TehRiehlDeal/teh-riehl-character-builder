/**
 * Foundry VTT Journal Entry Types
 *
 * Represents the raw structure of journal entries from Foundry VTT PF2e system.
 */

/**
 * A single page within a journal entry
 */
export interface FoundryJournalPage {
	_id: string;
	name: string;
	type: 'text' | 'image' | 'pdf' | 'video';
	title: {
		level: number;
		show: boolean;
	};
	image: Record<string, unknown>;
	text: {
		content: string; // HTML content
		format: number;
	};
	video: {
		controls: boolean;
		volume: number;
	};
	src: string | null;
	system: Record<string, unknown>;
	sort: number;
}

/**
 * A journal entry containing multiple pages
 */
export interface FoundryJournalEntry {
	_id: string;
	name: string;
	ownership: {
		default: number;
		[key: string]: number;
	};
	pages: FoundryJournalPage[];
}
