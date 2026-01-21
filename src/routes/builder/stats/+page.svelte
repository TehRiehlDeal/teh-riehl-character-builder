<script lang="ts">
	import { character } from '$lib/stores/character';

	// Skill definitions with their governing abilities
	const SKILLS = [
		{ name: 'Acrobatics', ability: 'dexterity' },
		{ name: 'Arcana', ability: 'intelligence' },
		{ name: 'Athletics', ability: 'strength' },
		{ name: 'Crafting', ability: 'intelligence' },
		{ name: 'Deception', ability: 'charisma' },
		{ name: 'Diplomacy', ability: 'charisma' },
		{ name: 'Intimidation', ability: 'charisma' },
		{ name: 'Medicine', ability: 'wisdom' },
		{ name: 'Nature', ability: 'wisdom' },
		{ name: 'Occultism', ability: 'intelligence' },
		{ name: 'Performance', ability: 'charisma' },
		{ name: 'Religion', ability: 'wisdom' },
		{ name: 'Society', ability: 'intelligence' },
		{ name: 'Stealth', ability: 'dexterity' },
		{ name: 'Survival', ability: 'wisdom' },
		{ name: 'Thievery', ability: 'dexterity' }
	];

	// Calculate ability modifier from ability score
	function getAbilityModifier(score: number): number {
		return Math.floor((score - 10) / 2);
	}

	// Get proficiency bonus based on rank and level
	function getProficiencyBonus(rank: number, level: number): number {
		if (rank === 0) return 0; // Untrained
		return level + (rank * 2); // Trained: level+2, Expert: level+4, Master: level+6, Legendary: level+8
	}

	// Get proficiency rank name
	function getProficiencyName(rank: number): string {
		switch (rank) {
			case 0: return 'Untrained';
			case 1: return 'Trained';
			case 2: return 'Expert';
			case 3: return 'Master';
			case 4: return 'Legendary';
			default: return 'Untrained';
		}
	}

	// Calculate skill modifier
	function getSkillModifier(skillName: string, abilityKey: keyof typeof $character.abilities): number {
		const abilityMod = getAbilityModifier($character.abilities[abilityKey]);
		const proficiencyRank = $character.skills[skillName.toLowerCase()] || 0;
		const proficiencyBonus = getProficiencyBonus(proficiencyRank, $character.level);
		return abilityMod + proficiencyBonus;
	}

	// Calculate save modifier
	function getSaveModifier(save: 'fortitude' | 'reflex' | 'will'): number {
		const abilityKey = save === 'fortitude' ? 'constitution' : save === 'reflex' ? 'dexterity' : 'wisdom';
		const abilityMod = getAbilityModifier($character.abilities[abilityKey]);
		const proficiencyBonus = getProficiencyBonus($character.saves[save], $character.level);
		return abilityMod + proficiencyBonus;
	}

	// Calculate perception modifier
	const perceptionModifier = $derived.by(() => {
		const wisdomMod = getAbilityModifier($character.abilities.wisdom);
		const proficiencyBonus = getProficiencyBonus($character.perception, $character.level);
		return wisdomMod + proficiencyBonus;
	});

	// Format modifier with sign
	function formatModifier(value: number): string {
		return value >= 0 ? `+${value}` : `${value}`;
	}

	// Get ability score abbreviation
	function getAbilityAbbr(ability: string): string {
		return ability.substring(0, 3).toUpperCase();
	}
</script>

<svelte:head>
	<title>Stats - Character Builder</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<h1 class="page-title">Stats</h1>
		<p class="page-description">
			View your character's ability scores, skills, saves, and other statistics.
		</p>
	</header>

	<div class="content-sections">
		<!-- Ability Scores -->
		<section class="content-section" aria-labelledby="ability-scores">
			<h2 id="ability-scores" class="section-title">Ability Scores</h2>
			<div class="ability-grid">
				{#each Object.entries($character.abilities) as [abilityKey, score]}
					{@const modifier = getAbilityModifier(score)}
					<div class="ability-card">
						<div class="ability-header">
							<span class="ability-name">{abilityKey.charAt(0).toUpperCase() + abilityKey.slice(1)}</span>
							<span class="ability-abbr">{getAbilityAbbr(abilityKey)}</span>
						</div>
						<div class="ability-score">{score}</div>
						<div class="ability-modifier" class:positive={modifier >= 0} class:negative={modifier < 0}>
							{formatModifier(modifier)}
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Saving Throws -->
		<section class="content-section" aria-labelledby="saves">
			<h2 id="saves" class="section-title">Saving Throws</h2>
			<div class="stat-list">
				{#each [
					{ name: 'Fortitude', key: 'fortitude' as const, ability: 'Constitution' },
					{ name: 'Reflex', key: 'reflex' as const, ability: 'Dexterity' },
					{ name: 'Will', key: 'will' as const, ability: 'Wisdom' }
				] as save}
					{@const modifier = getSaveModifier(save.key)}
					{@const proficiency = $character.saves[save.key]}
					<div class="stat-row">
						<div class="stat-main">
							<span class="stat-name">{save.name}</span>
							<span class="stat-proficiency proficiency-{proficiency}">
								{getProficiencyName(proficiency)}
							</span>
						</div>
						<div class="stat-details">
							<span class="stat-ability">{save.ability}</span>
							<span class="stat-modifier" class:positive={modifier >= 0} class:negative={modifier < 0}>
								{formatModifier(modifier)}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Perception -->
		<section class="content-section" aria-labelledby="perception">
			<h2 id="perception" class="section-title">Perception</h2>
			<div class="stat-list">
				<div class="stat-row">
					<div class="stat-main">
						<span class="stat-name">Perception</span>
						<span class="stat-proficiency proficiency-{$character.perception}">
							{getProficiencyName($character.perception)}
						</span>
					</div>
					<div class="stat-details">
						<span class="stat-ability">Wisdom</span>
						<span class="stat-modifier" class:positive={perceptionModifier >= 0} class:negative={perceptionModifier < 0}>
							{formatModifier(perceptionModifier)}
						</span>
					</div>
				</div>
			</div>
		</section>

		<!-- Skills -->
		<section class="content-section" aria-labelledby="skills">
			<h2 id="skills" class="section-title">Skills</h2>
			<div class="stat-list">
				{#each SKILLS as skill}
					{@const modifier = getSkillModifier(skill.name, skill.ability as keyof typeof $character.abilities)}
					{@const proficiency = $character.skills[skill.name.toLowerCase()] || 0}
					<div class="stat-row">
						<div class="stat-main">
							<span class="stat-name">{skill.name}</span>
							<span class="stat-proficiency proficiency-{proficiency}">
								{getProficiencyName(proficiency)}
							</span>
						</div>
						<div class="stat-details">
							<span class="stat-ability">{skill.ability.charAt(0).toUpperCase() + skill.ability.slice(1)}</span>
							<span class="stat-modifier" class:positive={modifier >= 0} class:negative={modifier < 0}>
								{formatModifier(modifier)}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</section>
	</div>
</div>

<style>
	.page-content {
		max-width: 1000px;
		margin: 0 auto;
		padding: 1rem;
	}

	.page-header {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.page-title {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		color: var(--text-primary, #1a1a1a);
	}

	.page-description {
		font-size: 1.125rem;
		margin: 0;
		color: var(--text-secondary, #666666);
	}

	.content-sections {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.content-section {
		background-color: var(--surface-1, #ffffff);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 10px;
		padding: 1.5rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 1.5rem 0;
		color: var(--text-primary, #1a1a1a);
		border-bottom: 1px solid var(--border-color, #e0e0e0);
		padding-bottom: 0.75rem;
	}

	/* Ability Scores Grid */
	.ability-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 1rem;
	}

	.ability-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.25rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		transition: all var(--transition-fast);
	}

	.ability-card:hover {
		border-color: var(--link-color, #5c7cfa);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.ability-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		margin-bottom: 0.75rem;
	}

	.ability-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.ability-abbr {
		font-size: 0.75rem;
		color: var(--text-secondary, #666666);
		text-transform: uppercase;
	}

	.ability-score {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
		margin-bottom: 0.25rem;
	}

	.ability-modifier {
		font-size: 1.25rem;
		font-weight: 600;
		padding: 0.25rem 0.75rem;
		border-radius: 6px;
		background-color: var(--surface-3, #e0e0e0);
	}

	.ability-modifier.positive {
		color: #37b24d;
		background-color: rgba(55, 178, 77, 0.1);
	}

	.ability-modifier.negative {
		color: #f03e3e;
		background-color: rgba(240, 62, 62, 0.1);
	}

	/* Stat List (for Skills, Saves, Perception) */
	.stat-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		transition: all var(--transition-fast);
	}

	.stat-row:hover {
		background-color: var(--surface-3, #e0e0e0);
	}

	.stat-main {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
	}

	.stat-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		min-width: 120px;
	}

	.stat-proficiency {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		background-color: var(--surface-3, #e0e0e0);
		color: var(--text-secondary, #666666);
	}

	.stat-proficiency.proficiency-0 {
		background-color: rgba(134, 142, 150, 0.1);
		color: #868e96;
	}

	.stat-proficiency.proficiency-1 {
		background-color: rgba(55, 178, 77, 0.1);
		color: #37b24d;
	}

	.stat-proficiency.proficiency-2 {
		background-color: rgba(92, 124, 250, 0.1);
		color: #5c7cfa;
	}

	.stat-proficiency.proficiency-3 {
		background-color: rgba(255, 193, 7, 0.1);
		color: #c77700;
	}

	.stat-proficiency.proficiency-4 {
		background-color: rgba(240, 62, 62, 0.1);
		color: #f03e3e;
	}

	.stat-details {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.stat-ability {
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		min-width: 90px;
		text-align: right;
	}

	.stat-modifier {
		font-size: 1.25rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		min-width: 50px;
		text-align: right;
		color: var(--text-primary, #1a1a1a);
	}

	.stat-modifier.positive {
		color: #37b24d;
	}

	.stat-modifier.negative {
		color: #f03e3e;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.page-content {
			padding: 0.5rem;
		}

		.page-title {
			font-size: 1.75rem;
		}

		.page-description {
			font-size: 1rem;
		}

		.section-title {
			font-size: 1.25rem;
		}

		.content-section {
			padding: 1.25rem;
		}

		.ability-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.stat-row {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}

		.stat-main {
			justify-content: space-between;
		}

		.stat-details {
			justify-content: space-between;
		}

		.stat-ability,
		.stat-modifier {
			text-align: left;
		}
	}

	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		.ability-card,
		.stat-row {
			transition: none;
		}
	}
</style>
