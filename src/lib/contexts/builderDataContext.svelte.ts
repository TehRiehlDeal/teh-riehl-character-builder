/**
 * Builder Data Context
 *
 * Provides shared data loading for the character builder.
 * This prevents re-loading data when switching between tabs.
 */

import { getContext, setContext } from 'svelte';
import type { Ancestry, Heritage, Background, Class, Feat } from '$lib/data/types/app';

export interface BuilderData {
	// Data arrays
	ancestries: Ancestry[];
	heritages: Heritage[];
	backgrounds: Background[];
	classes: Class[];
	feats: Feat[];

	// Single loading state (SQLite loads all data quickly)
	loading: boolean;

	// Legacy loading states for backward compatibility
	/** @deprecated Use `loading` instead */
	criticalDataLoading: boolean;
	/** @deprecated Use `loading` instead */
	heritagesLoading: boolean;
	/** @deprecated Use `loading` instead */
	featsLoading: boolean;

	// Helper methods
	getClassFeats: () => Feat[];
	getAncestryFeats: () => Feat[];
	getSkillFeats: () => Feat[];
	getGeneralFeats: () => Feat[];
	getArchetypeFeats: () => Feat[];
}

const BUILDER_DATA_KEY = Symbol('builderData');

/**
 * Set the builder data context
 */
export function setBuilderDataContext(data: BuilderData) {
	setContext(BUILDER_DATA_KEY, data);
}

/**
 * Get the builder data context
 */
export function getBuilderDataContext(): BuilderData {
	const context = getContext<BuilderData>(BUILDER_DATA_KEY);
	if (!context) {
		throw new Error('Builder data context not found. Make sure it is set in a parent component.');
	}
	return context;
}
