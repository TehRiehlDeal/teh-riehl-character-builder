import type { Modifier } from '../models/Modifier';

/**
 * AdjustModifier Rule Element
 *
 * Modifies existing modifiers by adjusting their values or changing their properties.
 * Example: Increasing the bonus from an existing modifier based on level
 */

/**
 * AdjustModifier data from Foundry VTT
 */
export interface AdjustModifierRuleElement {
	key: 'AdjustModifier';
	selector: string;
	/** Which modifier to adjust (matches by label or source) */
	slug?: string;
	/** How to adjust the value */
	mode?: 'add' | 'multiply' | 'override' | 'upgrade' | 'downgrade';
	/** Value to adjust by */
	value?: number;
	/** Predicate for when this adjustment applies */
	predicate?: string[];
}

/**
 * Apply an AdjustModifier to existing modifiers
 */
export function processAdjustModifier(
	ruleElement: AdjustModifierRuleElement,
	existingModifiers: Modifier[]
): Modifier[] {
	// Find modifiers that match the selector
	const targetModifiers = existingModifiers.filter(
		(m) => m.selector === ruleElement.selector
	);

	if (targetModifiers.length === 0) {
		return existingModifiers;
	}

	// If a slug is specified, filter to that specific modifier
	let toAdjust = targetModifiers;
	if (ruleElement.slug) {
		toAdjust = targetModifiers.filter(
			(m) =>
				m.label.toLowerCase().includes(ruleElement.slug!.toLowerCase()) ||
				m.source.toLowerCase().includes(ruleElement.slug!.toLowerCase())
		);
	}

	if (toAdjust.length === 0) {
		return existingModifiers;
	}

	// Create adjusted versions
	const adjusted = existingModifiers.map((modifier) => {
		if (!toAdjust.includes(modifier)) {
			return modifier;
		}

		return adjustModifierValue(modifier, ruleElement);
	});

	return adjusted;
}

/**
 * Adjust a modifier's value based on the rule element
 */
function adjustModifierValue(
	modifier: Modifier,
	ruleElement: AdjustModifierRuleElement
): Modifier {
	const mode = ruleElement.mode ?? 'add';
	const adjustValue = ruleElement.value ?? 0;

	let newValue = modifier.value;

	switch (mode) {
		case 'add':
			newValue = modifier.value + adjustValue;
			break;
		case 'multiply':
			newValue = modifier.value * adjustValue;
			break;
		case 'override':
			newValue = adjustValue;
			break;
		case 'upgrade':
			// Upgrade means increase if the new value is higher
			newValue = Math.max(modifier.value, adjustValue);
			break;
		case 'downgrade':
			// Downgrade means decrease if the new value is lower
			newValue = Math.min(modifier.value, adjustValue);
			break;
	}

	return {
		...modifier,
		value: newValue,
		// Optionally add a note that this was adjusted
		source: `${modifier.source} (adjusted)`
	};
}

/**
 * Check if an adjustment should apply based on predicates
 */
export function shouldApplyAdjustment(
	ruleElement: AdjustModifierRuleElement,
	activeConditions: Set<string>
): boolean {
	if (!ruleElement.predicate || ruleElement.predicate.length === 0) {
		return true;
	}

	return ruleElement.predicate.every((condition) => activeConditions.has(condition));
}
