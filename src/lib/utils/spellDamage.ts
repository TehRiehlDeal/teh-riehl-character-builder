/**
 * Spell Damage Utility
 *
 * Handles calculation and formatting of spell damage based on heightened levels.
 */

import type { Spell } from '$lib/data/types/app';

export interface DamageEntry {
	formula: string;
	type: string;
	category?: string;
}

export interface CalculatedDamage {
	formula: string;
	type: string;
	category?: string;
	displayText: string;
}

/**
 * Calculate the heightened level for a cantrip based on character level
 * Cantrips heighten to half your level rounded up (PF2e Core Rulebook)
 */
export function getCantripHeightenLevel(characterLevel: number): number {
	// Cantrips are automatically heightened to half your level rounded up
	// Level 1-2: Rank 1
	// Level 3-4: Rank 2
	// Level 5-6: Rank 3
	// Level 7-8: Rank 4
	// Level 9-10: Rank 5
	// etc.
	return Math.ceil(characterLevel / 2);
}

/**
 * Evaluate a damage formula with context (spell level, actor level, etc.)
 */
export function evaluateFormula(formula: string, context: {
	spellLevel: number;
	characterLevel?: number;
}): string {
	let evaluated = formula;

	// Replace @item.level and @item.rank with spell level
	evaluated = evaluated.replace(/@item\.level/g, String(context.spellLevel));
	evaluated = evaluated.replace(/@item\.rank/g, String(context.spellLevel));

	// Replace @actor.level with character level if provided
	if (context.characterLevel !== undefined) {
		evaluated = evaluated.replace(/@actor\.level/g, String(context.characterLevel));
	}

	// Evaluate mathematical expressions
	try {
		// Handle ceil() function
		evaluated = evaluated.replace(/ceil\(([^)]+)\)/g, (_, expr) => {
			const value = evaluateSimpleExpression(expr);
			return String(Math.ceil(value));
		});

		// Handle floor() function
		evaluated = evaluated.replace(/floor\(([^)]+)\)/g, (_, expr) => {
			const value = evaluateSimpleExpression(expr);
			return String(Math.floor(value));
		});

		// Evaluate simple arithmetic if no dice notation
		if (!/\d+d\d+/.test(evaluated)) {
			const value = evaluateSimpleExpression(evaluated);
			if (!isNaN(value)) {
				evaluated = String(value);
			}
		}
	} catch (e) {
		// If evaluation fails, return original formula
		console.warn('Failed to evaluate formula:', formula, e);
	}

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
 * Add damage formula increments (for interval heightening)
 * @param baseFormula - Base damage formula (e.g., "2d6" or "2")
 * @param increment - Increment per level (e.g., "1d6" or "1")
 * @param times - Number of increments to add
 * @returns Combined formula
 */
function addDamageFormula(baseFormula: string, increment: string, times: number): string {
	// Handle dice notation (e.g., "2d6")
	const diceMatch = baseFormula.match(/^(\d+)d(\d+)$/);
	const incrementDiceMatch = increment.match(/^(\d+)d(\d+)$/);

	if (diceMatch && incrementDiceMatch) {
		// Both are dice formulas
		const [, baseDice, baseDie] = diceMatch;
		const [, incDice, incDie] = incrementDiceMatch;

		// Only add if same die size
		if (baseDie === incDie) {
			const totalDice = parseInt(baseDice) + parseInt(incDice) * times;
			return `${totalDice}d${baseDie}`;
		}
	}

	// Handle simple numbers
	const baseNum = parseInt(baseFormula);
	const incNum = parseInt(increment);

	if (!isNaN(baseNum) && !isNaN(incNum)) {
		return String(baseNum + incNum * times);
	}

	// Fallback: return base formula unchanged
	return baseFormula;
}

/**
 * Extract damage from spell data at a specific heightened level
 */
export function extractSpellDamage(
	spell: Spell,
	heightenedLevel: number
): DamageEntry[] {
	const damages: DamageEntry[] = [];

	// Start with base damage
	let damageSource = spell.damage;

	// Check if spell has heightening and if we need heightened damage
	if (spell.heightening && heightenedLevel > spell.level) {
		const { type, levels } = spell.heightening;

		if (type === 'fixed' && levels) {
			// Fixed heightening - find the highest available level <= heightenedLevel
			const availableLevels = Object.keys(levels)
				.map(Number)
				.filter(level => level <= heightenedLevel)
				.sort((a, b) => b - a); // Sort descending

			if (availableLevels.length > 0) {
				const bestLevel = availableLevels[0];
				const heightenedData = levels[bestLevel];
				if (heightenedData && (heightenedData as any).damage) {
					damageSource = (heightenedData as any).damage;
				}
			}
		} else if (type === 'interval') {
			// Interval heightening - calculate increased damage
			const heighteningData = spell.heightening as any;
			const interval = heighteningData.interval || 1;

			// For cantrips (level 0), the base rank is 1, not 0
			// So we calculate from rank 1 as the baseline
			const effectiveBaseLevel = spell.level === 0 ? 1 : spell.level;
			const levelsAboveBase = heightenedLevel - effectiveBaseLevel;
			const increments = Math.floor(levelsAboveBase / interval);

			// Clone base damage
			const heightenedDamage: Record<string, any> = {};
			if (damageSource) {
				for (const [key, value] of Object.entries(damageSource)) {
					heightenedDamage[key] = { ...(value as any) };
				}
			}

			// Apply interval damage increases
			if (heighteningData.damage && increments > 0) {
				for (const [key, increment] of Object.entries(heighteningData.damage)) {
					if (heightenedDamage[key]) {
						const incrementValue = increment as string;
						// Parse the increment (e.g., "1d6" or "1")
						const currentFormula = heightenedDamage[key].formula;
						heightenedDamage[key].formula = addDamageFormula(
							currentFormula,
							incrementValue,
							increments
						);
					}
				}
			}

			damageSource = heightenedDamage;
		}
	}

	// Extract damage entries
	if (damageSource && typeof damageSource === 'object') {
		for (const [, value] of Object.entries(damageSource)) {
			if (value && typeof value === 'object') {
				const damageEntry = value as any;
				if (damageEntry.formula && damageEntry.type) {
					damages.push({
						formula: damageEntry.formula,
						type: damageEntry.type,
						category: damageEntry.category
					});
				}
			}
		}
	}

	return damages;
}

/**
 * Calculate and format spell damage for display
 */
export function calculateSpellDamage(
	spell: Spell,
	heightenedLevel: number,
	characterLevel?: number
): CalculatedDamage[] {
	const damages = extractSpellDamage(spell, heightenedLevel);
	const calculated: CalculatedDamage[] = [];

	for (const damage of damages) {
		const evaluatedFormula = evaluateFormula(damage.formula, {
			spellLevel: heightenedLevel,
			characterLevel
		});

		// Format display text
		let displayText = evaluatedFormula;
		if (damage.type) {
			displayText += ` ${damage.type}`;
		}
		if (damage.category) {
			displayText += ` (${damage.category})`;
		}

		calculated.push({
			...damage,
			formula: evaluatedFormula,
			displayText
		});
	}

	return calculated;
}

/**
 * Parse damage formulas from description text and evaluate them
 */
export function evaluateDamageInDescription(
	description: string,
	spellLevel: number,
	characterLevel?: number
): string {
	// Match @Damage[...] patterns
	const damagePattern = /@Damage\[([^\]]+(?:\[[^\]]*\])?)\]/g;

	return description.replace(damagePattern, (match, content) => {
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

		// Evaluate the formula
		const evaluated = evaluateFormula(formula, {
			spellLevel,
			characterLevel
		});

		// Format the damage types
		const typeStr = types.length > 0 ? ` ${types.join(' ')}` : '';

		// Determine if this is healing or damage
		const isHealing = types.includes('healing');
		const className = isHealing ? 'inline-healing' : 'inline-damage';
		const suffix = isHealing ? '' : ' damage';

		return `<span class="${className}" data-formula="${formula}" data-evaluated="${evaluated}" data-types="${types.join(',')}">${evaluated}${typeStr}${suffix}</span>`;
	});
}

/**
 * Format damage for compact display (e.g., "3d6 fire + 2 splash acid")
 */
export function formatDamageCompact(damages: CalculatedDamage[]): string {
	if (damages.length === 0) {
		return '';
	}

	return damages
		.map(d => d.displayText)
		.join(' + ');
}
