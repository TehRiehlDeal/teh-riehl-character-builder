<script lang="ts">
	import { onMount } from 'svelte';
	import { getVersionHistory, getCurrentDataVersion } from '$lib/data/versioning/version';

	const versionHistory = getVersionHistory();
	const currentVersion = getCurrentDataVersion();

	onMount(() => {
		document.title = 'Changelog | PF2e Character Builder';
	});

	/**
	 * Format an ISO date string for display
	 */
	function formatDate(isoDate: string): string {
		const date = new Date(isoDate);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	/**
	 * Get short commit hash for display
	 */
	function shortCommit(hash: string): string {
		return hash.substring(0, 8);
	}
</script>

<svelte:head>
	<meta name="description" content="Data version changelog for PF2e Character Builder" />
</svelte:head>

<main class="changelog-page">
	<div class="container">
		<h1>Data Changelog</h1>

		<p class="intro">
			This page tracks updates to the game data imported from the Foundry VTT PF2e System. When
			new content is added or existing content is updated, the data version is incremented and
			changes are documented here.
		</p>

		<div class="current-version">
			<h2>Current Data Version</h2>
			<p class="version-badge">
				<strong>{currentVersion}</strong>
			</p>
		</div>

		<div class="version-history">
			<h2>Version History</h2>

			{#each versionHistory as version}
				<article class="version-entry" aria-labelledby="version-{version.version}">
					<header class="version-header">
						<h3 id="version-{version.version}" class="version-number">
							{version.version}
							{#if version.version === currentVersion}
								<span class="badge current">Current</span>
							{/if}
						</h3>
						<div class="version-meta">
							<time datetime={version.importDate}>
								{formatDate(version.importDate)}
							</time>
							<span class="commit">
								Foundry Commit:
								<a
									href="https://github.com/foundryvtt/pf2e/commit/{version.foundryCommit}"
									target="_blank"
									rel="noopener noreferrer"
								>
									{shortCommit(version.foundryCommit)}
								</a>
							</span>
						</div>
					</header>

					<div class="changes">
						<h4>Changes</h4>
						<ul>
							{#each version.changes as change}
								<li>{change}</li>
							{/each}
						</ul>
					</div>
				</article>
			{/each}
		</div>

		<div class="notice">
			<h3>About Data Updates</h3>
			<p>
				Game data is sourced from the <a
					href="https://github.com/foundryvtt/pf2e"
					target="_blank"
					rel="noopener noreferrer">Foundry VTT PF2e System</a
				>, which is regularly updated to include new content from Paizo and corrections based on
				errata.
			</p>
			<p>
				Characters created with older data versions will be notified when updates affect their
				selections, allowing you to review and accept changes or keep your current selections.
			</p>
		</div>
	</div>
</main>

<style>
	.changelog-page {
		padding: 2rem 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.container {
		background: var(--surface-1, #ffffff);
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	h1 {
		font-size: 2.5rem;
		margin-bottom: 1rem;
		color: var(--text-primary, #1a1a1a);
		border-bottom: 2px solid var(--border-color, #e0e0e0);
		padding-bottom: 1rem;
	}

	h2 {
		font-size: 1.75rem;
		margin-top: 2rem;
		margin-bottom: 1rem;
		color: var(--text-primary, #1a1a1a);
	}

	h3 {
		font-size: 1.25rem;
		margin-bottom: 0.75rem;
		color: var(--text-primary, #1a1a1a);
	}

	h4 {
		font-size: 1rem;
		margin-bottom: 0.5rem;
		color: var(--text-secondary, #333333);
		font-weight: 600;
	}

	.intro {
		font-size: 1.125rem;
		line-height: 1.6;
		color: var(--text-secondary, #666666);
		margin-bottom: 2rem;
	}

	.current-version {
		background: var(--surface-2, #f9f9f9);
		padding: 1.5rem;
		border-radius: 6px;
		border-left: 4px solid var(--accent-color, #5c7cfa);
		margin-bottom: 2rem;
	}

	.current-version h2 {
		margin-top: 0;
		font-size: 1.25rem;
	}

	.version-badge {
		font-size: 1.5rem;
		margin: 0;
	}

	.version-badge strong {
		color: var(--accent-color, #5c7cfa);
		font-family: 'Courier New', monospace;
	}

	.version-history {
		margin-top: 3rem;
	}

	.version-entry {
		margin-bottom: 2.5rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--border-color, #e0e0e0);
	}

	.version-entry:last-child {
		border-bottom: none;
	}

	.version-header {
		margin-bottom: 1rem;
	}

	.version-number {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 0 0 0.5rem 0;
		font-family: 'Courier New', monospace;
		color: var(--text-primary, #1a1a1a);
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 12px;
		text-transform: uppercase;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.badge.current {
		background: var(--accent-color, #5c7cfa);
		color: white;
	}

	.version-meta {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
	}

	time {
		font-weight: 500;
	}

	.commit a {
		color: var(--link-color, #5c7cfa);
		text-decoration: none;
		font-family: 'Courier New', monospace;
	}

	.commit a:hover,
	.commit a:focus {
		text-decoration: underline;
	}

	.changes {
		margin-top: 1rem;
	}

	.changes ul {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0 0 0;
	}

	.changes li {
		padding: 0.5rem 0;
		padding-left: 1.5rem;
		position: relative;
		line-height: 1.6;
	}

	.changes li::before {
		content: '•';
		position: absolute;
		left: 0;
		color: var(--accent-color, #5c7cfa);
		font-weight: bold;
		font-size: 1.25rem;
	}

	.notice {
		margin-top: 3rem;
		padding: 1.5rem;
		background: var(--surface-2, #f9f9f9);
		border-radius: 6px;
	}

	.notice h3 {
		margin-top: 0;
	}

	.notice p {
		line-height: 1.6;
		margin-bottom: 0.75rem;
	}

	.notice p:last-child {
		margin-bottom: 0;
	}

	.notice a {
		color: var(--link-color, #5c7cfa);
		text-decoration: underline;
	}

	.notice a:hover,
	.notice a:focus {
		color: var(--link-hover-color, #4263eb);
	}

	@media (max-width: 768px) {
		.changelog-page {
			padding: 1rem 0.5rem;
		}

		.container {
			padding: 1.5rem 1rem;
		}

		h1 {
			font-size: 2rem;
		}

		h2 {
			font-size: 1.5rem;
		}

		.version-meta {
			flex-direction: column;
			gap: 0.5rem;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.container {
			border: 2px solid var(--border-color, #000000);
		}

		.version-entry {
			border-bottom: 2px solid var(--border-color, #000000);
		}
	}
</style>
