/**
 * Condition Adapter
 *
 * Transforms Foundry VTT condition data into our application schema.
 */

import type { Condition } from '../types/app';
import type { FoundryCondition } from '../types/foundry';

/**
 * Adapt a Foundry condition to our app schema
 */
export function adaptCondition(foundryCondition: FoundryCondition): Condition {
	return {
		type: 'condition',
		id: foundryCondition._id,
		name: foundryCondition.name,
		description: foundryCondition.system.description.value,
		traits: foundryCondition.system.traits?.value || [],
		rarity: (foundryCondition.system.traits?.rarity as Condition['rarity']) || 'common',
		source: {
			title: foundryCondition.system.publication?.title || 'Unknown',
			license: foundryCondition.system.publication?.license || 'OGL',
			remaster: foundryCondition.system.publication?.remaster || false
		},
		rules: foundryCondition.system.rules || [],
		value: foundryCondition.system.value
			? {
					isValued: foundryCondition.system.value.isValued,
					value: foundryCondition.system.value.value,
					immutable: foundryCondition.system.value.immutable
			  }
			: undefined,
		duration: foundryCondition.system.duration
			? {
					unit: foundryCondition.system.duration.unit,
					value: foundryCondition.system.duration.value,
					text: foundryCondition.system.duration.text
			  }
			: undefined,
		removable: foundryCondition.system.removable,
		overrides: foundryCondition.system.overrides || []
	};
}
