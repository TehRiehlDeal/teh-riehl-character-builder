/**
 * Effect Adapter
 *
 * Transforms Foundry VTT effect data into our application schema.
 */

import type { Effect } from '../types/app';
import type { FoundryEffect } from '../types/foundry';

/**
 * Adapt a Foundry effect to our app schema
 */
export function adaptEffect(foundryEffect: FoundryEffect): Effect {
	return {
		type: 'effect',
		id: foundryEffect._id,
		name: foundryEffect.name,
		description: foundryEffect.system.description.value,
		traits: foundryEffect.system.traits?.value || [],
		rarity: (foundryEffect.system.traits?.rarity as Effect['rarity']) || 'common',
		source: {
			title: foundryEffect.system.publication?.title || 'Unknown',
			license: foundryEffect.system.publication?.license || 'OGL',
			remaster: foundryEffect.system.publication?.remaster || false
		},
		rules: foundryEffect.system.rules || [],
		level: foundryEffect.system.level.value,
		duration: {
			expiry: foundryEffect.system.duration.expiry,
			sustained: foundryEffect.system.duration.sustained,
			unit: foundryEffect.system.duration.unit,
			value: foundryEffect.system.duration.value
		},
		start: {
			initiative: foundryEffect.system.start.initiative,
			value: foundryEffect.system.start.value
		},
		tokenIcon: {
			show: foundryEffect.system.tokenIcon.show
		}
	};
}
