/**
 * Spell Adapter
 *
 * Transforms Foundry VTT PF2e spell data into our application schema.
 *
 * Transformation Notes (Apache 2.0 requirement):
 * - Foundry's `_id` is mapped to our `id`
 * - `system.description.value` is mapped to `description`
 * - `system.level.value` determines spell level (0 for cantrips)
 * - Spell type is determined by file location (standard/focus/ritual)
 * - `system.traits.traditions[]` is mapped to `traditions`
 * - `system.time.value` is mapped to `castingTime`
 * - `system.rules[]` is passed through as-is (already matches our RuleElement types)
 * - Foundry-specific fields like `folder`, `img` are excluded
 */

import type { FoundrySpell } from '../types/foundry';
import type { Spell } from '../types/app';

/**
 * Transform a Foundry spell into our app schema
 */
export function adaptSpell(
	foundrySpell: FoundrySpell,
	spellType: 'standard' | 'focus' | 'ritual' = 'standard'
): Spell {
	return {
		type: 'spell',
		id: foundrySpell._id,
		name: foundrySpell.name,
		description: foundrySpell.system.description.value,
		level: foundrySpell.system.level.value,
		spellType,
		traditions: extractTraditions(foundrySpell),
		castingTime: foundrySpell.system.time.value,
		range: foundrySpell.system.range.value,
		target: foundrySpell.system.target?.value,
		area: extractArea(foundrySpell),
		duration: foundrySpell.system.duration.value,
		sustained: foundrySpell.system.duration.sustained,
		defense: extractDefense(foundrySpell),
		traits: foundrySpell.system.traits.value,
		rarity: foundrySpell.system.traits.rarity,
		source: {
			title: foundrySpell.system.publication.title,
			license: foundrySpell.system.publication.license,
			remaster: foundrySpell.system.publication.remaster
		},
		heightening: foundrySpell.system.heightening,
		rules: foundrySpell.system.rules
	};
}

/**
 * Extract spell traditions from traits
 *
 * Traditions are stored in the traits.traditions array in Foundry data
 */
function extractTraditions(foundrySpell: FoundrySpell): string[] {
	// Traditions are stored in system.traits.traditions in spell data
	const traditions = (foundrySpell.system.traits as any).traditions;
	if (Array.isArray(traditions)) {
		return traditions;
	}
	return [];
}

/**
 * Extract area information
 *
 * Returns a formatted string like "20-foot burst" or undefined if no area
 */
function extractArea(foundrySpell: FoundrySpell): string | undefined {
	const area = foundrySpell.system.area;
	if (!area || !area.type) {
		return undefined;
	}

	if (area.value) {
		return `${area.value}-foot ${area.type}`;
	}

	return area.type;
}

/**
 * Extract defense information (save type)
 *
 * Returns a formatted string like "basic Reflex" or undefined
 */
function extractDefense(foundrySpell: FoundrySpell): string | undefined {
	const defense = foundrySpell.system.defense;
	if (!defense?.save) {
		return undefined;
	}

	const save = defense.save;
	const prefix = save.basic ? 'basic ' : '';
	return `${prefix}${save.statistic}`;
}

/**
 * Adapt multiple spells at once
 */
export function adaptSpells(
	foundrySpells: FoundrySpell[],
	spellType: 'standard' | 'focus' | 'ritual' = 'standard'
): Spell[] {
	return foundrySpells.map((spell) => adaptSpell(spell, spellType));
}
