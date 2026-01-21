<script lang="ts">
	/**
	 * Builder Layout - Data Loading & Caching Strategy
	 *
	 * PERFORMANCE OPTIMIZATION:
	 * This layout implements a multi-layer caching strategy to ensure game data
	 * is loaded only once, regardless of tab switching:
	 *
	 * Layer 1: Repository-level caching
	 *   - Each repository (ancestryRepository, featRepository, etc.) has an in-memory cache
	 *   - Data is loaded from JSON files only on the first call
	 *   - Subsequent calls return the cached data instantly
	 *
	 * Layer 2: Layout-level state
	 *   - Data is loaded once in onMount() when the layout first renders
	 *   - The layout persists when navigating between child routes (tabs)
	 *   - onMount() does NOT re-run when switching tabs
	 *
	 * Layer 3: Context sharing
	 *   - Loaded data is shared via Svelte context to all child pages
	 *   - Child pages access data via getBuilderDataContext()
	 *   - No data fetching happens at the page level
	 *
	 * Result: Data loads once when you first visit /builder, then tab switching
	 * is instant because all data is already in memory.
	 */

	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Drawer from '$lib/components/common/Drawer.svelte';
	import ActiveEffectsPanel from '$lib/components/features/ActiveEffectsPanel.svelte';
	import { ancestryLoader, heritageLoader, backgroundLoader, classLoader, featLoader } from '$lib/data/loaders';
	import { setBuilderDataContext, type BuilderData } from '$lib/contexts/builderDataContext.svelte';
	import type { Ancestry, Heritage, Background, Class, Feat } from '$lib/data/types/app';

	let { children } = $props();

	let mobileMenuOpen = $state(false);
	let effectsPanelOpen = $state(false);

	// Shared data state for all builder pages
	let ancestries = $state<Ancestry[]>([]);
	let heritages = $state<Heritage[]>([]);
	let backgrounds = $state<Background[]>([]);
	let classes = $state<Class[]>([]);
	let feats = $state<Feat[]>([]);

	let criticalDataLoading = $state(true);
	let heritagesLoading = $state(true);
	let featsLoading = $state(true);

	// Flag to ensure data only loads once (defensive against potential double-mounts)
	let dataLoaded = false;

	// Load data once for all builder pages
	// This only runs when the layout first mounts, NOT when switching between tabs
	onMount(async () => {
		// Defensive check: if data is already loaded, don't load again
		if (dataLoaded) {
			console.log('[Builder Layout] Data already loaded, skipping reload');
			return;
		}

		console.log('[Builder Layout] Loading game data for the first time...');
		const startTime = performance.now();
		dataLoaded = true;

		try {
			// PHASE 1: Load critical data (ancestries, backgrounds, classes)
			console.log('[Builder Layout] Phase 1: Loading critical data...');
			const [ancestryData, backgroundData, classData] = await Promise.all([
				ancestryLoader.loadAll(),
				backgroundLoader.loadAll(),
				classLoader.loadAll()
			]);

			ancestries = ancestryData;
			backgrounds = backgroundData;
			classes = classData;
			criticalDataLoading = false;

			const phase1Time = performance.now() - startTime;
			console.log(`[Builder Layout] Phase 1 complete (${phase1Time.toFixed(0)}ms): ${ancestryData.length} ancestries, ${backgroundData.length} backgrounds, ${classData.length} classes`);

			// PHASE 2: Load heritages in background
			console.log('[Builder Layout] Phase 2: Loading heritages...');
			heritageLoader.loadAll().then((heritageData) => {
				heritages = heritageData;
				heritagesLoading = false;
				const phase2Time = performance.now() - startTime;
				console.log(`[Builder Layout] Phase 2 complete (${phase2Time.toFixed(0)}ms): ${heritageData.length} heritages`);
			}).catch((error) => {
				console.error('Failed to load heritages:', error);
				heritagesLoading = false;
			});

			// PHASE 3: Load feats in background
			console.log('[Builder Layout] Phase 3: Loading feats...');
			featLoader.loadAll().then((featData) => {
				feats = featData;
				featsLoading = false;
				const phase3Time = performance.now() - startTime;
				console.log(`[Builder Layout] Phase 3 complete (${phase3Time.toFixed(0)}ms): ${featData.length} feats`);
				console.log(`[Builder Layout] ✅ All data loaded successfully in ${phase3Time.toFixed(0)}ms`);
			}).catch((error) => {
				console.error('Failed to load feats:', error);
				featsLoading = false;
			});
		} catch (error) {
			console.error('Failed to load critical builder data:', error);
			criticalDataLoading = false;
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
		get criticalDataLoading() { return criticalDataLoading; },
		get heritagesLoading() { return heritagesLoading; },
		get featsLoading() { return featsLoading; },
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
		{ label: 'Planning', href: '/builder/planning', description: 'Level progression planning' }
	];

	const isActiveTab = (tabHref: string): boolean => {
		return $page.url.pathname === tabHref || $page.url.pathname.startsWith(tabHref + '/');
	};

	function handleTabClick() {
		mobileMenuOpen = false;
	}

	function handleEffectsClose() {
		effectsPanelOpen = false;
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
	</div>
</Drawer>

<!-- Mobile effects drawer -->
<Drawer bind:open={effectsPanelOpen} position="right" title="Active Effects">
	<ActiveEffectsPanel compact={true} />
</Drawer>

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

		.builder-content {
			padding: 1.5rem 1rem;
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
