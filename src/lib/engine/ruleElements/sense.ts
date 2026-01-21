import type { RuleElementContext } from './flatModifier';

/**
 * Sense Rule Element
 *
 * Grants special senses like darkvision, low-light vision, scent, etc.
 * Example: Dwarf ancestry grants darkvision
 */

/**
 * Sense types in PF2e
 */
export type SenseType =
	| 'darkvision'
	| 'low-light-vision'
	| 'scent'
	| 'tremorsense'
	| 'echolocation'
	| 'thoughtsense'
	| 'lifesense'
	| 'see-invisibility';

/**
 * Sense acuity (for distance-based senses)
 */
export type SenseAcuity = 'precise' | 'imprecise' | 'vague';

/**
 * Sense data from Foundry VTT
 */
export interface SenseRuleElement {
	key: 'Sense';
	/** Type of sense */
	selector: SenseType;
	/** Range in feet (if applicable) */
	range?: number;
	/** Acuity of the sense */
	acuity?: SenseAcuity;
	/** Label override */
	label?: string;
	/** Predicate for when this sense is active */
	predicate?: string[];
}

/**
 * Processed sense
 */
export interface Sense {
	type: SenseType;
	range?: number;
	acuity: SenseAcuity;
	source: string;
	label: string;
	predicate?: string[];
	enabled: boolean;
}

/**
 * Process a Sense rule element
 */
export function processSense(ruleElement: SenseRuleElement, context: RuleElementContext): Sense {
	const type = ruleElement.selector;
	const acuity = ruleElement.acuity ?? getDefaultAcuity(type);
	const label = ruleElement.label ?? formatSenseLabel(type, ruleElement.range, acuity);

	return {
		type,
		range: ruleElement.range,
		acuity,
		source: context.source,
		label,
		predicate: ruleElement.predicate,
		enabled: true
	};
}

/**
 * Get the default acuity for a sense type
 */
function getDefaultAcuity(type: SenseType): SenseAcuity {
	switch (type) {
		case 'darkvision':
		case 'low-light-vision':
		case 'see-invisibility':
			return 'precise';
		case 'scent':
		case 'tremorsense':
		case 'echolocation':
			return 'imprecise';
		case 'thoughtsense':
		case 'lifesense':
			return 'vague';
		default:
			return 'imprecise';
	}
}

/**
 * Format a sense label for display
 */
function formatSenseLabel(type: SenseType, range?: number, acuity?: SenseAcuity): string {
	const typeName = type
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');

	let label = typeName;

	if (range !== undefined) {
		label += ` ${range} feet`;
	}

	if (acuity && acuity !== 'precise') {
		label += ` (${acuity})`;
	}

	return label;
}

/**
 * Get all active senses
 */
export function getActiveSenses(senses: Sense[], activeConditions: Set<string>): Sense[] {
	return senses.filter(
		(sense) => sense.enabled && shouldApplySense(sense, activeConditions)
	);
}

/**
 * Check if a sense should apply based on predicates
 */
function shouldApplySense(sense: Sense, activeConditions: Set<string>): boolean {
	if (!sense.predicate || sense.predicate.length === 0) {
		return true;
	}

	return sense.predicate.every((condition) => activeConditions.has(condition));
}

/**
 * Consolidate duplicate senses (take best range/acuity)
 */
export function consolidateSenses(senses: Sense[]): Sense[] {
	const byType = new Map<SenseType, Sense[]>();

	// Group by type
	for (const sense of senses) {
		if (!byType.has(sense.type)) {
			byType.set(sense.type, []);
		}
		byType.get(sense.type)!.push(sense);
	}

	const consolidated: Sense[] = [];

	// For each type, keep the best version
	for (const sensesOfType of byType.values()) {
		if (sensesOfType.length === 1) {
			consolidated.push(sensesOfType[0]);
			continue;
		}

		// Find the one with the best range and acuity
		let best = sensesOfType[0];

		for (const sense of sensesOfType.slice(1)) {
			// Better if it has a longer range
			if (
				sense.range !== undefined &&
				(best.range === undefined || sense.range > best.range)
			) {
				best = sense;
				continue;
			}

			// Better if it has better acuity
			if (getAcuityRank(sense.acuity) > getAcuityRank(best.acuity)) {
				best = sense;
			}
		}

		consolidated.push(best);
	}

	return consolidated;
}

/**
 * Get numeric rank for acuity (higher is better)
 */
function getAcuityRank(acuity: SenseAcuity): number {
	switch (acuity) {
		case 'precise':
			return 3;
		case 'imprecise':
			return 2;
		case 'vague':
			return 1;
	}
}

/**
 * Check if character has a specific sense
 */
export function hasSense(senses: Sense[], type: SenseType): boolean {
	return senses.some((s) => s.type === type && s.enabled);
}

/**
 * Get the range of a specific sense (returns undefined if not present)
 */
export function getSenseRange(senses: Sense[], type: SenseType): number | undefined {
	const sense = senses.find((s) => s.type === type && s.enabled);
	return sense?.range;
}
