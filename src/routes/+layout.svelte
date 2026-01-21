<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { pwaInfo } from 'virtual:pwa-info';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import PWABadge from '$lib/components/common/PWABadge.svelte';
	import Header from '$lib/components/common/Header.svelte';
	import Footer from '$lib/components/common/Footer.svelte';
	import KeyboardShortcutsHelp from '$lib/components/common/KeyboardShortcutsHelp.svelte';
	import VariantRulesSettingsModal from '$lib/components/settings/VariantRulesSettingsModal.svelte';
	import { settings } from '$lib/stores/settings';
	import { exportCharacter } from '$lib/stores/character';
	import { keyboardShortcuts } from '$lib/utils/keyboardShortcuts';

	let { children } = $props();

	const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	let helpModalOpen = $state(false);
	let settingsModalOpen = $state(false);

	// Initialize settings store (will apply theme and accessibility preferences)
	$effect(() => {
		// Subscribe to settings to trigger initialization
		$settings;
	});

	// Register keyboard shortcuts
	onMount(() => {
		// Help modal
		keyboardShortcuts.register({
			id: 'help',
			name: 'Show Help',
			description: 'Open keyboard shortcuts help',
			keys: 'Shift+?',
			category: 'General',
			handler: () => {
				helpModalOpen = true;
			}
		});

		// Settings modal
		keyboardShortcuts.register({
			id: 'settings',
			name: 'Open Settings',
			description: 'Open variant rules settings',
			keys: 'Ctrl+,',
			category: 'General',
			handler: () => {
				settingsModalOpen = true;
			}
		});

		// Save character
		keyboardShortcuts.register({
			id: 'save',
			name: 'Save Character',
			description: 'Save the current character',
			keys: 'Ctrl+S',
			category: 'Character',
			handler: () => {
				// Character is auto-saved, just show feedback
				console.log('Character saved');
			}
		});

		// Export character
		keyboardShortcuts.register({
			id: 'export',
			name: 'Export Character',
			description: 'Export character to JSON',
			keys: 'Ctrl+E',
			category: 'Character',
			handler: () => {
				const json = exportCharacter();
				const blob = new Blob([json], { type: 'application/json' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `character-${Date.now()}.json`;
				a.click();
				URL.revokeObjectURL(url);
			}
		});

		// Navigation shortcuts
		const builderTabs = [
			'/builder/general',
			'/builder/stats',
			'/builder/feats',
			'/builder/equipment',
			'/builder/spells',
			'/builder/planning'
		];

		keyboardShortcuts.register({
			id: 'next-tab',
			name: 'Next Tab',
			description: 'Navigate to the next builder tab',
			keys: 'Ctrl+]',
			category: 'Navigation',
			handler: () => {
				const currentPath = $page.url.pathname;
				const currentIndex = builderTabs.indexOf(currentPath);
				if (currentIndex !== -1 && currentIndex < builderTabs.length - 1) {
					goto(builderTabs[currentIndex + 1]);
				}
			}
		});

		keyboardShortcuts.register({
			id: 'prev-tab',
			name: 'Previous Tab',
			description: 'Navigate to the previous builder tab',
			keys: 'Ctrl+[',
			category: 'Navigation',
			handler: () => {
				const currentPath = $page.url.pathname;
				const currentIndex = builderTabs.indexOf(currentPath);
				if (currentIndex > 0) {
					goto(builderTabs[currentIndex - 1]);
				}
			}
		});
	});

	// Cleanup shortcuts on destroy
	onDestroy(() => {
		keyboardShortcuts.cleanup();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{@html webManifestLink}
</svelte:head>

<div class="app-layout">
	<!-- Skip Links for keyboard navigation -->
	<a href="#main-content" class="skip-link">Skip to main content</a>
	<a href="#main-nav" class="skip-link">Skip to navigation</a>

	<PWABadge />

	<Header />

	<main id="main-content" class="app-main">
		{@render children()}
	</main>

	<Footer />

	<!-- Keyboard Shortcuts Help Modal -->
	<KeyboardShortcutsHelp bind:open={helpModalOpen} />

	<!-- Variant Rules Settings Modal -->
	<VariantRulesSettingsModal bind:open={settingsModalOpen} />
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		height: 100%;
	}

	.app-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.app-main {
		flex: 1;
	}

	/* Skip Links - visible only when focused */
	.skip-link {
		position: absolute;
		top: -40px;
		left: 0;
		z-index: 100;
		padding: 0.75rem 1.5rem;
		background-color: var(--link-color, #5c7cfa);
		color: white;
		text-decoration: none;
		font-weight: 600;
		border-radius: 0 0 4px 0;
		transition: top 0.2s ease-in-out;
	}

	.skip-link:focus {
		top: 0;
		outline: 3px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}
</style>
