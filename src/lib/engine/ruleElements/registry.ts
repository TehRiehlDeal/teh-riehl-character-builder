import type { Modifier } from '../models/Modifier';
import {
	processFlatModifier,
	type FlatModifierRuleElement,
	type RuleElementContext
} from './flatModifier';
import { processAdjustModifier, type AdjustModifierRuleElement } from './adjustModifier';
import { processDamageDice, type DamageDice, type DamageDiceRuleElement } from './damageDice';
import { processBaseSpeed, type Speed, type BaseSpeedRuleElement } from './baseSpeed';
import { processSense, type Sense, type SenseRuleElement } from './sense';
import { processGrantItem, type GrantedItem, type GrantItemRuleElement } from './grantItem';
import { processChoiceSet, type ChoiceSetPrompt, type ChoiceSetRuleElement } from './choiceSet';
import {
	processActiveEffectLike,
	type PropertyModification,
	type ActiveEffectLikeRuleElement
} from './activeEffectLike';

// P2: Conditions
import { processRollOption, type RollOptionRuleElement, type RollOptionResult } from './rollOption';
import { processToggleProperty, type TogglePropertyRuleElement, type TogglePropertyResult } from './toggleProperty';

// P3: Combat
import { processWeaponPotency, type WeaponPotencyRuleElement, type WeaponPotencyResult } from './weaponPotency';
import { processStriking, type StrikingRuleElement, type StrikingResult } from './striking';

// P4: Magic
import { processTempHP, type TempHPRuleElement, type TempHPResult } from './tempHP';
import { processFastHealing, type FastHealingRuleElement, type FastHealingResult } from './fastHealing';

// P5: Advanced
import { processResistance, type ResistanceRuleElement, type ResistanceResult } from './resistance';
import { processWeakness, type WeaknessRuleElement, type WeaknessResult } from './weakness';
import { processImmunity, type ImmunityRuleElement, type ImmunityResult } from './immunity';
import { processCreatureSize, type CreatureSizeRuleElement, type CreatureSizeResult } from './creatureSize';
import { processActorTraits, type ActorTraitsRuleElement, type ActorTraitsResult } from './actorTraits';

/**
 * Rule Element Registry
 *
 * Central processor for all rule elements from Foundry VTT data.
 * Converts rule elements into our engine's data structures.
 */

/**
 * All supported rule element types
 */
export type RuleElement =
	| FlatModifierRuleElement
	| AdjustModifierRuleElement
	| DamageDiceRuleElement
	| BaseSpeedRuleElement
	| SenseRuleElement
	| GrantItemRuleElement
	| ChoiceSetRuleElement
	| ActiveEffectLikeRuleElement
	// P2: Conditions
	| RollOptionRuleElement
	| TogglePropertyRuleElement
	// P3: Combat
	| WeaponPotencyRuleElement
	| StrikingRuleElement
	// P4: Magic
	| TempHPRuleElement
	| FastHealingRuleElement
	// P5: Advanced
	| ResistanceRuleElement
	| WeaknessRuleElement
	| ImmunityRuleElement
	| CreatureSizeRuleElement
	| ActorTraitsRuleElement;

/**
 * Result of processing rule elements
 */
export interface ProcessedRuleElements {
	// P0 & P1
	modifiers: Modifier[];
	damageDice: DamageDice[];
	speeds: Speed[];
	senses: Sense[];
	grantedItems: GrantedItem[];
	choiceSets: ChoiceSetPrompt[];
	propertyModifications: PropertyModification[];
	// P2: Conditions
	rollOptions: RollOptionResult[];
	toggleProperties: TogglePropertyResult[];
	// P3: Combat
	weaponPotencies: WeaponPotencyResult[];
	strikingBonuses: StrikingResult[];
	// P4: Magic
	tempHP: TempHPResult[];
	fastHealing: FastHealingResult[];
	// P5: Advanced
	resistances: ResistanceResult[];
	weaknesses: WeaknessResult[];
	immunities: ImmunityResult[];
	sizeModifiers: CreatureSizeResult[];
	traitModifications: ActorTraitsResult[];
}

/**
 * Process an array of rule elements
 */
export function processRuleElements(
	ruleElements: RuleElement[],
	context: RuleElementContext
): ProcessedRuleElements {
	const result: ProcessedRuleElements = {
		// P0 & P1
		modifiers: [],
		damageDice: [],
		speeds: [],
		senses: [],
		grantedItems: [],
		choiceSets: [],
		propertyModifications: [],
		// P2: Conditions
		rollOptions: [],
		toggleProperties: [],
		// P3: Combat
		weaponPotencies: [],
		strikingBonuses: [],
		// P4: Magic
		tempHP: [],
		fastHealing: [],
		// P5: Advanced
		resistances: [],
		weaknesses: [],
		immunities: [],
		sizeModifiers: [],
		traitModifications: []
	};

	for (const element of ruleElements) {
		processRuleElement(element, context, result);
	}

	return result;
}

/**
 * Process a single rule element
 */
function processRuleElement(
	element: RuleElement,
	context: RuleElementContext,
	result: ProcessedRuleElements
): void {
	switch (element.key) {
		case 'FlatModifier': {
			const modifier = processFlatModifier(element, context);
			if (modifier) {
				result.modifiers.push(modifier);
			}
			break;
		}

		case 'AdjustModifier': {
			// AdjustModifier modifies existing modifiers
			result.modifiers = processAdjustModifier(element, result.modifiers);
			break;
		}

		case 'DamageDice': {
			const dice = processDamageDice(element, context);
			if (dice) {
				result.damageDice.push(dice);
			}
			break;
		}

		case 'BaseSpeed': {
			const speed = processBaseSpeed(element, context);
			result.speeds.push(speed);
			break;
		}

		case 'Sense': {
			const sense = processSense(element, context);
			result.senses.push(sense);
			break;
		}

		case 'GrantItem': {
			const item = processGrantItem(element, context);
			if (item) {
				result.grantedItems.push(item);
			}
			break;
		}

		case 'ChoiceSet': {
			const choiceSet = processChoiceSet(element, context);
			if (choiceSet) {
				result.choiceSets.push(choiceSet);
			}
			break;
		}

		case 'ActiveEffectLike': {
			const modification = processActiveEffectLike(element, context);
			if (modification) {
				result.propertyModifications.push(modification);
			}
			break;
		}

		// P2: Conditions
		case 'RollOption': {
			const rollOption = processRollOption(element);
			result.rollOptions.push(rollOption);
			break;
		}

		case 'ToggleProperty': {
			const toggle = processToggleProperty(element);
			result.toggleProperties.push(toggle);
			break;
		}

		// P3: Combat
		case 'WeaponPotency': {
			const potency = processWeaponPotency(element, context);
			result.weaponPotencies.push(potency);
			result.modifiers.push(potency.attackModifier, potency.damageModifier);
			break;
		}

		case 'Striking': {
			const striking = processStriking(element, { source: context.source });
			result.strikingBonuses.push(striking);
			break;
		}

		// P4: Magic
		case 'TempHP': {
			const tempHP = processTempHP(element, context);
			result.tempHP.push(tempHP);
			break;
		}

		case 'FastHealing': {
			const healing = processFastHealing(element, context);
			result.fastHealing.push(healing);
			break;
		}

		// P5: Advanced
		case 'Resistance': {
			const resistance = processResistance(element, context);
			result.resistances.push(resistance);
			break;
		}

		case 'Weakness': {
			const weakness = processWeakness(element, context);
			result.weaknesses.push(weakness);
			break;
		}

		case 'Immunity': {
			const immunity = processImmunity(element, { source: context.source });
			result.immunities.push(immunity);
			break;
		}

		case 'CreatureSize': {
			const sizeModifier = processCreatureSize(element, { source: context.source, currentSize: 'medium' });
			result.sizeModifiers.push(sizeModifier);
			break;
		}

		case 'ActorTraits': {
			const traits = processActorTraits(element, { source: context.source });
			result.traitModifications.push(traits);
			break;
		}

		default: {
			// Unsupported rule element type
			const unknownElement = element as { key: string };
			console.warn(`Unsupported rule element type: ${unknownElement.key}`);
		}
	}
}

/**
 * Process rule elements from a feat, class feature, or other source
 */
export function processSourceRuleElements(
	sourceName: string,
	rules: RuleElement[],
	level: number
): ProcessedRuleElements {
	const context: RuleElementContext = {
		source: sourceName,
		level,
		actor: {
			level
		}
	};

	return processRuleElements(rules, context);
}

/**
 * Merge multiple processed rule element results
 */
export function mergeProcessedRuleElements(
	...results: ProcessedRuleElements[]
): ProcessedRuleElements {
	const merged: ProcessedRuleElements = {
		// P0 & P1
		modifiers: [],
		damageDice: [],
		speeds: [],
		senses: [],
		grantedItems: [],
		choiceSets: [],
		propertyModifications: [],
		// P2: Conditions
		rollOptions: [],
		toggleProperties: [],
		// P3: Combat
		weaponPotencies: [],
		strikingBonuses: [],
		// P4: Magic
		tempHP: [],
		fastHealing: [],
		// P5: Advanced
		resistances: [],
		weaknesses: [],
		immunities: [],
		sizeModifiers: [],
		traitModifications: []
	};

	for (const result of results) {
		// P0 & P1
		merged.modifiers.push(...result.modifiers);
		merged.damageDice.push(...result.damageDice);
		merged.speeds.push(...result.speeds);
		merged.senses.push(...result.senses);
		merged.grantedItems.push(...result.grantedItems);
		merged.choiceSets.push(...result.choiceSets);
		merged.propertyModifications.push(...result.propertyModifications);
		// P2: Conditions
		merged.rollOptions.push(...result.rollOptions);
		merged.toggleProperties.push(...result.toggleProperties);
		// P3: Combat
		merged.weaponPotencies.push(...result.weaponPotencies);
		merged.strikingBonuses.push(...result.strikingBonuses);
		// P4: Magic
		merged.tempHP.push(...result.tempHP);
		merged.fastHealing.push(...result.fastHealing);
		// P5: Advanced
		merged.resistances.push(...result.resistances);
		merged.weaknesses.push(...result.weaknesses);
		merged.immunities.push(...result.immunities);
		merged.sizeModifiers.push(...result.sizeModifiers);
		merged.traitModifications.push(...result.traitModifications);
	}

	return merged;
}

/**
 * Filter rule elements by predicate
 */
export function filterByPredicate(
	processed: ProcessedRuleElements,
	activeConditions: Set<string>
): ProcessedRuleElements {
	return {
		// P0 & P1
		modifiers: processed.modifiers.filter(
			(m) => !m.predicate || m.predicate.every((p) => activeConditions.has(p))
		),
		damageDice: processed.damageDice.filter(
			(d) => !d.predicate || d.predicate.every((p) => activeConditions.has(p))
		),
		speeds: processed.speeds.filter(
			(s) => !s.predicate || s.predicate.every((p) => activeConditions.has(p))
		),
		senses: processed.senses.filter(
			(s) => !s.predicate || s.predicate.every((p) => activeConditions.has(p))
		),
		grantedItems: processed.grantedItems.filter(
			(g) => !g.predicate || g.predicate.every((p) => activeConditions.has(p))
		),
		choiceSets: processed.choiceSets,
		propertyModifications: processed.propertyModifications.filter(
			(pm) => !pm.predicate || pm.predicate.every((p) => activeConditions.has(p))
		),
		// P2: Conditions
		rollOptions: processed.rollOptions,
		toggleProperties: processed.toggleProperties,
		// P3: Combat
		weaponPotencies: processed.weaponPotencies,
		strikingBonuses: processed.strikingBonuses,
		// P4: Magic
		tempHP: processed.tempHP,
		fastHealing: processed.fastHealing,
		// P5: Advanced
		resistances: processed.resistances,
		weaknesses: processed.weaknesses,
		immunities: processed.immunities,
		sizeModifiers: processed.sizeModifiers,
		traitModifications: processed.traitModifications
	};
}

/**
 * Check if a rule element key is supported
 */
export function isRuleElementSupported(key: string): boolean {
	const supportedKeys = [
		// P0 & P1
		'FlatModifier',
		'AdjustModifier',
		'DamageDice',
		'BaseSpeed',
		'Sense',
		'GrantItem',
		'ChoiceSet',
		'ActiveEffectLike',
		// P2: Conditions
		'RollOption',
		'ToggleProperty',
		// P3: Combat
		'WeaponPotency',
		'Striking',
		// P4: Magic
		'TempHP',
		'FastHealing',
		// P5: Advanced
		'Resistance',
		'Weakness',
		'Immunity',
		'CreatureSize',
		'ActorTraits'
	];
	return supportedKeys.includes(key);
}

/**
 * Get list of all supported rule element types
 */
export function getSupportedRuleElements(): string[] {
	return [
		// P0 & P1
		'FlatModifier',
		'AdjustModifier',
		'DamageDice',
		'BaseSpeed',
		'Sense',
		'GrantItem',
		'ChoiceSet',
		'ActiveEffectLike',
		// P2: Conditions
		'RollOption',
		'ToggleProperty',
		// P3: Combat
		'WeaponPotency',
		'Striking',
		// P4: Magic
		'TempHP',
		'FastHealing',
		// P5: Advanced
		'Resistance',
		'Weakness',
		'Immunity',
		'CreatureSize',
		'ActorTraits'
	];
}
