/**
 * Modifier Extraction Service
 *
 * Extracts modifiers from character feats, equipment, and other sources
 * by processing their rule elements.
 */

import type { Modifier } from '../models/Modifier';
import type { RuleElement } from '../ruleElements/registry';
import { processFlatModifier, type RuleElementContext } from '../ruleElements/flatModifier';
import type { Character } from '$lib/stores/character';
import type { Feat } from '$lib/data/types/app';

/**
 * Extract all modifiers from a character's feats
 */
export async function extractModifiersFromFeats(
	character: Character,
	feats: Feat[]
): Promise<Modifier[]> {
	const modifiers: Modifier[] = [];

	// Create rule element context from character
	const context: RuleElementContext = {
		source: '', // Will be set per feat
		level: character.level,
		actor: {
			level: character.level,
			abilities: character.abilities
		}
	};

	// Collect all feat IDs from the character
	const featIds = new Set<string>();
	for (const category of Object.values(character.feats)) {
		for (const featEntry of category) {
			featIds.add(featEntry.featId);
		}
	}

	// Process each feat the character has
	for (const feat of feats) {
		if (!featIds.has(feat.id)) {
			continue; // Character doesn't have this feat
		}

		// Set the source for this feat's modifiers
		context.source = feat.name;

		// Process each rule element in the feat
		for (const ruleElement of feat.rules) {
			const modifier = processRuleElement(ruleElement, context, character);
			if (modifier) {
				modifiers.push(modifier);
			}
		}
	}

	return modifiers;
}

/**
 * Process a single rule element into a modifier
 */
function processRuleElement(
	ruleElement: RuleElement,
	context: RuleElementContext,
	character: Character
): Modifier | null {
	// Type guard to check if this is a FlatModifier
	if ('key' in ruleElement && ruleElement.key === 'FlatModifier') {
		const modifier = processFlatModifier(ruleElement as any, context);

		if (modifier) {
			// Check if this modifier is toggleable (has a predicate that looks like a toggle)
			if (modifier.predicate) {
				// Check if any predicate requires a toggleable effect
				const hasToggleable = modifier.predicate.some(pred =>
					pred.startsWith('self:') || pred.startsWith('feature:')
				);

				if (hasToggleable) {
					// Check if the effect is enabled in character's toggleableEffects
					const effectId = `${context.source}:${modifier.selector}`;
					modifier.enabled = character.toggleableEffects[effectId] ?? false;
				}
			}
		}

		return modifier;
	}

	// Add handlers for other rule element types here as they're implemented
	// - AdjustModifier
	// - DamageDice
	// - BaseSpeed
	// etc.

	return null;
}

/**
 * Extract modifiers from equipment (weapons, armor, shields)
 */
export async function extractModifiersFromEquipment(
	character: Character
): Promise<Modifier[]> {
	const modifiers: Modifier[] = [];

	// Import equipment loader
	const { getEquipmentById } = await import('$lib/data/repositories/equipmentRepository');

	// 1. Extract armor modifiers
	if (character.equipment.armor) {
		try {
			const equipment = await getEquipmentById(character.equipment.armor.itemId);
			if (equipment && equipment.equipmentType === 'armor') {
				// Type narrow to Armor
				const armor = equipment as import('$lib/data/types/app').Armor;

				// AC Bonus
				if (armor.acBonus > 0) {
					modifiers.push({
						label: `${armor.name} AC`,
						source: armor.name,
						value: armor.acBonus,
						type: 'item',
						selector: 'ac',
						alwaysActive: true,
						enabled: true
					});
				}

				// Add potency rune bonus (if present in future)
				const potency = (armor as any).runes?.potency || 0;
				if (potency > 0) {
					modifiers.push({
						label: `${armor.name} Potency`,
						source: armor.name,
						value: potency,
						type: 'item',
						selector: 'ac',
						alwaysActive: true,
						enabled: true
					});
				}

				// Check Penalty
				if (armor.checkPenalty < 0) {
					modifiers.push({
						label: `${armor.name} Check Penalty`,
						source: armor.name,
						value: armor.checkPenalty,
						type: 'item',
						selector: 'skill-check',
						alwaysActive: true,
						enabled: true
					});
				}

				// Speed Penalty (with Strength requirement check)
				const baseSpeedPenalty = armor.speedPenalty;
				const strengthRequirement = armor.strength || 0;
				const strengthAbilityScore = character.abilities.strength;
				const strengthModifier = Math.floor((strengthAbilityScore - 10) / 2);

				// If character's Strength modifier meets or exceeds requirement, reduce penalty by 5
				let finalSpeedPenalty = baseSpeedPenalty;
				let description: string | undefined;

				if (baseSpeedPenalty < 0) {
					if (strengthRequirement > 0 && strengthModifier >= strengthRequirement) {
						finalSpeedPenalty = Math.min(0, baseSpeedPenalty + 5);
						description = `Base penalty ${baseSpeedPenalty} ft, reduced by 5 ft for meeting Str +${strengthRequirement} requirement`;
					}

					// Always show the speed penalty modifier, even if reduced to 0
					modifiers.push({
						label: `${armor.name} Speed Penalty`,
						source: armor.name,
						value: finalSpeedPenalty,
						type: 'untyped',
						selector: 'land-speed',
						alwaysActive: true,
						enabled: true,
						description
					});
				}
			}
		} catch (error) {
			console.warn('Failed to load armor:', character.equipment.armor.itemId, error);
		}
	}

	// 2. Extract shield modifiers
	if (character.equipment.shield) {
		try {
			const shield = await getEquipmentById(character.equipment.shield.itemId);
			if (shield && shield.equipmentType === 'shield') {
				// Shield AC bonus (only when raised)
				const acBonus = (shield as any).acBonus || 0;
				if (acBonus > 0) {
					modifiers.push({
						label: `${shield.name} (Raised)`,
						source: shield.name,
						value: acBonus,
						type: 'circumstance',
						selector: 'ac',
						predicate: ['shield-raised'],
						enabled: character.equipment.shield.raised,
						alwaysActive: false
					});
				}

				// Add reinforcing rune bonus
				const reinforcing = (shield as any).runes?.reinforcing || 0;
				if (reinforcing > 0) {
					modifiers.push({
						label: `${shield.name} Reinforcing (Raised)`,
						source: shield.name,
						value: reinforcing,
						type: 'circumstance',
						selector: 'ac',
						predicate: ['shield-raised'],
						enabled: character.equipment.shield.raised,
						alwaysActive: false
					});
				}
			}
		} catch (error) {
			console.warn('Failed to load shield:', character.equipment.shield.itemId, error);
		}
	}

	// 3. Extract weapon modifiers
	for (const weapon of character.equipment.weapons) {
		if (!weapon.equipped) continue;

		try {
			const weaponData = await getEquipmentById(weapon.itemId);
			if (weaponData && weaponData.equipmentType === 'weapon') {
				// Attack bonus from magical weapons
				const attackBonus = (weaponData as any).bonus?.value || 0;
				const potency = (weaponData as any).runes?.potency || 0;
				const totalAttackBonus = attackBonus + potency;

				if (totalAttackBonus > 0) {
					modifiers.push({
						label: `${weaponData.name} Attack`,
						source: weaponData.name,
						value: totalAttackBonus,
						type: 'item',
						selector: 'attack',
						alwaysActive: true,
						enabled: true
					});
				}

				// Damage bonus from magical weapons
				const damageBonus = (weaponData as any).bonusDamage?.value || 0;
				const totalDamageBonus = damageBonus + potency;

				if (totalDamageBonus > 0) {
					modifiers.push({
						label: `${weaponData.name} Damage`,
						source: weaponData.name,
						value: totalDamageBonus,
						type: 'item',
						selector: 'damage',
						alwaysActive: true,
						enabled: true
					});
				}
			}
		} catch (error) {
			console.warn('Failed to load weapon:', weapon.itemId, error);
		}
	}

	// 4. Extract modifiers from worn items (via rule elements)
	for (const wornItem of character.equipment.wornItems) {
		try {
			const item = await getEquipmentById(wornItem.itemId);
			if (item && item.rules && item.rules.length > 0) {
				// Process rule elements from worn items
				const context: RuleElementContext = {
					source: item.name,
					level: character.level,
					actor: {
						level: character.level,
						abilities: character.abilities
					}
				};

				for (const ruleElement of item.rules) {
					if ('key' in ruleElement && ruleElement.key === 'FlatModifier') {
						const modifier = processFlatModifier(ruleElement as any, context);
						if (modifier) {
							modifiers.push(modifier);
						}
					}
				}
			}
		} catch (error) {
			console.warn('Failed to load worn item:', wornItem.itemId, error);
		}
	}

	return modifiers;
}

/**
 * Extract modifiers from class features
 */
export function extractModifiersFromClassFeatures(
	character: Character
): Modifier[] {
	const modifiers: Modifier[] = [];

	// Create rule element context from character
	const context: RuleElementContext = {
		source: '', // Will be set per class feature
		level: character.level,
		actor: {
			level: character.level,
			abilities: character.abilities
		}
	};

	// Process each class feature the character has
	for (const classFeature of character.classFeatures) {
		// Only process class features at or below current level
		if (classFeature.level > character.level) {
			continue;
		}

		// Set the source for this class feature's modifiers
		context.source = classFeature.name;

		// Process each rule element in the class feature
		for (const ruleElement of classFeature.rules) {
			const modifier = processRuleElement(ruleElement, context, character);
			if (modifier) {
				modifiers.push(modifier);
			}
		}
	}

	return modifiers;
}

/**
 * Extract modifiers from active conditions
 */
export function extractModifiersFromConditions(
	character: Character
): Modifier[] {
	const modifiers: Modifier[] = [];

	// Common PF2e conditions that provide modifiers
	const conditionModifiers: Record<string, Modifier[]> = {
		frightened: [
			{
				label: 'Frightened',
				source: 'Frightened Condition',
				value: -1, // Would need to get actual frightened value
				type: 'status',
				selector: 'all-checks-dcs',
				alwaysActive: true,
				enabled: true
			}
		],
		sickened: [
			{
				label: 'Sickened',
				source: 'Sickened Condition',
				value: -1, // Would need to get actual sickened value
				type: 'status',
				selector: 'all-checks',
				alwaysActive: true,
				enabled: true
			}
		],
		clumsy: [
			{
				label: 'Clumsy',
				source: 'Clumsy Condition',
				value: -1, // Would need to get actual clumsy value
				type: 'status',
				selector: 'dexterity-based',
				alwaysActive: true,
				enabled: true
			}
		],
		enfeebled: [
			{
				label: 'Enfeebled',
				source: 'Enfeebled Condition',
				value: -1, // Would need to get actual enfeebled value
				type: 'status',
				selector: 'strength-based',
				alwaysActive: true,
				enabled: true
			}
		],
		stupefied: [
			{
				label: 'Stupefied',
				source: 'Stupefied Condition',
				value: -1, // Would need to get actual stupefied value
				type: 'status',
				selector: 'intelligence-based',
				alwaysActive: true,
				enabled: true
			}
		]
	};

	// Add modifiers for each active condition
	for (const condition of character.activeConditions) {
		const conditionMods = conditionModifiers[condition.toLowerCase()];
		if (conditionMods) {
			modifiers.push(...conditionMods);
		}
	}

	return modifiers;
}

/**
 * Extract modifiers from active spells and effects
 */
export function extractModifiersFromSpells(
	character: Character
): Modifier[] {
	const modifiers: Modifier[] = [];

	// Create rule element context from character
	const context: RuleElementContext = {
		source: '', // Will be set per spell/effect
		level: character.level,
		actor: {
			level: character.level,
			abilities: character.abilities
		}
	};

	// Process each active spell or effect
	for (const spellOrEffect of character.activeSpellsAndEffects) {
		// Set the source for this spell/effect's modifiers
		context.source = spellOrEffect.name;

		// Process each rule element in the spell/effect
		for (const ruleElement of spellOrEffect.rules) {
			const modifier = processRuleElement(ruleElement, context, character);
			if (modifier) {
				modifiers.push(modifier);
			}
		}
	}

	return modifiers;
}
