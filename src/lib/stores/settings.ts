/**
 * Settings Store
 *
 * Manages application settings including variant rules, UI preferences,
 * and accessibility preferences with localStorage persistence.
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Variant rules available in PF2e
 */
export interface VariantRules {
	/** Free Archetype variant rule */
	freeArchetype: boolean;
	/** Free Archetype: Allow multiple dedications without the 2-feat restriction (GM override) */
	freeArchetypeNoRestriction: boolean;
	/** Automatic Bonus Progression (removes magic item dependency) */
	automaticBonusProgression: boolean;
	/** Gradual Ability Boosts (gain boosts more frequently) */
	gradualAbilityBoosts: boolean;
	/** Proficiency without Level (remove level from proficiency calculations) */
	proficiencyWithoutLevel: boolean;
	/** Stamina variant rule */
	stamina: boolean;
	/** Voluntary Flaws at character creation */
	voluntaryFlaws: boolean;
	/** Dual-class characters */
	dualClass: boolean;
}

/**
 * UI preferences
 */
export interface UIPreferences {
	/** Theme preference (light, dark, auto) */
	theme: 'light' | 'dark' | 'auto';
	/** Compact mode for tighter UI */
	compactMode: boolean;
	/** Show advanced options */
	showAdvancedOptions: boolean;
	/** Show tooltips on hover */
	showTooltips: boolean;
	/** Automatically save character changes */
	autoSave: boolean;
	/** Confirm before deleting items */
	confirmDelete: boolean;
	/** Show modifier breakdowns */
	showModifierBreakdowns: boolean;
	/** Display dice notation vs. numeric */
	useDiceNotation: boolean;
}

/**
 * Accessibility preferences
 */
export interface AccessibilityPreferences {
	/** Reduce animations and transitions */
	reduceMotion: boolean;
	/** Use high contrast colors */
	highContrast: boolean;
	/** Increase font sizes */
	largeText: boolean;
	/** Optimize for screen readers */
	screenReaderOptimized: boolean;
	/** Keyboard shortcuts enabled */
	keyboardShortcuts: boolean;
	/** Focus indicators always visible */
	visibleFocus: boolean;
	/** Skip to content link */
	skipToContent: boolean;
}

/**
 * Application settings
 */
export interface Settings {
	variantRules: VariantRules;
	ui: UIPreferences;
	accessibility: AccessibilityPreferences;
}

/**
 * Default settings
 */
export const defaultSettings: Settings = {
	variantRules: {
		freeArchetype: false,
		freeArchetypeNoRestriction: false,
		automaticBonusProgression: false,
		gradualAbilityBoosts: false,
		proficiencyWithoutLevel: false,
		stamina: false,
		voluntaryFlaws: true,
		dualClass: false
	},
	ui: {
		theme: 'auto',
		compactMode: false,
		showAdvancedOptions: false,
		showTooltips: true,
		autoSave: true,
		confirmDelete: true,
		showModifierBreakdowns: true,
		useDiceNotation: true
	},
	accessibility: {
		reduceMotion: false,
		highContrast: false,
		largeText: false,
		screenReaderOptimized: false,
		keyboardShortcuts: true,
		visibleFocus: false,
		skipToContent: true
	}
};

/**
 * Storage key for localStorage
 */
const STORAGE_KEY = 'pf2e-character-builder:settings';

/**
 * Load settings from localStorage
 */
function loadFromStorage(): Settings {
	if (!browser) {
		return defaultSettings;
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			// Merge with defaults to handle new settings
			return {
				variantRules: { ...defaultSettings.variantRules, ...parsed.variantRules },
				ui: { ...defaultSettings.ui, ...parsed.ui },
				accessibility: { ...defaultSettings.accessibility, ...parsed.accessibility }
			};
		}
	} catch (error) {
		console.error('Failed to load settings from localStorage:', error);
	}

	return defaultSettings;
}

/**
 * Save settings to localStorage
 */
function saveToStorage(settings: Settings): void {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch (error) {
		console.error('Failed to save settings to localStorage:', error);
	}
}

/**
 * Apply accessibility preferences to document
 */
function applyAccessibilityPreferences(prefs: AccessibilityPreferences): void {
	if (!browser) return;

	const root = document.documentElement;

	// Reduce motion
	if (prefs.reduceMotion) {
		root.classList.add('reduce-motion');
	} else {
		root.classList.remove('reduce-motion');
	}

	// High contrast
	if (prefs.highContrast) {
		root.classList.add('high-contrast');
	} else {
		root.classList.remove('high-contrast');
	}

	// Large text
	if (prefs.largeText) {
		root.classList.add('large-text');
	} else {
		root.classList.remove('large-text');
	}

	// Visible focus
	if (prefs.visibleFocus) {
		root.classList.add('visible-focus');
	} else {
		root.classList.remove('visible-focus');
	}
}

/**
 * Apply theme preference to document
 */
function applyTheme(theme: UIPreferences['theme']): void {
	if (!browser) return;

	const root = document.documentElement;

	if (theme === 'auto') {
		// Respect system preference
		const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		root.setAttribute('data-theme', isDark ? 'dark' : 'light');
	} else {
		root.setAttribute('data-theme', theme);
	}
}

/**
 * Create the settings store
 */
function createSettingsStore() {
	const { subscribe, set, update } = writable<Settings>(loadFromStorage());

	// Auto-save to localStorage and apply settings on every update
	subscribe((settings) => {
		saveToStorage(settings);
		applyAccessibilityPreferences(settings.accessibility);
		applyTheme(settings.ui.theme);
	});

	// Apply settings on initial load
	if (browser) {
		const initial = loadFromStorage();
		applyAccessibilityPreferences(initial.accessibility);
		applyTheme(initial.ui.theme);

		// Listen for system theme changes
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
			const current = loadFromStorage();
			if (current.ui.theme === 'auto') {
				applyTheme('auto');
			}
		});
	}

	return {
		subscribe,
		set,
		update,

		/**
		 * Reset to default settings
		 */
		reset: () => {
			set(defaultSettings);
		},

		/**
		 * Toggle a variant rule
		 */
		toggleVariantRule: (rule: keyof VariantRules) => {
			update((settings) => ({
				...settings,
				variantRules: {
					...settings.variantRules,
					[rule]: !settings.variantRules[rule]
				}
			}));
		},

		/**
		 * Set a variant rule
		 */
		setVariantRule: (rule: keyof VariantRules, value: boolean) => {
			update((settings) => ({
				...settings,
				variantRules: {
					...settings.variantRules,
					[rule]: value
				}
			}));
		},

		/**
		 * Set theme
		 */
		setTheme: (theme: UIPreferences['theme']) => {
			update((settings) => ({
				...settings,
				ui: {
					...settings.ui,
					theme
				}
			}));
		},

		/**
		 * Toggle a UI preference
		 */
		toggleUIPreference: (pref: keyof UIPreferences) => {
			update((settings) => {
				const currentValue = settings.ui[pref];
				if (typeof currentValue === 'boolean') {
					return {
						...settings,
						ui: {
							...settings.ui,
							[pref]: !currentValue
						}
					};
				}
				return settings;
			});
		},

		/**
		 * Set a UI preference
		 */
		setUIPreference: <K extends keyof UIPreferences>(pref: K, value: UIPreferences[K]) => {
			update((settings) => ({
				...settings,
				ui: {
					...settings.ui,
					[pref]: value
				}
			}));
		},

		/**
		 * Toggle an accessibility preference
		 */
		toggleAccessibilityPreference: (pref: keyof AccessibilityPreferences) => {
			update((settings) => ({
				...settings,
				accessibility: {
					...settings.accessibility,
					[pref]: !settings.accessibility[pref]
				}
			}));
		},

		/**
		 * Set an accessibility preference
		 */
		setAccessibilityPreference: (pref: keyof AccessibilityPreferences, value: boolean) => {
			update((settings) => ({
				...settings,
				accessibility: {
					...settings.accessibility,
					[pref]: value
				}
			}));
		},

		/**
		 * Enable accessibility preset (for quick setup)
		 */
		enableAccessibilityPreset: () => {
			update((settings) => ({
				...settings,
				accessibility: {
					reduceMotion: true,
					highContrast: true,
					largeText: true,
					screenReaderOptimized: true,
					keyboardShortcuts: true,
					visibleFocus: true,
					skipToContent: true
				}
			}));
		}
	};
}

/**
 * The global settings store
 */
export const settings = createSettingsStore();

/**
 * Export settings to JSON
 */
export function exportSettings(settingsToExport?: Settings): string {
	return JSON.stringify(settingsToExport || loadFromStorage(), null, 2);
}

/**
 * Import settings from JSON
 */
export function importSettings(json: string): Settings {
	try {
		const parsed = JSON.parse(json);

		// Merge with defaults to handle missing fields
		return {
			variantRules: { ...defaultSettings.variantRules, ...(parsed.variantRules || {}) },
			ui: { ...defaultSettings.ui, ...(parsed.ui || {}) },
			accessibility: { ...defaultSettings.accessibility, ...(parsed.accessibility || {}) }
		};
	} catch (error) {
		throw new Error(`Failed to import settings: ${error}`);
	}
}

/**
 * Load imported settings into the store
 */
export function loadImportedSettings(importedSettings: Settings): void {
	settings.set(importedSettings);
}
