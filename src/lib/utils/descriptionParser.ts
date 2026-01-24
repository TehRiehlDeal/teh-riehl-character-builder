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
 *
 * @param html - HTML content to parse
 * @param context - Optional context for evaluating formulas
 */
export function parseFoundryDamage(
	html: string,
	context?: { spellLevel?: number; characterLevel?: number }
): string {
	if (!html) return '';

	console.log('[parseFoundryDamage] Context:', context);

	// Match @Damage[...] patterns with proper bracket counting
	// This handles nested brackets like @Damage[(ceil(@item.level/2))[persistent,acid]]
	const matches: Array<{ fullMatch: string; content: string; start: number }> = [];
	let i = 0;

	while (i < html.length) {
		// Look for @Damage[
		const damageStart = html.indexOf('@Damage[', i);
		if (damageStart === -1) break;

		// Count brackets to find the closing ]
		let bracketCount = 0;
		let contentStart = damageStart + 8; // Length of '@Damage['
		let j = contentStart;

		while (j < html.length) {
			if (html[j] === '[') {
				bracketCount++;
			} else if (html[j] === ']') {
				if (bracketCount === 0) {
					// Found the closing bracket
					const content = html.substring(contentStart, j);
					matches.push({
						fullMatch: html.substring(damageStart, j + 1),
						content,
						start: damageStart
					});
					break;
				}
				bracketCount--;
			}
			j++;
		}

		i = j + 1;
	}

	// Replace matches in reverse order to maintain correct positions
	let result = html;
	for (let i = matches.length - 1; i >= 0; i--) {
		const { fullMatch, content, start } = matches[i];

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

		// Calculate formula if context provided, otherwise simplify for display
		let displayFormula: string;
		if (context?.spellLevel !== undefined) {
			displayFormula = evaluateFormulaForDisplay(formula, {
				spellLevel: context.spellLevel,
				characterLevel: context.characterLevel
			});
		} else {
			displayFormula = simplifyFormula(formula);
		}

		// Format the damage types
		const typeStr = types.length > 0 ? ` ${types.join(' ')}` : '';

		// Determine if this is healing or damage
		const isHealing = types.includes('healing');
		const className = isHealing ? 'inline-healing' : 'inline-damage';
		const suffix = isHealing ? '' : ' damage';

		const replacement = `<span class="${className}" data-formula="${formula}" data-types="${types.join(',')}">${displayFormula}${typeStr}${suffix}</span>`;

		result = result.substring(0, start) + replacement + result.substring(start + fullMatch.length);
	}

	return result;
}

/**
 * Helper function to find matching closing parenthesis
 */
function findMatchingParen(str: string, startPos: number): number {
	let depth = 1;
	for (let i = startPos + 1; i < str.length; i++) {
		if (str[i] === '(') depth++;
		if (str[i] === ')') depth--;
		if (depth === 0) return i;
	}
	return -1;
}

/**
 * Evaluate formula for display (with actual calculated values)
 */
function evaluateFormulaForDisplay(
	formula: string,
	context: { spellLevel: number; characterLevel?: number }
): string {
	console.log('[evaluateFormulaForDisplay] Input:', formula, 'spellLevel:', context.spellLevel);
	let evaluated = formula;

	// Remove outer parentheses if they wrap the entire expression
	if (evaluated.startsWith('(') && evaluated.endsWith(')')) {
		let depth = 0;
		let isOuter = true;
		for (let i = 0; i < evaluated.length; i++) {
			if (evaluated[i] === '(') depth++;
			if (evaluated[i] === ')') depth--;
			// If depth hits 0 before the end, these aren't outer parens
			if (depth === 0 && i < evaluated.length - 1) {
				isOuter = false;
				break;
			}
		}
		if (isOuter) {
			evaluated = evaluated.slice(1, -1);
		}
	}

	// Replace @item.level and @item.rank with spell level
	evaluated = evaluated.replace(/@item\.level/g, String(context.spellLevel));
	evaluated = evaluated.replace(/@item\.rank/g, String(context.spellLevel));

	// Replace @actor.level with character level if provided
	if (context.characterLevel !== undefined) {
		evaluated = evaluated.replace(/@actor\.level/g, String(context.characterLevel));
	}

	// Evaluate mathematical expressions
	try {
		// Handle ceil() and floor() functions with proper parenthesis matching
		let hasFunction = true;
		while (hasFunction) {
			hasFunction = false;

			// Process ceil() functions
			let ceilPos = evaluated.indexOf('ceil(');
			while (ceilPos !== -1) {
				hasFunction = true;
				const closingPos = findMatchingParen(evaluated, ceilPos + 4);
				if (closingPos === -1) break;

				const innerExpr = evaluated.substring(ceilPos + 5, closingPos);
				const value = evaluateSimpleExpression(innerExpr);
				const result = String(Math.ceil(value));

				evaluated = evaluated.substring(0, ceilPos) + result + evaluated.substring(closingPos + 1);
				ceilPos = evaluated.indexOf('ceil(');
			}

			// Process floor() functions
			let floorPos = evaluated.indexOf('floor(');
			while (floorPos !== -1) {
				hasFunction = true;
				const closingPos = findMatchingParen(evaluated, floorPos + 5);
				if (closingPos === -1) break;

				const innerExpr = evaluated.substring(floorPos + 6, closingPos);
				const value = evaluateSimpleExpression(innerExpr);
				const result = String(Math.floor(value));

				evaluated = evaluated.substring(0, floorPos) + result + evaluated.substring(closingPos + 1);
				floorPos = evaluated.indexOf('floor(');
			}
		}

		// Check if we have dice notation with a calculable prefix
		// Patterns like: "3d6", "floor(...)/2d6", "1+2d6"
		const dicePattern = /^(.+?)d(\d+)$/;
		const diceMatch = evaluated.match(dicePattern);

		if (diceMatch) {
			const [, diceCount, dieSize] = diceMatch;
			// Try to evaluate the dice count expression
			try {
				const count = evaluateSimpleExpression(diceCount);
				if (!isNaN(count) && count > 0) {
					evaluated = `${count}d${dieSize}`;
				}
			} catch {
				// Leave as-is if can't evaluate
			}
		} else if (!/d\d+/.test(evaluated)) {
			// No dice notation at all, try to evaluate as pure arithmetic
			const value = evaluateSimpleExpression(evaluated);
			if (!isNaN(value)) {
				evaluated = String(value);
			}
		}
	} catch (e) {
		// If evaluation fails, use simplified formula
		console.warn('[evaluateFormulaForDisplay] Error evaluating:', e);
		evaluated = simplifyFormula(formula);
	}

	console.log('[evaluateFormulaForDisplay] Output:', evaluated);
	return evaluated;
}

/**
 * Evaluate simple arithmetic expressions (no dice notation)
 */
function evaluateSimpleExpression(expr: string): number {
	// Replace division and multiplication symbols
	const normalized = expr.replace(/÷/g, '/').replace(/×/g, '*');

	// Basic safety check - only allow numbers and basic operators
	if (!/^[\d\s+\-*/.()]+$/.test(normalized)) {
		throw new Error('Invalid expression');
	}

	// Use Function constructor for safe evaluation (no access to scope)
	// eslint-disable-next-line no-new-func
	return new Function(`return ${normalized}`)() as number;
}

/**
 * Comprehensive description processor
 * Applies all parsing rules in the correct order
 *
 * @param html - HTML content to process
 * @param context - Optional context for evaluating formulas (spell level, character level)
 */
export function processDescription(
	html: string,
	context?: { spellLevel?: number; characterLevel?: number }
): string {
	if (!html) return '';

	let processed = html;

	// Apply transformations in order
	processed = parseUUIDReferences(processed);
	processed = parseFoundryDamage(processed, context); // Parse @Damage[...] syntax first
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
