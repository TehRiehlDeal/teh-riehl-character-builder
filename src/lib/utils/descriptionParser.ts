/**
 * Description Parser Utility
 *
 * Handles parsing and processing of Foundry VTT description content:
 * - Converts @UUID[...] references to clickable links
 * - Sanitizes HTML for safe rendering
 */

/**
 * Parse UUID references in Foundry content and convert to HTML links
 *
 * Handles two formats:
 * 1. @UUID[Compendium.pf2e.feats-srd.Item.Diehard]
 * 2. @UUID[Compendium.pf2e.journals.JournalEntry.xyz.JournalEntryPage.abc]{Display Text}
 */
export function parseUUIDReferences(html: string): string {
	if (!html) return '';

	// Pattern 1: Journal entries with display text
	// @UUID[Compendium.pf2e.journals.JournalEntry.{EntryID}.JournalEntryPage.{PageID}]{Display Text}
	const journalPattern = /@UUID\[Compendium\.pf2e\.journals\.JournalEntry\.([^.]+)\.JournalEntryPage\.([^\]]+)\]\{([^}]+)\}/g;
	html = html.replace(journalPattern, (match, journalId, pageId, displayText) => {
		// Create a clickable link to the journal page
		const cleanUuid = `@UUID[Compendium.pf2e.journals.JournalEntry.${journalId}.JournalEntryPage.${pageId}]`;
		return `<a href="#" class="journal-link" data-uuid="${cleanUuid}" data-journal-id="${journalId}" data-page-id="${pageId}">${displayText}</a>`;
	});

	// Pattern 2: Item references (feats, spells, equipment, etc.)
	// @UUID[Compendium.pf2e.{compendium}.Item.{ItemName}]{Optional Display Text}
	const itemPattern = /@UUID\[Compendium\.pf2e\.([^.]+)\.Item\.([^\]]+)\](?:\{([^}]+)\})?/g;
	html = html.replace(itemPattern, (match, compendium, itemName, displayText) => {
		// Use provided display text or generate from item name
		let readableName = displayText;
		if (!readableName) {
			const itemDisplayName = itemName.split('.').pop() || itemName;
			readableName = itemDisplayName
				.split(/[-_]/)
				.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ');
		}

		// Map compendium types to routes
		const compendiumRoutes: Record<string, string> = {
			'feats-srd': 'feats',
			'spells-srd': 'spells',
			'ancestries': 'ancestries',
			'classes': 'classes',
			'heritages': 'heritages',
			'backgrounds': 'backgrounds',
			'equipment': 'equipment',
			'equipment-srd': 'equipment',
			'actions': 'actions',
			'actionspf2e': 'actions',
			'conditionitems': 'conditions',
			'feat-effects': 'effects'
		};

		const route = compendiumRoutes[compendium] || compendium;
		const slug = itemName.toLowerCase().replace(/\s+/g, '-');

		// Construct clean UUID for data attribute (without display text to avoid escaping issues)
		const cleanUuid = `@UUID[Compendium.pf2e.${compendium}.Item.${itemName}]`;

		// Return an anchor tag with appropriate styling class
		return `<a href="/${route}/${slug}" class="uuid-link" data-uuid="${cleanUuid}" data-compendium="${compendium}" data-item="${itemName}">${readableName}</a>`;
	});

	return html;
}

/**
 * Parse Pathfinder 2e inline rolls and checks
 * Format: [[/r 1d20+5]] or @Check[type:dc:traits]
 */
export function parseInlineRolls(html: string): string {
	if (!html) return '';

	// Parse inline roll syntax [[/r ...]]
	const rollPattern = /\[\[\/r ([^\]]+)\]\]/g;
	html = html.replace(rollPattern, (match, roll) => {
		return `<span class="inline-roll" data-roll="${roll}">${roll}</span>`;
	});

	// Parse @Check syntax
	const checkPattern = /@Check\[([^\]]+)\]/g;
	html = html.replace(checkPattern, (match, checkData) => {
		const [type, dc, ...traits] = checkData.split(':');
		return `<span class="inline-check" data-check="${checkData}">${type.toUpperCase()} DC ${dc}</span>`;
	});

	return html;
}

/**
 * Parse Foundry template syntax @Template[...]
 */
export function parseTemplates(html: string): string {
	if (!html) return '';

	const templatePattern = /@Template\[([^\]]+)\]/g;
	return html.replace(templatePattern, (match, templateData) => {
		const [type, distance] = templateData.split(':');
		return `<span class="template-ref">${distance}-foot ${type}</span>`;
	});
}

/**
 * Parse damage types and format them
 * Format: {1d6} or {2d8 fire}
 */
export function parseDamage(html: string): string {
	if (!html) return '';

	const damagePattern = /\{([^}]+)\}/g;
	return html.replace(damagePattern, (match, damage) => {
		return `<span class="damage">${damage}</span>`;
	});
}

/**
 * Comprehensive description processor
 * Applies all parsing rules in the correct order
 */
export function processDescription(html: string): string {
	if (!html) return '';

	let processed = html;

	// Apply transformations in order
	processed = parseUUIDReferences(processed);
	processed = parseInlineRolls(processed);
	processed = parseTemplates(processed);
	processed = parseDamage(processed);

	return processed;
}

/**
 * Strip all HTML tags from content (for plain text display)
 */
export function stripHTML(html: string): string {
	if (!html) return '';

	// Remove HTML tags
	const withoutTags = html.replace(/<[^>]*>/g, '');

	// Decode HTML entities
	const textarea = document.createElement('textarea');
	textarea.innerHTML = withoutTags;
	return textarea.value;
}

/**
 * Get plain text excerpt from HTML (for previews)
 */
export function getExcerpt(html: string, maxLength: number = 120): string {
	const plainText = stripHTML(html);

	if (plainText.length <= maxLength) {
		return plainText;
	}

	return plainText.substring(0, maxLength).trim() + '...';
}
