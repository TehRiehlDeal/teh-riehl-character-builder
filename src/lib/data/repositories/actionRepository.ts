/**
 * Action Repository
 *
 * Provides data access methods for actions.
 * Uses lazy loading to avoid loading all actions into memory at once.
 */

import type { Action } from '../types/app';
import type { FoundryAction } from '../types/foundry';
import { adaptAction } from '../adapters/actionAdapter';
import { loadAllData, loadDataById } from '../dataLoader';

/**
 * In-memory cache of loaded actions
 */
let actionCache: Action[] | null = null;

/**
 * Load all actions from raw data files
 */
async function loadActions(): Promise<Action[]> {
	if (actionCache !== null) {
		return actionCache;
	}

	try {
		// Load all action data from manifest
		const foundryActions = await loadAllData<FoundryAction>('actions');

		// Adapt to app schema
		const actions = foundryActions.map((action) => adaptAction(action));

		actionCache = actions;
		return actions;
	} catch (error) {
		console.error('Failed to load actions:', error);
		return [];
	}
}

/**
 * Get all actions
 */
export async function getAllActions(): Promise<Action[]> {
	return loadActions();
}

/**
 * Get action by ID
 *
 * This method loads only the specific action file, not all actions
 */
export async function getActionById(id: string): Promise<Action | null> {
	try {
		const foundryAction = await loadDataById<FoundryAction>('actions', id);
		if (!foundryAction) {
			return null;
		}

		return adaptAction(foundryAction);
	} catch (error) {
		console.error(`Failed to load action ${id}:`, error);
		return null;
	}
}

/**
 * Get actions by action type
 */
export async function getActionsByType(
	actionType: 'action' | 'reaction' | 'free' | 'passive'
): Promise<Action[]> {
	const actions = await loadActions();
	return actions.filter((action) => action.actionType === actionType);
}

/**
 * Search actions by name
 */
export async function searchActions(query: string): Promise<Action[]> {
	const actions = await loadActions();
	const lowerQuery = query.toLowerCase();

	return actions.filter((action) => action.name.toLowerCase().includes(lowerQuery));
}

/**
 * Get actions by trait
 */
export async function getActionsByTrait(trait: string): Promise<Action[]> {
	const actions = await loadActions();
	return actions.filter((action) => action.traits.includes(trait));
}

/**
 * Clear the action cache
 *
 * Useful for testing or when data is updated
 */
export function clearActionCache(): void {
	actionCache = null;
}
