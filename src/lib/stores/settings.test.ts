import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { settings, defaultSettings, exportSettings, importSettings } from './settings';

describe('Settings Store', () => {
	beforeEach(() => {
		// Reset to default settings
		settings.reset();
	});

	describe('Default Settings', () => {
		it('initializes with default variant rules', () => {
			const current = get(settings);

			expect(current.variantRules.freeArchetype).toBe(false);
			expect(current.variantRules.automaticBonusProgression).toBe(false);
			expect(current.variantRules.voluntaryFlaws).toBe(true);
		});

		it('initializes with default UI preferences', () => {
			const current = get(settings);

			expect(current.ui.theme).toBe('auto');
			expect(current.ui.autoSave).toBe(true);
			expect(current.ui.showTooltips).toBe(true);
		});

		it('initializes with default accessibility preferences', () => {
			const current = get(settings);

			expect(current.accessibility.reduceMotion).toBe(false);
			expect(current.accessibility.highContrast).toBe(false);
			expect(current.accessibility.keyboardShortcuts).toBe(true);
		});
	});

	describe('Variant Rules', () => {
		it('toggles a variant rule', () => {
			settings.toggleVariantRule('freeArchetype');
			let current = get(settings);

			expect(current.variantRules.freeArchetype).toBe(true);

			settings.toggleVariantRule('freeArchetype');
			current = get(settings);

			expect(current.variantRules.freeArchetype).toBe(false);
		});

		it('sets a variant rule', () => {
			settings.setVariantRule('automaticBonusProgression', true);
			const current = get(settings);

			expect(current.variantRules.automaticBonusProgression).toBe(true);
		});

		it('can enable multiple variant rules', () => {
			settings.setVariantRule('freeArchetype', true);
			settings.setVariantRule('gradualAbilityBoosts', true);
			settings.setVariantRule('stamina', true);

			const current = get(settings);

			expect(current.variantRules.freeArchetype).toBe(true);
			expect(current.variantRules.gradualAbilityBoosts).toBe(true);
			expect(current.variantRules.stamina).toBe(true);
		});
	});

	describe('UI Preferences', () => {
		it('sets theme', () => {
			settings.setTheme('dark');
			let current = get(settings);

			expect(current.ui.theme).toBe('dark');

			settings.setTheme('light');
			current = get(settings);

			expect(current.ui.theme).toBe('light');
		});

		it('toggles UI preference', () => {
			settings.toggleUIPreference('compactMode');
			let current = get(settings);

			expect(current.ui.compactMode).toBe(true);

			settings.toggleUIPreference('compactMode');
			current = get(settings);

			expect(current.ui.compactMode).toBe(false);
		});

		it('sets UI preference', () => {
			settings.setUIPreference('showAdvancedOptions', true);
			const current = get(settings);

			expect(current.ui.showAdvancedOptions).toBe(true);
		});

		it('handles non-boolean UI preferences', () => {
			settings.setUIPreference('theme', 'dark');
			const current = get(settings);

			expect(current.ui.theme).toBe('dark');
		});
	});

	describe('Accessibility Preferences', () => {
		it('toggles accessibility preference', () => {
			settings.toggleAccessibilityPreference('reduceMotion');
			const current = get(settings);

			expect(current.accessibility.reduceMotion).toBe(true);
		});

		it('sets accessibility preference', () => {
			settings.setAccessibilityPreference('highContrast', true);
			settings.setAccessibilityPreference('largeText', true);

			const current = get(settings);

			expect(current.accessibility.highContrast).toBe(true);
			expect(current.accessibility.largeText).toBe(true);
		});

		it('enables accessibility preset', () => {
			settings.enableAccessibilityPreset();
			const current = get(settings);

			expect(current.accessibility.reduceMotion).toBe(true);
			expect(current.accessibility.highContrast).toBe(true);
			expect(current.accessibility.largeText).toBe(true);
			expect(current.accessibility.screenReaderOptimized).toBe(true);
			expect(current.accessibility.visibleFocus).toBe(true);
		});
	});

	describe('Reset', () => {
		it('resets to default settings', () => {
			// Make some changes
			settings.setTheme('dark');
			settings.setVariantRule('freeArchetype', true);
			settings.setAccessibilityPreference('reduceMotion', true);

			// Reset
			settings.reset();

			const current = get(settings);

			expect(current.ui.theme).toBe('auto');
			expect(current.variantRules.freeArchetype).toBe(false);
			expect(current.accessibility.reduceMotion).toBe(false);
		});
	});

	describe('Export/Import', () => {
		it('exports settings to JSON', () => {
			settings.setTheme('dark');
			settings.setVariantRule('freeArchetype', true);

			const current = get(settings);
			const json = exportSettings(current);
			const parsed = JSON.parse(json);

			expect(parsed.ui.theme).toBe('dark');
			expect(parsed.variantRules.freeArchetype).toBe(true);
		});

		it('imports settings from JSON', () => {
			const testSettings = {
				...defaultSettings,
				ui: { ...defaultSettings.ui, theme: 'light' as const },
				variantRules: { ...defaultSettings.variantRules, stamina: true }
			};

			const json = JSON.stringify(testSettings);
			const imported = importSettings(json);

			expect(imported.ui.theme).toBe('light');
			expect(imported.variantRules.stamina).toBe(true);
		});

		it('merges imported settings with defaults', () => {
			// Import partial settings
			const partial = {
				ui: { theme: 'dark' as const }
			};

			const imported = importSettings(JSON.stringify(partial));

			// Should have the imported value
			expect(imported.ui.theme).toBe('dark');

			// But also default values for missing fields
			expect(imported.ui.autoSave).toBe(true);
			expect(imported.variantRules.freeArchetype).toBe(false);
		});

		it('throws error for invalid JSON', () => {
			expect(() => importSettings('invalid json')).toThrow('Failed to import settings');
		});
	});

	describe('Complex Scenarios', () => {
		it('handles full configuration workflow', () => {
			// Enable variant rules
			settings.setVariantRule('freeArchetype', true);
			settings.setVariantRule('automaticBonusProgression', true);

			// Set UI preferences
			settings.setTheme('dark');
			settings.setUIPreference('compactMode', true);

			// Enable accessibility
			settings.enableAccessibilityPreset();

			const current = get(settings);

			expect(current.variantRules.freeArchetype).toBe(true);
			expect(current.variantRules.automaticBonusProgression).toBe(true);
			expect(current.ui.theme).toBe('dark');
			expect(current.ui.compactMode).toBe(true);
			expect(current.accessibility.reduceMotion).toBe(true);
			expect(current.accessibility.highContrast).toBe(true);
		});

		it('maintains independence between setting types', () => {
			settings.setVariantRule('freeArchetype', true);

			const current = get(settings);

			// Variant rule changed
			expect(current.variantRules.freeArchetype).toBe(true);

			// But UI and accessibility remain default
			expect(current.ui.theme).toBe('auto');
			expect(current.accessibility.reduceMotion).toBe(false);
		});
	});
});
