<script lang="ts">
	/**
	 * Builder Layout - Data Loading
	 *
	 * Data is loaded once from SQLite when the layout first mounts.
	 * The layout persists when navigating between tabs, so data is only
	 * fetched once per session.
	 *
	 * With SQLite, all data loads in parallel in ~50-100ms.
	 */

	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Drawer from '$lib/components/common/Drawer.svelte';
	import ActiveEffectsPanel from '$lib/components/features/ActiveEffectsPanel.svelte';
	import VariantRulesSettingsModal from '$lib/components/settings/VariantRulesSettingsModal.svelte';
	import { ancestryLoader, heritageLoader, backgroundLoader, classLoader, featLoader, actionLoader } from '$lib/data/loaders';
	import { setBuilderDataContext, type BuilderData } from '$lib/contexts/builderDataContext.svelte';
	import type { Ancestry, Heritage, Background, Class, Feat, Action } from '$lib/data/types/app';

	let { children } = $props();

	let mobileMenuOpen = $state(false);
	let effectsPanelOpen = $state(false);
	let variantRulesOpen = $state(false);

	// Shared data state for all builder pages
	let ancestries = $state<Ancestry[]>([]);
	let heritages = $state<Heritage[]>([]);
	let backgrounds = $state<Background[]>([]);
	let classes = $state<Class[]>([]);
	let feats = $state<Feat[]>([]);
	let actions = $state<Action[]>([]);

	// Single loading state for all data
	let loading = $state(true);

	// Flag to ensure data only loads once (defensive against potential double-mounts)
	let dataLoaded = false;

	// Load all data in parallel when the layout mounts
	onMount(async () => {
		if (dataLoaded) return;
		dataLoaded = true;

		try {
			// Load all data in parallel - SQLite makes this fast
			const [ancestryData, heritageData, backgroundData, classData, featData, actionData] = await Promise.all([
				ancestryLoader.loadAll(),
				heritageLoader.loadAll(),
				backgroundLoader.loadAll(),
				classLoader.loadAll(),
				featLoader.loadAll(),
				actionLoader.loadAll()
			]);

			ancestries = ancestryData;
			heritages = heritageData;
			backgrounds = backgroundData;
			classes = classData;
			feats = featData;
			actions = actionData;
			loading = false;
		} catch (error) {
			console.error('Failed to load builder data:', error);
			loading = false;
		}
	});

	// Cached feat arrays (computed once when feats load, not on every access)
	let classFeats = $derived(feats.filter((feat) => feat.category === 'class'));
	let ancestryFeats = $derived(feats.filter((feat) => feat.category === 'ancestry'));
	let skillFeats = $derived(feats.filter((feat) => feat.category === 'skill'));
	let generalFeats = $derived(feats.filter((feat) => feat.category === 'general'));
	let archetypeFeats = $derived(feats.filter((feat) => feat.traits.includes('archetype')));

	// Set context with data and cached feat arrays
	setBuilderDataContext({
		get ancestries() { return ancestries; },
		get heritages() { return heritages; },
		get backgrounds() { return backgrounds; },
		get classes() { return classes; },
		get feats() { return feats; },
		get actions() { return actions; },
		get loading() { return loading; },
		// Legacy loading states - all point to same loading state for backward compatibility
		get criticalDataLoading() { return loading; },
		get heritagesLoading() { return loading; },
		get featsLoading() { return loading; },
		getClassFeats: () => classFeats,
		getAncestryFeats: () => ancestryFeats,
		getSkillFeats: () => skillFeats,
		getGeneralFeats: () => generalFeats,
		getArchetypeFeats: () => archetypeFeats
	});

	interface Tab {
		label: string;
		href: string;
		description: string;
	}

	const tabs: Tab[] = [
		{ label: 'General', href: '/builder/general', description: 'Name, ancestry, background, and class' },
		{ label: 'Stats', href: '/builder/stats', description: 'Ability scores and skills' },
		{ label: 'Feats', href: '/builder/feats', description: 'Class feats and general feats' },
		{ label: 'Equipment', href: '/builder/equipment', description: 'Weapons, armor, and gear' },
		{ label: 'Spells', href: '/builder/spells', description: 'Spellcasting and spells known' },
		{ label: 'Actions', href: '/builder/actions', description: 'Basic and skill actions' },
		{ label: 'Planning', href: '/builder/planning', description: 'Level progression planning' }
	];

	const isActiveTab = (tabHref: string): boolean => {
		return $page.url.pathname === tabHref || $page.url.pathname.startsWith(tabHref + '/');
	};

	function handleTabClick() {
		mobileMenuOpen = false;
	}
</script>

<svelte:head>
	<title>Character Builder - PF2e Character Builder</title>
</svelte:head>

<div class="builder-shell">
	<div class="builder-container">
		<nav class="builder-tabs" aria-label="Character builder sections">
			<!-- Mobile menu button -->
			<button
				class="mobile-menu-button"
				onclick={() => (mobileMenuOpen = true)}
				aria-label="Open navigation menu"
				aria-expanded={mobileMenuOpen}
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M3 12H21M3 6H21M3 18H21"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<span>Menu</span>
			</button>

			<!-- Desktop tabs -->
			<ul role="tablist" class="desktop-tabs">
				{#each tabs as tab}
					<li role="presentation">
						<a
							href={tab.href}
							role="tab"
							aria-selected={isActiveTab(tab.href)}
							aria-current={isActiveTab(tab.href) ? 'page' : undefined}
							class="tab"
							class:active={isActiveTab(tab.href)}
							title={tab.description}
						>
							{tab.label}
						</a>
					</li>
				{/each}
			</ul>

			<!-- Variant Rules button (desktop) -->
			<button
				class="variant-rules-button"
				onclick={() => (variantRulesOpen = true)}
				aria-label="Open variant rules settings"
				title="Variant Rules"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<span class="variant-rules-label">Variant Rules</span>
			</button>

			<!-- Mobile effects button -->
			<button
				class="mobile-effects-button"
				onclick={() => (effectsPanelOpen = true)}
				aria-label="Open active effects"
				aria-expanded={effectsPanelOpen}
				title="Active Effects"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</nav>

		<!-- Content area with sidebar layout -->
		<div class="builder-layout">
			<main class="builder-content">
				{@render children()}
			</main>

			<!-- Desktop sidebar -->
			<aside class="effects-sidebar" aria-label="Active effects">
				<ActiveEffectsPanel />
			</aside>
		</div>
	</div>
</div>

<!-- Mobile navigation drawer -->
<Drawer bind:open={mobileMenuOpen} position="left" title="Navigation">
	<div class="mobile-nav">
		<h2 class="mobile-nav-title">Character Builder</h2>
		<nav aria-label="Character builder sections">
			<ul class="mobile-nav-list">
				{#each tabs as tab}
					<li>
						<a
							href={tab.href}
							class="mobile-nav-item"
							class:active={isActiveTab(tab.href)}
							aria-current={isActiveTab(tab.href) ? 'page' : undefined}
							onclick={handleTabClick}
						>
							<span class="mobile-nav-label">{tab.label}</span>
							<span class="mobile-nav-description">{tab.description}</span>
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<!-- Separator and Variant Rules button -->
		<hr class="mobile-nav-separator" />
		<button
			class="mobile-variant-rules-button"
			onclick={() => { mobileMenuOpen = false; variantRulesOpen = true; }}
		>
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			<span>Variant Rules</span>
		</button>
	</div>
</Drawer>

<!-- Mobile effects drawer -->
<Drawer bind:open={effectsPanelOpen} position="right" title="Active Effects">
	<ActiveEffectsPanel compact={true} />
</Drawer>

<!-- Variant Rules Settings Modal -->
<VariantRulesSettingsModal bind:open={variantRulesOpen} />

<style>
	.builder-shell {
		width: 100%;
		min-height: calc(100vh - 4rem - 200px); /* Adjust for header and footer */
	}

	.builder-container {
		max-width: 1600px; /* Increased for sidebar */
		margin: 0 auto;
		padding: 0;
	}

	/* Tabs Navigation */
	.builder-tabs {
		background-color: var(--surface-1, #ffffff);
		border-bottom: 2px solid var(--border-color, #e0e0e0);
		position: sticky;
		top: 4rem; /* Height of header */
		z-index: 50;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 1rem;
	}

	/* Mobile menu button */
	.mobile-menu-button {
		display: none;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: none;
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-family: inherit;
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--text-primary, #1a1a1a);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.mobile-menu-button:hover,
	.mobile-effects-button:hover {
		background-color: var(--surface-2, #f5f5f5);
	}

	.mobile-menu-button:focus-visible,
	.mobile-effects-button:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	.mobile-effects-button {
		display: none;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		padding: 0.5rem;
		background: none;
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		color: var(--text-primary, #1a1a1a);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	/* Variant Rules button (desktop) */
	.variant-rules-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: none;
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
		cursor: pointer;
		transition: all var(--transition-fast);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.variant-rules-button:hover {
		background-color: var(--surface-2, #f5f5f5);
		color: var(--text-primary, #1a1a1a);
	}

	.variant-rules-button:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	.variant-rules-label {
		display: inline;
	}

	.desktop-tabs {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		gap: 0;
		overflow-x: auto;
		scrollbar-width: thin;
		flex: 1;
	}

	.desktop-tabs::-webkit-scrollbar {
		height: 4px;
	}

	.desktop-tabs::-webkit-scrollbar-track {
		background: var(--surface-2, #f5f5f5);
	}

	.desktop-tabs::-webkit-scrollbar-thumb {
		background: var(--border-color, #e0e0e0);
		border-radius: 2px;
	}

	.desktop-tabs li {
		margin: 0;
		flex-shrink: 0;
	}

	.tab {
		display: block;
		padding: 1rem 1.5rem;
		color: var(--text-secondary, #666666);
		text-decoration: none;
		font-weight: 500;
		border-bottom: 3px solid transparent;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.tab:hover {
		color: var(--text-primary, #1a1a1a);
		background-color: var(--surface-2, #f5f5f5);
	}

	.tab:focus {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: -2px;
		z-index: 1;
	}

	.tab.active {
		color: var(--link-color, #5c7cfa);
		border-bottom-color: var(--link-color, #5c7cfa);
		font-weight: 600;
	}

	/* Layout with sidebar */
	.builder-layout {
		display: grid;
		grid-template-columns: 1fr 350px;
		min-height: calc(100vh - 4rem - 200px - 58px); /* Minus header, footer, tabs */
	}

	/* Builder Content */
	.builder-content {
		padding: 2rem 1rem;
		background-color: var(--surface-1, #ffffff);
		overflow-y: auto;
	}

	/* Effects Sidebar (Desktop) */
	.effects-sidebar {
		display: block;
		position: sticky;
		top: calc(4rem + 58px); /* Header + tabs height */
		height: calc(100vh - 4rem - 58px); /* Full height minus header and tabs */
		overflow: hidden;
	}

	/* Mobile Navigation Drawer */
	.mobile-nav {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.mobile-nav-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.mobile-nav-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.mobile-nav-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1rem;
		text-decoration: none;
		border-radius: 8px;
		background-color: var(--surface-2, #f5f5f5);
		transition: all var(--transition-fast);
	}

	.mobile-nav-item:hover {
		background-color: var(--surface-3, #e0e0e0);
	}

	.mobile-nav-item.active {
		background-color: rgba(92, 124, 250, 0.1);
		border-left: 4px solid var(--link-color, #5c7cfa);
	}

	.mobile-nav-label {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.mobile-nav-item.active .mobile-nav-label {
		color: var(--link-color, #5c7cfa);
	}

	.mobile-nav-description {
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
	}

	/* Mobile navigation separator and variant rules button */
	.mobile-nav-separator {
		border: none;
		border-top: 1px solid var(--border-color, #e0e0e0);
		margin: 1rem 0;
	}

	.mobile-variant-rules-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border: none;
		border-radius: 8px;
		font-family: inherit;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.mobile-variant-rules-button:hover {
		background-color: var(--surface-3, #e0e0e0);
	}

	.mobile-variant-rules-button:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	/* Responsive Design */
	@media (max-width: 1024px) {
		.builder-layout {
			grid-template-columns: 1fr; /* Single column on tablets/mobile */
		}

		.effects-sidebar {
			display: none; /* Hide sidebar on smaller screens, use drawer instead */
		}

		.mobile-effects-button {
			display: flex; /* Show effects button on smaller screens */
		}
	}

	@media (max-width: 768px) {
		.builder-tabs {
			top: 0; /* Mobile might have different header */
		}

		.mobile-menu-button {
			display: flex;
		}

		.desktop-tabs {
			display: none;
		}

		/* Hide desktop variant rules button on mobile - use mobile nav instead */
		.variant-rules-button {
			display: none;
		}

		.builder-content {
			padding: 1.5rem 1rem;
		}
	}

	/* On medium screens, hide the label but keep the icon */
	@media (max-width: 900px) and (min-width: 769px) {
		.variant-rules-label {
			display: none;
		}

		.variant-rules-button {
			padding: 0.5rem;
			width: 40px;
			height: 40px;
			justify-content: center;
		}
	}

	@media (min-width: 769px) {
		.mobile-menu-button {
			display: none;
		}
	}

	@media (prefers-contrast: high) {
		.builder-tabs {
			border-bottom: 3px solid var(--border-color, #000000);
		}

		.tab {
			border: 1px solid transparent;
		}

		.tab.active {
			border: 1px solid var(--link-color, #000000);
			border-bottom: 3px solid var(--link-color, #000000);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tab {
			transition: none;
		}
	}
</style>
