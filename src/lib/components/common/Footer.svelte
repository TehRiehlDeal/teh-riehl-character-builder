<script lang="ts">
	const currentYear = new Date().getFullYear();
</script>

<footer class="app-footer">
	<div class="footer-content">
		<div class="footer-section">
			<p class="copyright">
				© {currentYear} PF2e Character Builder
			</p>
		</div>

		<nav class="footer-nav" aria-label="Footer navigation">
			<ul>
				<li>
					<a href="/changelog">Changelog</a>
				</li>
				<li>
					<a href="/legal">Legal & Licenses</a>
				</li>
			</ul>
		</nav>

		<div class="footer-section disclaimer">
			<p>
				This is an independent product and is not affiliated with Paizo Inc.
				Pathfinder is a trademark of Paizo Inc.
			</p>
		</div>
	</div>
</footer>

<style>
	.app-footer {
		background-color: var(--surface-2, #f5f5f5);
		border-top: 1px solid var(--border-color, #e0e0e0);
		padding: 2rem 1rem;
		margin-top: auto;
	}

	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		align-items: center;
		text-align: center;
	}

	.footer-section {
		color: var(--text-secondary, #666666);
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.footer-section p {
		margin: 0;
	}

	.copyright {
		font-weight: 500;
		color: var(--text-primary, #1a1a1a);
	}

	.footer-nav ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.footer-nav li {
		margin: 0;
	}

	.footer-nav a {
		color: var(--link-color, #5c7cfa);
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s ease;
	}

	.footer-nav a:hover {
		color: var(--link-hover-color, #4263eb);
		text-decoration: underline;
	}

	.footer-nav a:focus {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
		border-radius: 2px;
	}

	.disclaimer {
		font-size: 0.8125rem;
		font-style: italic;
	}

	@media (min-width: 768px) {
		.footer-content {
			flex-direction: row;
			justify-content: space-between;
			text-align: left;
		}

		.footer-nav {
			order: 2;
		}

		.disclaimer {
			order: 3;
			text-align: right;
			max-width: 300px;
		}
	}

	@media (prefers-contrast: high) {
		.app-footer {
			border-top: 2px solid var(--border-color, #000000);
		}
	}
</style>
