<script lang="ts">
	import { page } from '$app/stores';

	const isBuilderRoute = $derived($page.url.pathname.startsWith('/builder'));
</script>

<header class="app-header">
	<div class="header-content">
		<div class="header-brand">
			<a href="/" class="brand-link">
				<span class="brand-name">PF2e Character Builder</span>
			</a>
		</div>

		<nav id="main-nav" class="header-nav" aria-label="Main navigation">
			<ul>
				<li>
					<a href="/" class:active={$page.url.pathname === '/'} aria-current={$page.url.pathname === '/' ? 'page' : undefined}>
						Home
					</a>
				</li>
				<li>
					<a href="/builder/general" class:active={isBuilderRoute} aria-current={isBuilderRoute ? 'page' : undefined}>
						Character Builder
					</a>
				</li>
				<li>
					<a href="/changelog" class:active={$page.url.pathname === '/changelog'} aria-current={$page.url.pathname === '/changelog' ? 'page' : undefined}>
						Changelog
					</a>
				</li>
			</ul>
		</nav>
	</div>
</header>

<style>
	.app-header {
		background-color: var(--surface-1, #ffffff);
		border-bottom: 1px solid var(--border-color, #e0e0e0);
		position: sticky;
		top: 0;
		z-index: 100;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.header-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 4rem;
	}

	.header-brand {
		display: flex;
		align-items: center;
	}

	.brand-link {
		text-decoration: none;
		color: inherit;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		transition: opacity 0.2s ease;
	}

	.brand-link:hover {
		opacity: 0.8;
	}

	.brand-link:focus {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 4px;
		border-radius: 4px;
	}

	.brand-name {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
		letter-spacing: -0.025em;
	}

	.header-nav ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.header-nav li {
		margin: 0;
	}

	.header-nav a {
		color: var(--text-secondary, #666666);
		text-decoration: none;
		font-weight: 500;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		transition: all 0.2s ease;
		display: block;
	}

	.header-nav a:hover {
		color: var(--text-primary, #1a1a1a);
		background-color: var(--surface-2, #f5f5f5);
	}

	.header-nav a:focus {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	.header-nav a.active {
		color: var(--link-color, #5c7cfa);
		background-color: var(--surface-2, #f5f5f5);
	}

	@media (max-width: 640px) {
		.header-content {
			flex-direction: column;
			gap: 1rem;
			padding: 1rem;
		}

		.brand-name {
			font-size: 1.125rem;
		}

		.header-nav ul {
			gap: 0.5rem;
		}

		.header-nav a {
			padding: 0.5rem 0.75rem;
			font-size: 0.875rem;
		}
	}

	@media (prefers-contrast: high) {
		.app-header {
			border-bottom: 2px solid var(--border-color, #000000);
		}

		.header-nav a {
			border: 1px solid transparent;
		}

		.header-nav a.active {
			border-color: var(--link-color, #000000);
		}
	}
</style>
