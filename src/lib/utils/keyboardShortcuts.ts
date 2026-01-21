/**
 * Keyboard Shortcuts System
 *
 * Centralized keyboard shortcut management with conflict detection
 */

import { browser } from '$app/environment';

export interface KeyboardShortcut {
	/** Unique identifier for the shortcut */
	id: string;
	/** Display name */
	name: string;
	/** Description of what the shortcut does */
	description: string;
	/** The key combination (e.g., 'Ctrl+S', 'Alt+N') */
	keys: string;
	/** Category for grouping in help */
	category: string;
	/** Handler function */
	handler: (event: KeyboardEvent) => void;
	/** Whether this shortcut is enabled */
	enabled?: boolean;
	/** Whether to prevent default browser behavior */
	preventDefault?: boolean;
}

class KeyboardShortcutManager {
	private shortcuts: Map<string, KeyboardShortcut> = new Map();
	private listeners: Map<string, (event: KeyboardEvent) => void> = new Map();

	/**
	 * Register a keyboard shortcut
	 */
	register(shortcut: KeyboardShortcut): void {
		if (this.shortcuts.has(shortcut.id)) {
			console.warn(`Keyboard shortcut "${shortcut.id}" is already registered`);
			return;
		}

		this.shortcuts.set(shortcut.id, shortcut);

		if (browser) {
			const listener = (event: KeyboardEvent) => {
				if (shortcut.enabled === false) return;

				if (this.matchesShortcut(event, shortcut.keys)) {
					if (shortcut.preventDefault !== false) {
						event.preventDefault();
					}
					shortcut.handler(event);
				}
			};

			this.listeners.set(shortcut.id, listener);
			window.addEventListener('keydown', listener);
		}
	}

	/**
	 * Unregister a keyboard shortcut
	 */
	unregister(id: string): void {
		const listener = this.listeners.get(id);
		if (listener && browser) {
			window.removeEventListener('keydown', listener);
		}

		this.shortcuts.delete(id);
		this.listeners.delete(id);
	}

	/**
	 * Get all registered shortcuts
	 */
	getAll(): KeyboardShortcut[] {
		return Array.from(this.shortcuts.values());
	}

	/**
	 * Get shortcuts by category
	 */
	getByCategory(category: string): KeyboardShortcut[] {
		return Array.from(this.shortcuts.values()).filter((s) => s.category === category);
	}

	/**
	 * Get all categories
	 */
	getCategories(): string[] {
		const categories = new Set(Array.from(this.shortcuts.values()).map((s) => s.category));
		return Array.from(categories);
	}

	/**
	 * Enable or disable a shortcut
	 */
	setEnabled(id: string, enabled: boolean): void {
		const shortcut = this.shortcuts.get(id);
		if (shortcut) {
			shortcut.enabled = enabled;
		}
	}

	/**
	 * Check if a keyboard event matches a key combination
	 */
	private matchesShortcut(event: KeyboardEvent, keys: string): boolean {
		const parts = keys.split('+').map((k) => k.trim().toLowerCase());

		const hasCtrl = parts.includes('ctrl') || parts.includes('control');
		const hasAlt = parts.includes('alt');
		const hasShift = parts.includes('shift');
		const hasMeta = parts.includes('meta') || parts.includes('cmd');

		// Get the actual key (last part)
		const key = parts[parts.length - 1].toLowerCase();

		// Check modifiers
		if (event.ctrlKey !== hasCtrl) return false;
		if (event.altKey !== hasAlt) return false;
		if (event.shiftKey !== hasShift) return false;
		if (event.metaKey !== hasMeta) return false;

		// Check key
		return event.key.toLowerCase() === key;
	}

	/**
	 * Cleanup all shortcuts
	 */
	cleanup(): void {
		if (browser) {
			this.listeners.forEach((listener) => {
				window.removeEventListener('keydown', listener);
			});
		}

		this.shortcuts.clear();
		this.listeners.clear();
	}
}

// Singleton instance
export const keyboardShortcuts = new KeyboardShortcutManager();

// Default application shortcuts
export const defaultShortcuts: Omit<KeyboardShortcut, 'handler'>[] = [
	{
		id: 'help',
		name: 'Show Help',
		description: 'Open keyboard shortcuts help',
		keys: 'Shift+?',
		category: 'General'
	},
	{
		id: 'save',
		name: 'Save Character',
		description: 'Save the current character',
		keys: 'Ctrl+S',
		category: 'Character'
	},
	{
		id: 'export',
		name: 'Export Character',
		description: 'Export character to JSON',
		keys: 'Ctrl+E',
		category: 'Character'
	},
	{
		id: 'new',
		name: 'New Character',
		description: 'Create a new character',
		keys: 'Ctrl+N',
		category: 'Character'
	},
	{
		id: 'search',
		name: 'Search Feats',
		description: 'Focus the feat search box',
		keys: 'Ctrl+F',
		category: 'Navigation'
	},
	{
		id: 'next-tab',
		name: 'Next Tab',
		description: 'Navigate to the next builder tab',
		keys: 'Ctrl+]',
		category: 'Navigation'
	},
	{
		id: 'prev-tab',
		name: 'Previous Tab',
		description: 'Navigate to the previous builder tab',
		keys: 'Ctrl+[',
		category: 'Navigation'
	}
];

/**
 * Format key combination for display
 */
export function formatKeys(keys: string): string {
	return keys
		.split('+')
		.map((key) => {
			const k = key.trim();
			// Capitalize and format special keys
			if (k.toLowerCase() === 'ctrl' || k.toLowerCase() === 'control') return '⌃ Ctrl';
			if (k.toLowerCase() === 'alt') return '⌥ Alt';
			if (k.toLowerCase() === 'shift') return '⇧ Shift';
			if (k.toLowerCase() === 'meta' || k.toLowerCase() === 'cmd') return '⌘ Cmd';
			if (k === '?') return '?';
			return k.toUpperCase();
		})
		.join(' + ');
}
