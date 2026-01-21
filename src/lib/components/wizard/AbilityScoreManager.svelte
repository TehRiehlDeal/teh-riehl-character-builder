<script lang="ts">
	import type { Ancestry, Background, Class } from '$lib/data/types/app';
	import AbilityBoostSelector from './AbilityBoostSelector.svelte';

	interface Props {
		/** Selected ancestry */
		ancestry?: Ancestry | null;
		/** Selected background */
		background?: Background | null;
		/** Selected class */
		selectedClass?: Class | null;
		/** Selected key ability */
		keyAbility?: string | null;
		/** Ancestry ability boost selections */
		ancestryBoosts?: (string | null)[];
		/** Background ability boost selections */
		backgroundBoosts?: (string | null)[];
		/** Free boost selections */
		freeBoosts?: (string | null)[];
		/** Callback when free boosts change */
		// eslint-disable-next-line no-unused-vars
		onFreeBoostsChange?: (boosts: (string | null)[]) => void;
	}

	let {
		ancestry = null,
		background = null,
		// selectedClass is available in Props but not currently used in calculations
		keyAbility = null,
		ancestryBoosts = [],
		backgroundBoosts = [],
		freeBoosts = [null, null, null, null],
		onFreeBoostsChange
	}: Props = $props();

	const ABILITIES = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
	const BASE_SCORE = 10;

	// Track ability scores and their sources
	interface AbilityScore {
		name: string;
		abbreviation: string;
		icon: string;
		baseScore: number;
		boosts: string[]; // Sources of boosts
		flaws: string[]; // Sources of flaws
		totalScore: number;
		modifier: number;
	}

	// Calculate ability scores with all boosts and flaws
	const abilityScores = $derived.by((): AbilityScore[] => {
		const scores: AbilityScore[] = ABILITIES.map((ability) => ({
			name: ability,
			abbreviation: getAbbreviation(ability),
			icon: getIcon(ability),
			baseScore: BASE_SCORE,
			boosts: [],
			flaws: [],
			totalScore: BASE_SCORE,
			modifier: 0
		}));

		// Apply ancestry boosts (fixed)
		if (ancestry && ancestry.boosts) {
			for (const boost of ancestry.boosts) {
				// Only apply fixed boosts (not free choice)
				if (!boost.free && boost.options.length === 1) {
					const abilityShort = boost.options[0].toLowerCase();
					// Map short form (str, dex, etc.) to full name
					const abilityMap: Record<string, string> = {
						str: 'Strength',
						dex: 'Dexterity',
						con: 'Constitution',
						int: 'Intelligence',
						wis: 'Wisdom',
						cha: 'Charisma'
					};
					const abilityName = abilityMap[abilityShort] || boost.options[0];
					const score = scores.find((s) => s.name === abilityName);
					if (score) score.boosts.push('Ancestry');
				}
			}
		}

		// Apply ancestry boosts (selected free/choice boosts)
		if (ancestryBoosts) {
			for (let i = 0; i < ancestryBoosts.length; i++) {
				const boost = ancestryBoosts[i];
				if (boost) {
					const score = scores.find((s) => s.name === boost);
					if (score) score.boosts.push('Ancestry');
				}
			}
		}

		// Apply ancestry flaws
		if (ancestry && ancestry.flaws) {
			for (const flaw of ancestry.flaws) {
				if (flaw.options.length > 0) {
					const abilityShort = flaw.options[0].toLowerCase();
					// Map short form to full name
					const abilityMap: Record<string, string> = {
						str: 'Strength',
						dex: 'Dexterity',
						con: 'Constitution',
						int: 'Intelligence',
						wis: 'Wisdom',
						cha: 'Charisma'
					};
					const abilityName = abilityMap[abilityShort] || flaw.options[0];
					const score = scores.find((s) => s.name === abilityName);
					if (score) score.flaws.push('Ancestry');
				}
			}
		}

		// Apply background boosts
		if (background && backgroundBoosts) {
			for (let i = 0; i < backgroundBoosts.length; i++) {
				const boost = backgroundBoosts[i];
				if (boost) {
					const score = scores.find((s) => s.name === boost);
					if (score) score.boosts.push('Background');
				}
			}
		}

		// Apply class key ability boost
		if (keyAbility) {
			const score = scores.find((s) => s.name === keyAbility);
			if (score) score.boosts.push('Class');
		}

		// Apply free boosts
		if (freeBoosts) {
			for (let i = 0; i < freeBoosts.length; i++) {
				const boost = freeBoosts[i];
				if (boost) {
					const score = scores.find((s) => s.name === boost);
					if (score) score.boosts.push(`Free ${i + 1}`);
				}
			}
		}

		// Calculate final scores and modifiers
		for (const score of scores) {
			// Each boost adds 2 to the score
			const totalBoosts = score.boosts.length;
			const totalFlaws = score.flaws.length;
			score.totalScore = BASE_SCORE + totalBoosts * 2 - totalFlaws * 2;
			score.modifier = Math.floor((score.totalScore - 10) / 2);
		}

		return scores;
	});

	function getAbbreviation(ability: string): string {
		const abbrev: Record<string, string> = {
			Strength: 'STR',
			Dexterity: 'DEX',
			Constitution: 'CON',
			Intelligence: 'INT',
			Wisdom: 'WIS',
			Charisma: 'CHA'
		};
		return abbrev[ability] || ability.substring(0, 3).toUpperCase();
	}

	function getIcon(ability: string): string {
		const icons: Record<string, string> = {
			Strength: '💪',
			Dexterity: '🏹',
			Constitution: '❤️',
			Intelligence: '🧠',
			Wisdom: '👁️',
			Charisma: '✨'
		};
		return icons[ability] || '⚡';
	}

	function handleFreeBoostSelect(index: number, ability: string) {
		const newBoosts = [...freeBoosts];
		newBoosts[index] = ability;
		onFreeBoostsChange?.(newBoosts);
	}

	// Get available abilities for a free boost (always return all abilities)
	function getAvailableAbilitiesForFreeBoost(index: number): string[] {
		return ABILITIES;
	}

	// Get disabled abilities for a free boost (abilities already selected in other dropdowns or at max boosts)
	function getDisabledAbilitiesForFreeBoost(index: number): string[] {
		const currentBoost = freeBoosts[index];

		return ABILITIES.filter((ability) => {
			const score = abilityScores.find((s) => s.name === ability);
			if (!score) return false;

			// If this is the currently selected boost in THIS dropdown, don't disable it
			if (ability === currentBoost) return false;

			// Disable if this ability is selected in any OTHER free boost dropdown
			const selectedInOtherDropdown = freeBoosts.some((boost, i) => i !== index && boost === ability);
			if (selectedInOtherDropdown) return true;

			// Disable if ability already has 4 boosts (max score 18 at level 1)
			if (score.boosts.length >= 4) return true;

			return false;
		});
	}

	// Check if all required boosts are selected
	const allBoostsSelected = $derived(freeBoosts.every((boost) => boost !== null));

	// Get total boosts assigned
	const totalBoostsAssigned = $derived(freeBoosts.filter((boost) => boost !== null).length);
</script>

<div class="ability-score-manager">
	<div class="manager-header">
		<h2 class="manager-title">Ability Scores</h2>
		<p class="manager-description">
			Your ability scores determine your character's capabilities. Each score starts at 10 and is
			modified by boosts and flaws from your ancestry, background, class, and free choices.
		</p>
	</div>

	<!-- Ability Score Grid -->
	<div class="ability-grid">
		{#each abilityScores as score}
			<div class="ability-card">
				<div class="card-icon" aria-hidden="true">{score.icon}</div>
				<div class="card-header">
					<div class="card-abbr">{score.abbreviation}</div>
					<div class="card-name">{score.name}</div>
				</div>

				<div class="card-score">
					<div class="score-value">{score.totalScore}</div>
					<div class="score-modifier" class:positive={score.modifier > 0} class:negative={score.modifier < 0}>
						{score.modifier >= 0 ? '+' : ''}{score.modifier}
					</div>
				</div>

				<div class="card-sources">
					<div class="source-label">Sources:</div>
					{#if score.boosts.length === 0 && score.flaws.length === 0}
						<div class="source-item empty">Base 10</div>
					{:else}
						{#each score.boosts as boost}
							<div class="source-item boost">+2 {boost}</div>
						{/each}
						{#each score.flaws as flaw}
							<div class="source-item flaw">-2 {flaw}</div>
						{/each}
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Free Boosts Section -->
	<div class="free-boosts-section">
		<div class="section-header">
			<h3 class="section-title">Free Ability Boosts</h3>
			<p class="section-description">
				At 1st level, you gain four free ability boosts. You can apply each boost to any ability
				score, but you can't apply more than one boost to the same ability score unless that
				ability score is already 18 or higher.
			</p>
			<div class="boost-counter">
				<span class="counter-label">Boosts Assigned:</span>
				<span class="counter-value" class:complete={allBoostsSelected}>
					{totalBoostsAssigned} / 4
				</span>
			</div>
		</div>

		<div class="free-boosts-grid">
			{#each freeBoosts as boost, index}
				{@const availableAbilities = getAvailableAbilitiesForFreeBoost(index)}
				{@const disabledAbilities = getDisabledAbilitiesForFreeBoost(index)}
				<AbilityBoostSelector
					label="Free Boost {index + 1}"
					description="Choose any ability score (max 18 at level 1)"
					{availableAbilities}
					{disabledAbilities}
					selectedAbility={boost}
					onSelect={(ability) => handleFreeBoostSelect(index, ability)}
					required={true}
				/>
			{/each}
		</div>

		{#if !allBoostsSelected}
			<div class="validation-message">
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
						fill="currentColor"
					/>
				</svg>
				Please assign all four free ability boosts to continue.
			</div>
		{/if}
	</div>
</div>

<style>
	.ability-score-manager {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.manager-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.manager-title {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.manager-description {
		margin: 0;
		color: var(--text-secondary, #666666);
		line-height: 1.6;
	}

	/* Ability Grid */
	.ability-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.ability-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.25rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 12px;
		transition: all var(--transition-fast);
	}

	.ability-card:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.card-icon {
		font-size: 2rem;
		line-height: 1;
		text-align: center;
	}

	.card-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.card-abbr {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--text-secondary, #666666);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.card-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.card-score {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem;
		background-color: var(--surface-1, #ffffff);
		border-radius: 8px;
	}

	.score-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.score-modifier {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-secondary, #666666);
	}

	.score-modifier.positive {
		color: #37b24d;
	}

	.score-modifier.negative {
		color: #f03e3e;
	}

	.card-sources {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.8125rem;
	}

	.source-label {
		font-weight: 600;
		color: var(--text-secondary, #666666);
		margin-bottom: 0.25rem;
	}

	.source-item {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		line-height: 1.4;
	}

	.source-item.empty {
		color: var(--text-secondary, #666666);
		font-style: italic;
	}

	.source-item.boost {
		background-color: rgba(55, 178, 77, 0.1);
		color: #37b24d;
	}

	.source-item.flaw {
		background-color: rgba(240, 62, 62, 0.1);
		color: #f03e3e;
	}

	/* Free Boosts Section */
	.free-boosts-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1.5rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 12px;
	}

	.section-header {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.section-description {
		margin: 0;
		color: var(--text-secondary, #666666);
		line-height: 1.6;
		font-size: 0.9375rem;
	}

	.boost-counter {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background-color: var(--surface-1, #ffffff);
		border-radius: 8px;
		border: 2px solid var(--border-color, #e0e0e0);
	}

	.counter-label {
		font-weight: 600;
		color: var(--text-secondary, #666666);
	}

	.counter-value {
		font-weight: 700;
		font-size: 1.125rem;
		color: var(--link-color, #5c7cfa);
	}

	.counter-value.complete {
		color: #37b24d;
	}

	.free-boosts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.validation-message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background-color: rgba(250, 176, 5, 0.1);
		border-left: 3px solid #fab005;
		border-radius: 4px;
		font-size: 0.9375rem;
		color: #c77700;
	}

	.validation-message svg {
		flex-shrink: 0;
		color: #fab005;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.ability-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.free-boosts-grid {
			grid-template-columns: 1fr;
		}

		.manager-title {
			font-size: 1.5rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.ability-card {
			transition: none;
		}
	}
</style>
