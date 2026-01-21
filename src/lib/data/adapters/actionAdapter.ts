/**
 * Action Adapter
 *
 * Transforms Foundry VTT action data into our application schema.
 */

import type { Action } from '../types/app';
import type { FoundryAction } from '../types/foundry';

/**
 * Adapt a Foundry action to our app schema
 */
export function adaptAction(foundryAction: FoundryAction): Action {
	return {
		type: 'action',
		id: foundryAction._id,
		name: foundryAction.name,
		description: foundryAction.system.description.value,
		traits: foundryAction.system.traits?.value || [],
		rarity: (foundryAction.system.traits?.rarity as Action['rarity']) || 'common',
		source: {
			title: foundryAction.system.publication?.title || 'Unknown',
			license: foundryAction.system.publication?.license || 'OGL',
			remaster: foundryAction.system.publication?.remaster || false
		},
		rules: foundryAction.system.rules || [],
		actionType: foundryAction.system.actionType.value,
		actions: foundryAction.system.actions.value ?? undefined,
		category: foundryAction.system.category ?? undefined,
		requirements: foundryAction.system.requirements,
		trigger: foundryAction.system.trigger
	};
}
