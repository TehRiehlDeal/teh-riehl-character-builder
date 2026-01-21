<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		document.title = 'Legal & Licenses | PF2e Character Builder';
	});
</script>

<svelte:head>
	<meta name="description" content="Legal notices and license information for PF2e Character Builder" />
</svelte:head>

<main class="legal-page">
	<div class="container">
		<h1>Legal & Licenses</h1>

		<section aria-labelledby="orc-license-heading">
			<h2 id="orc-license-heading">ORC License</h2>

			<div class="license-notice">
				<h3>License Statement</h3>
				<p>
					This product is licensed under the ORC License held in the Library of Congress and
					available at <a href="https://paizo.com/orclicense" target="_blank" rel="noopener noreferrer">paizo.com/orclicense</a>
					and <a href="https://azoralaw.com/orclicense" target="_blank" rel="noopener noreferrer">azoralaw.com/orclicense</a>.
				</p>
			</div>

			<div class="attribution-notice">
				<h3>Attribution Notice</h3>
				<p>This application uses game content from the following ORC-licensed sources:</p>
				<ul>
					<li>
						<strong>Pathfinder Player Core</strong> © 2023 Paizo Inc.<br />
						Designed by Logan Bonner, Jason Bulmahn, Stephen Radney-MacFarland, Mark Seifter
					</li>
					<li>
						<strong>Pathfinder Player Core 2</strong> © 2024 Paizo Inc.<br />
						Designed by Alexander Augunas, Kate Baker, Logan Bonner, Jason Bulmahn, Carlos Cabrera,
						Jeremy Corff, Jesse Decker, Fabby Garza Marroquín, Steven Hammond, Sasha Laranoa Harving,
						Joan Hong, Vanessa Hoskins, James Jacobs, Jenny Jarzabski, Erik Keith, Dustin Knight,
						Lyz Liddell, Luis Loza, Patchen Mortimer, Dennis Muldoon, Stephen Radney-MacFarland,
						Mikhail Rekun, David N. Ross, Michael Sayre, Mark Seifter, Kendra Leigh Speedling,
						Mark Thompson, Andrew White, Landon Winkler, and Linda Zayas-Palmer
					</li>
					<li>
						<strong>Pathfinder GM Core</strong> © 2023 Paizo Inc.<br />
						Designed by Logan Bonner and Mark Seifter
					</li>
				</ul>
			</div>

			<div class="reserved-material-notice">
				<h3>Reserved Material</h3>
				<p>
					All trademarks, registered trademarks, proper nouns (characters, deities, locations, etc.,
					as well as all adjectives, names, titles, and descriptive terms derived from proper nouns),
					artworks, characters, dialogue, locations, organizations, plots, storylines, and trade dress
					are Reserved Material under the ORC License.
				</p>
			</div>

			<div class="licensed-material-declaration">
				<h3>Licensed Material Declaration</h3>
				<p>
					This application does not introduce new ORC-licensed content. All mechanical data and game
					rules are derived from the sources listed above.
				</p>
			</div>
		</section>

		<section aria-labelledby="foundry-license-heading">
			<h2 id="foundry-license-heading">Foundry VTT Data (Apache 2.0)</h2>

			<div class="license-notice">
				<p>
					This application uses character data extracted from the
					<a href="https://github.com/foundryvtt/pf2e" target="_blank" rel="noopener noreferrer">Foundry VTT PF2e System</a>,
					which is licensed under the Apache License 2.0.
				</p>
				<p>
					<strong>Attribution:</strong> Character data structure and rule elements are derived from
					the Foundry Virtual Tabletop PF2e System.<br />
					Copyright © Foundry Gaming LLC
				</p>
				<p>
					Licensed under the Apache License, Version 2.0 (the "License");
					you may not use this file except in compliance with the License.
					You may obtain a copy of the License at:
				</p>
				<p>
					<a href="http://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer">
						http://www.apache.org/licenses/LICENSE-2.0
					</a>
				</p>
				<p>
					Unless required by applicable law or agreed to in writing, software
					distributed under the License is distributed on an "AS IS" BASIS,
					WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
					See the License for the specific language governing permissions and
					limitations under the License.
				</p>
			</div>
		</section>

		<section aria-labelledby="app-license-heading">
			<h2 id="app-license-heading">Application License</h2>

			<div class="license-notice">
				<p>
					The PF2e Character Builder application code (excluding game content and data) is licensed
					under the Apache License 2.0.
				</p>
				<p>
					Full license text available in the
					<a href="https://github.com/your-repo/teh-riehl-character-builder/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">
						LICENSE file
					</a>
					in the project repository.
				</p>
			</div>
		</section>

		<section aria-labelledby="disclaimer-heading">
			<h2 id="disclaimer-heading">Disclaimer</h2>

			<div class="disclaimer">
				<p>
					This is an independent product and is not affiliated with, endorsed, or sponsored by
					Paizo Inc., Foundry Gaming LLC, or any other entity.
				</p>
				<p>
					Pathfinder and associated marks and logos are trademarks of Paizo Inc.
				</p>
			</div>
		</section>
	</div>
</main>

<style>
	.legal-page {
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
		margin-bottom: 2rem;
		color: var(--text-primary, #1a1a1a);
		border-bottom: 2px solid var(--border-color, #e0e0e0);
		padding-bottom: 1rem;
	}

	h2 {
		font-size: 1.75rem;
		margin-top: 3rem;
		margin-bottom: 1.5rem;
		color: var(--text-primary, #1a1a1a);
	}

	h3 {
		font-size: 1.25rem;
		margin-top: 1.5rem;
		margin-bottom: 1rem;
		color: var(--text-secondary, #333333);
	}

	section {
		margin-bottom: 2rem;
	}

	.license-notice,
	.attribution-notice,
	.reserved-material-notice,
	.licensed-material-declaration,
	.disclaimer {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: var(--surface-2, #f9f9f9);
		border-left: 4px solid var(--accent-color, #5c7cfa);
		border-radius: 4px;
	}

	p {
		line-height: 1.6;
		margin-bottom: 0.75rem;
		color: var(--text-primary, #1a1a1a);
	}

	p:last-child {
		margin-bottom: 0;
	}

	a {
		color: var(--link-color, #5c7cfa);
		text-decoration: underline;
	}

	a:hover,
	a:focus {
		color: var(--link-hover-color, #4263eb);
		text-decoration: none;
	}

	a:focus {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	ul {
		margin: 1rem 0;
		padding-left: 1.5rem;
		line-height: 1.8;
	}

	li {
		margin-bottom: 1rem;
	}

	strong {
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	@media (max-width: 768px) {
		.legal-page {
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

		h3 {
			font-size: 1.125rem;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.container {
			border: 2px solid var(--border-color, #000000);
		}

		.license-notice,
		.attribution-notice,
		.reserved-material-notice,
		.licensed-material-declaration,
		.disclaimer {
			border-left-width: 6px;
		}
	}
</style>
