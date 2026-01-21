/**
 * Active Modifiers Store
 *
 * Provides a derived store that aggregates all active modifiers from the character
 * for display in the Active Effects Panel (Task 5.2).
 */

import { derived } from 'svelte/store';
import { character } from './character';
import type { Modifier } from '$lib/engine/models/Modifier';
import { shouldApply } from '$lib/engine/models/Modifier';
import {
	extractModifiersFromFeats,
	extractModifiersFromEquipment,
	extractModifiersFromConditions,
	extractModifiersFromClassFeatures,
	extractModifiersFromSpells
} from '$lib/engine/services/modifierExtraction';
import { getAllFeats } from '$lib/data/repositories/featRepository';

/**
 * Grouped modifier entry for display in the Active Effects Panel
 */
export interface GroupedModifier {
	/** The selector this affects (e.g., 'ac', 'speed', 'fortitude') */
	selector: string;
	/** Human-readable label for the selector */
	selectorLabel: string;
	/** The modifier data */
	modifier: Modifier;
	/** Whether this modifier is currently active */
	isActive: boolean;
	/** Unique ID for toggleable modifiers */
	effectId?: string;
}

/**
 * Get human-readable label for a selector
 */
function getSelectorLabel(selector: string): string {
	const labels: Record<string, string> = {
		ac: 'AC',
		speed: 'Speed',
		'land-speed': 'Speed',
		'fly-speed': 'Fly Speed',
		'swim-speed': 'Swim Speed',
		'climb-speed': 'Climb Speed',
		'burrow-speed': 'Burrow Speed',
		fortitude: 'Fortitude Save',
		reflex: 'Reflex Save',
		will: 'Will Save',
		perception: 'Perception',
		initiative: 'Initiative',
		attack: 'Attack Rolls',
		damage: 'Damage',
		'spell-attack': 'Spell Attack',
		'spell-dc': 'Spell DC',
		hp: 'Hit Points',
		'max-hp': 'Max Hit Points',
		'temp-hp': 'Temporary HP',
		'all-checks': 'All Checks',
		'all-checks-dcs': 'All Checks and DCs',
		'all-saves': 'All Saves',
		'dexterity-based': 'Dexterity-based Checks',
		'strength-based': 'Strength-based Checks',
		'constitution-based': 'Constitution-based Checks',
		'intelligence-based': 'Intelligence-based Checks',
		'wisdom-based': 'Wisdom-based Checks',
		'charisma-based': 'Charisma-based Checks'
	};

	// Check for skill selectors (e.g., 'skill:acrobatics')
	if (selector.startsWith('skill:')) {
		const skillName = selector.substring(6);
		return skillName.charAt(0).toUpperCase() + skillName.slice(1);
	}

	// Return mapped label or format the selector nicely
	return (
		labels[selector] ||
		selector
			.split('-')
			.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
			.join(' ')
	);
}

/**
 * Derived store that provides all modifiers grouped for the Active Effects Panel
 *
 * This is an async derived store that loads feat data and extracts modifiers.
 */
export const activeModifiersStore = derived(
	character,
	($character, set) => {
		// Cancellation flag for this calculation
		let cancelled = false;

		// Initialize with empty array
		set([]);

		// Async function to load and process modifiers
		async function loadModifiers() {
			if (!$character || cancelled) {
				set([]);
				return;
			}

			try {
				// Load all feats from repository
				const allFeats = await getAllFeats();
				if (cancelled) return;

				// Extract modifiers from all sources
				const featModifiers = await extractModifiersFromFeats($character, allFeats);
				if (cancelled) return;

				const classFeatureModifiers = extractModifiersFromClassFeatures($character);
				const equipmentModifiers = await extractModifiersFromEquipment($character);
				if (cancelled) return;

				const spellModifiers = extractModifiersFromSpells($character);
				const conditionModifiers = extractModifiersFromConditions($character);

				// Combine all modifiers
				const allModifiers = [
					...featModifiers,
					...classFeatureModifiers,
					...equipmentModifiers,
					...spellModifiers,
					...conditionModifiers
				];

				// Get active conditions from character (for predicate checking)
				const activeConditions = new Set<string>($character.activeConditions);

				// Group modifiers by selector
				const grouped: GroupedModifier[] = allModifiers.map((modifier) => {
					const isActive = shouldApply(modifier, activeConditions);
					const effectId = modifier.predicate
						? `${modifier.source}:${modifier.selector}`
						: undefined;

					return {
						selector: modifier.selector,
						selectorLabel: getSelectorLabel(modifier.selector),
						modifier,
						isActive,
						effectId
					};
				});

				// Sort by selector, then by whether it's active
				const sorted = grouped.sort((a, b) => {
					if (a.selector !== b.selector) {
						return a.selector.localeCompare(b.selector);
					}
					// Active modifiers first
					if (a.isActive !== b.isActive) {
						return a.isActive ? -1 : 1;
					}
					return 0;
				});

				// Only update if this calculation hasn't been cancelled
				if (!cancelled) {
					set(sorted);
				}
			} catch (error) {
				console.error('Failed to load active modifiers:', error);
				if (!cancelled) {
					set([]);
				}
			}
		}

		// Load modifiers
		loadModifiers();

		// Return cleanup function that cancels this calculation when a new one starts
		return () => {
			cancelled = true;
		};
	},
	[] as GroupedModifier[]
);
