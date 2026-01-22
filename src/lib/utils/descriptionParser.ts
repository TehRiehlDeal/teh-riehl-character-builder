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
 * Simplify Foundry formula references for display
 * Converts @actor.level, @item.level, etc. to readable text
 */
function simplifyFormula(formula: string): string {
	let simplified = formula;

	// Remove outer parentheses if present
	if (simplified.startsWith('(') && simplified.endsWith(')')) {
		simplified = simplified.slice(1, -1);
	}

	// Replace common Foundry references with readable text
	simplified = simplified
		// Item/spell level references
		.replace(/@item\.level/g, 'spell rank')
		.replace(/@item\.rank/g, 'spell rank')
		// Actor level references
		.replace(/@actor\.level/g, 'level')
		// Ability modifiers
		.replace(/@actor\.system\.abilities\.(\w+)\.mod/g, (_, ability) => `${ability.toUpperCase()} modifier`)
		.replace(/@actor\.abilities\.(\w+)\.mod/g, (_, ability) => `${ability.toUpperCase()} modifier`)
		// Math functions - make more readable
		.replace(/ceil\(([^)]+)\)/g, (_, inner) => `${simplifyFormula(inner)} (rounded up)`)
		.replace(/floor\(([^)]+)\)/g, (_, inner) => `${simplifyFormula(inner)} (rounded down)`)
		// Clean up math operators
		.replace(/\*2/g, '×2')
		.replace(/2\*/g, '2×')
		.replace(/\//g, '÷');

	return simplified;
}

/**
 * Parse Foundry VTT @Damage syntax
 * Formats:
 * - @Damage[formula] - just a formula
 * - @Damage[formula[type]] - formula with damage type
 * - @Damage[formula[type1,type2]] - formula with multiple types
 */
export function parseFoundryDamage(html: string): string {
	if (!html) return '';

	// Match @Damage[...] patterns
	// The content can have nested brackets for damage types
	const damagePattern = /@Damage\[([^\]]+(?:\[[^\]]*\])?)\]/g;

	return html.replace(damagePattern, (match, content) => {
		// Check if there's a nested bracket for damage types
		const nestedMatch = content.match(/^(.+?)\[([^\]]*)\]$/);

		let formula: string;
		let types: string[] = [];

		if (nestedMatch) {
			formula = nestedMatch[1];
			types = nestedMatch[2].split(',').map((t: string) => t.trim()).filter(Boolean);
		} else {
			formula = content;
		}

		// Simplify the formula for display
		const displayFormula = simplifyFormula(formula);

		// Format the damage types
		const typeStr = types.length > 0 ? ` ${types.join(' ')}` : '';

		// Determine if this is healing or damage
		const isHealing = types.includes('healing');
		const className = isHealing ? 'inline-healing' : 'inline-damage';
		const suffix = isHealing ? '' : ' damage';

		return `<span class="${className}" data-formula="${formula}" data-types="${types.join(',')}">${displayFormula}${typeStr}${suffix}</span>`;
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
	processed = parseFoundryDamage(processed); // Parse @Damage[...] syntax first
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
