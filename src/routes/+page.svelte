<svelte:head>
	<title>PF2e Character Builder</title>
	<meta name="description" content="Create and manage your Pathfinder 2e characters with our accessible, open-source character builder." />
</svelte:head>

<div class="landing-page">
	<section class="hero" aria-labelledby="hero-title">
		<div class="hero-content">
			<h1 id="hero-title" class="hero-title">
				Pathfinder 2e Character Builder
			</h1>
			<p class="hero-subtitle">
				Create, manage, and export your Pathfinder 2e characters with a modern, accessible interface.
			</p>
			<div class="hero-actions">
				<a href="/builder/general" class="button button-primary">
					Start Building
				</a>
				<a href="/changelog" class="button button-secondary">
					View Changelog
				</a>
			</div>
		</div>
	</section>

	<section class="features" aria-labelledby="features-title">
		<div class="features-content">
			<h2 id="features-title" class="section-title">Features</h2>

			<div class="features-grid">
				<article class="feature-card">
					<div class="feature-icon" aria-hidden="true">♿</div>
					<h3 class="feature-title">Accessible</h3>
					<p class="feature-description">
						Built with accessibility in mind. Full keyboard navigation, screen reader support, and high contrast mode.
					</p>
				</article>

				<article class="feature-card">
					<div class="feature-icon" aria-hidden="true">📱</div>
					<h3 class="feature-title">Progressive Web App</h3>
					<p class="feature-description">
						Install as a PWA for offline access. Your characters are saved locally and always available.
					</p>
				</article>

				<article class="feature-card">
					<div class="feature-icon" aria-hidden="true">📊</div>
					<h3 class="feature-title">Complete Rule Support</h3>
					<p class="feature-description">
						Implements PF2e rules including modifiers, conditions, and character progression.
					</p>
				</article>

				<article class="feature-card">
					<div class="feature-icon" aria-hidden="true">💾</div>
					<h3 class="feature-title">Export & Import</h3>
					<p class="feature-description">
						Export your characters as JSON for backup or sharing. Import characters from files.
					</p>
				</article>

				<article class="feature-card">
					<div class="feature-icon" aria-hidden="true">🎨</div>
					<h3 class="feature-title">Modern Interface</h3>
					<p class="feature-description">
						Clean, responsive design that works on desktop, tablet, and mobile devices.
					</p>
				</article>

				<article class="feature-card">
					<div class="feature-icon" aria-hidden="true">🔓</div>
					<h3 class="feature-title">Open Source</h3>
					<p class="feature-description">
						Free and open source. Data sourced from Foundry VTT PF2e System under Apache 2.0 license.
					</p>
				</article>
			</div>
		</div>
	</section>

	<section class="cta" aria-labelledby="cta-title">
		<div class="cta-content">
			<h2 id="cta-title" class="cta-title">Ready to create your character?</h2>
			<p class="cta-description">
				Start building your Pathfinder 2e character now. No account required.
			</p>
			<a href="/builder/general" class="button button-primary button-large">
				Launch Character Builder
			</a>
		</div>
	</section>

	<section class="legal-notice" aria-labelledby="legal-title">
		<div class="legal-content">
			<h2 id="legal-title" class="visually-hidden">Legal Information</h2>
			<p>
				This is an independent product and is not affiliated with Paizo Inc.
				Pathfinder is a trademark of Paizo Inc.
				Game data is sourced from the <a href="https://github.com/foundryvtt/pf2e" target="_blank" rel="noopener noreferrer">Foundry VTT PF2e System</a> under the Apache 2.0 license.
			</p>
			<p>
				<a href="/legal">View full legal information and licenses</a>
			</p>
		</div>
	</section>
</div>

<style>
	.landing-page {
		width: 100%;
	}

	/* Hero Section */
	.hero {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 4rem 1rem;
		text-align: center;
	}

	.hero-content {
		max-width: 800px;
		margin: 0 auto;
	}

	.hero-title {
		font-size: 2.5rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		line-height: 1.2;
	}

	.hero-subtitle {
		font-size: 1.25rem;
		margin: 0 0 2rem 0;
		opacity: 0.95;
		line-height: 1.6;
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	/* Buttons */
	.button {
		display: inline-block;
		padding: 0.875rem 2rem;
		border-radius: 8px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s ease;
		cursor: pointer;
		border: 2px solid transparent;
	}

	.button:focus {
		outline: 2px solid white;
		outline-offset: 4px;
	}

	.button-primary {
		background-color: white;
		color: #667eea;
	}

	.button-primary:hover {
		background-color: #f8f9fa;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.button-secondary {
		background-color: transparent;
		color: white;
		border-color: white;
	}

	.button-secondary:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.button-large {
		padding: 1rem 2.5rem;
		font-size: 1.125rem;
	}

	/* Features Section */
	.features {
		padding: 4rem 1rem;
		background-color: var(--surface-1, #ffffff);
	}

	.features-content {
		max-width: 1200px;
		margin: 0 auto;
	}

	.section-title {
		font-size: 2rem;
		font-weight: 700;
		text-align: center;
		margin: 0 0 3rem 0;
		color: var(--text-primary, #1a1a1a);
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.feature-card {
		padding: 2rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 12px;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.feature-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
	}

	.feature-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.feature-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 0.75rem 0;
		color: var(--text-primary, #1a1a1a);
	}

	.feature-description {
		margin: 0;
		color: var(--text-secondary, #666666);
		line-height: 1.6;
	}

	/* CTA Section */
	.cta {
		padding: 4rem 1rem;
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		color: white;
		text-align: center;
	}

	.cta-content {
		max-width: 800px;
		margin: 0 auto;
	}

	.cta-title {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
	}

	.cta-description {
		font-size: 1.125rem;
		margin: 0 0 2rem 0;
		opacity: 0.95;
	}

	/* Legal Notice */
	.legal-notice {
		padding: 3rem 1rem;
		background-color: var(--surface-2, #f5f5f5);
	}

	.legal-content {
		max-width: 800px;
		margin: 0 auto;
		text-align: center;
	}

	.legal-content p {
		margin: 0 0 1rem 0;
		color: var(--text-secondary, #666666);
		font-size: 0.875rem;
		line-height: 1.6;
	}

	.legal-content a {
		color: var(--link-color, #5c7cfa);
		text-decoration: none;
	}

	.legal-content a:hover {
		text-decoration: underline;
	}

	.legal-content a:focus {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
		border-radius: 2px;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.hero-title {
			font-size: 2rem;
		}

		.hero-subtitle {
			font-size: 1.125rem;
		}

		.section-title {
			font-size: 1.75rem;
		}

		.cta-title {
			font-size: 1.75rem;
		}

		.features-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (prefers-contrast: high) {
		.hero {
			background: #000000;
			border-bottom: 3px solid #ffffff;
		}

		.cta {
			background: #000000;
			border-top: 3px solid #ffffff;
			border-bottom: 3px solid #ffffff;
		}

		.feature-card {
			border: 2px solid var(--border-color, #000000);
		}
	}
</style>
