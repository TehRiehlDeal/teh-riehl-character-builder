<script lang="ts">
	import { character } from '$lib/stores/character';
	import { activeModifiersStore } from '$lib/stores/activeModifiers';
	import { getEquipmentById } from '$lib/data/repositories/equipmentRepository';
	import { getBackgroundById } from '$lib/data/repositories/backgroundRepository';
	import type { Armor, Background } from '$lib/data/types/app';
	import { onMount } from 'svelte';

	// Armor data state
	let equippedArmor: Armor | null = $state(null);
	let armorLoading = $state(true);

	// Background data state (for checking background-granted lore skills)
	let characterBackground: Background | null = $state(null);

	// Load equipped armor data
	onMount(async () => {
		if ($character.equipment.armor) {
			try {
				const equipment = await getEquipmentById($character.equipment.armor.itemId);
				if (equipment && equipment.equipmentType === 'armor') {
					equippedArmor = equipment as Armor;
				}
			} catch (error) {
				console.error('Failed to load armor:', error);
			}
		}
		armorLoading = false;
	});

	// Watch for armor changes
	$effect(() => {
		const armorId = $character.equipment.armor?.itemId;
		if (armorId) {
			armorLoading = true;
			getEquipmentById(armorId).then((equipment) => {
				if (equipment && equipment.equipmentType === 'armor') {
					equippedArmor = equipment as Armor;
				} else {
					equippedArmor = null;
				}
				armorLoading = false;
			});
		} else {
			equippedArmor = null;
			armorLoading = false;
		}
	});

	// Load background data to check for background-granted lore skills
	$effect(() => {
		const backgroundId = $character.background.id;
		if (backgroundId) {
			getBackgroundById(backgroundId).then((bg) => {
				characterBackground = bg;
			});
		} else {
			characterBackground = null;
		}
	});

	// Base skill definitions with their governing abilities
	const BASE_SKILLS = [
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

	// Dynamic skill list that includes lore skills
	const displaySkills = $derived.by(() => {
		// Add all lore skills (INT-based)
		const loreSkills = Object.keys($character.skills)
			.filter(skill => skill.endsWith(' Lore'))
			.map(skill => ({
				name: skill,
				ability: 'intelligence',
				isLore: true
			}))
			.sort((a, b) => a.name.localeCompare(b.name));

		return [...BASE_SKILLS.map(s => ({ ...s, isLore: false })), ...loreSkills];
	});

	// Add Lore Skill modal state
	let showAddLoreModal = $state(false);
	let newLoreName = $state('');
	let loreNameError = $state('');

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
		// Lore skills maintain their casing, regular skills are lowercase
		const skillKey = skillName.endsWith(' Lore') ? skillName : skillName.toLowerCase();
		const proficiencyRank = $character.skills[skillKey] || 0;
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

	// Calculate Armor Class
	// AC = 10 + Dexterity Modifier (Capped by worn armor) + Armor Proficiency Bonus + Armor's Item Bonus + Other Bonuses/Penalties
	const armorClass = $derived.by(() => {
		let ac = 10;

		// Determine armor category and dex cap
		const armorCategory = equippedArmor?.category || 'unarmored';
		const dexCap = equippedArmor?.dexCap ?? 999; // No cap for unarmored by default

		// Get dexterity modifier (capped by armor)
		const dexMod = getAbilityModifier($character.abilities.dexterity);
		const cappedDexMod = Math.min(dexMod, dexCap);
		ac += cappedDexMod;

		// Get armor proficiency bonus
		const armorProficiencyRank = $character.armorProficiency[armorCategory] || 0;
		const proficiencyBonus = getProficiencyBonus(armorProficiencyRank, $character.level);
		ac += proficiencyBonus;

		// Get item bonus and other modifiers from active modifiers
		const acModifiers = $activeModifiersStore.filter(m => m.selector === 'ac' && m.isActive);
		for (const mod of acModifiers) {
			ac += mod.modifier.value;
		}

		return ac;
	});

	// Get AC breakdown for tooltip
	const acBreakdown = $derived.by(() => {
		const breakdown: string[] = ['Base: 10'];

		const armorCategory = equippedArmor?.category || 'unarmored';
		const dexCap = equippedArmor?.dexCap ?? 999;
		const dexMod = getAbilityModifier($character.abilities.dexterity);
		const cappedDexMod = Math.min(dexMod, dexCap);

		if (cappedDexMod !== 0) {
			if (dexMod !== cappedDexMod) {
				breakdown.push(`Dexterity: ${formatModifier(cappedDexMod)} (capped from ${formatModifier(dexMod)})`);
			} else {
				breakdown.push(`Dexterity: ${formatModifier(cappedDexMod)}`);
			}
		}

		const armorProficiencyRank = $character.armorProficiency[armorCategory] || 0;
		const proficiencyBonus = getProficiencyBonus(armorProficiencyRank, $character.level);
		if (proficiencyBonus > 0) {
			breakdown.push(`${armorCategory.charAt(0).toUpperCase() + armorCategory.slice(1)} Proficiency: ${formatModifier(proficiencyBonus)}`);
		}

		const acModifiers = $activeModifiersStore.filter(m => m.selector === 'ac' && m.isActive);
		for (const mod of acModifiers) {
			if (mod.modifier.value !== 0) {
				breakdown.push(`${mod.modifier.label}: ${formatModifier(mod.modifier.value)}`);
			}
		}

		return breakdown.join('\n');
	});

	// Format modifier with sign
	function formatModifier(value: number): string {
		return value >= 0 ? `+${value}` : `${value}`;
	}

	// Check if a lore skill is from the character's background
	function isBackgroundLore(loreName: string): boolean {
		if (!characterBackground || !characterBackground.trainedLore) return false;
		return characterBackground.trainedLore.includes(loreName);
	}

	// Handle adding a lore skill
	function handleAddLore() {
		loreNameError = '';

		if (!newLoreName.trim()) {
			loreNameError = 'Lore name cannot be empty';
			return;
		}

		// Check for duplicate (case-insensitive)
		const loreName = newLoreName.trim().endsWith(' Lore')
			? newLoreName.trim()
			: newLoreName.trim() + ' Lore';

		const existingLore = Object.keys($character.skills).find(
			skill => skill.toLowerCase() === loreName.toLowerCase()
		);

		if (existingLore) {
			loreNameError = 'This Lore skill already exists';
			return;
		}

		character.addLoreSkill(newLoreName.trim(), 0); // Start untrained
		showAddLoreModal = false;
		newLoreName = '';
	}

	// Handle deleting a lore skill
	function handleDeleteLore(loreName: string) {
		if (confirm(`Remove ${loreName}? This will delete all proficiency data for this skill.`)) {
			character.removeLoreSkill(loreName);
		}
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

		<!-- Armor Class -->
		<section class="content-section" aria-labelledby="armor-class">
			<h2 id="armor-class" class="section-title">Armor Class</h2>
			<div class="stat-list">
				<div class="stat-row">
					<div class="stat-main">
						<span class="stat-name">
							AC
							{#if equippedArmor}
								<span class="armor-type">({equippedArmor.name})</span>
							{:else}
								<span class="armor-type">(Unarmored)</span>
							{/if}
						</span>
						{#if equippedArmor}
							{@const armorCategory = equippedArmor.category}
							{@const proficiencyRank = $character.armorProficiency[armorCategory]}
							<span class="stat-proficiency proficiency-{proficiencyRank}">
								{getProficiencyName(proficiencyRank)}
							</span>
						{:else}
							<span class="stat-proficiency proficiency-{$character.armorProficiency.unarmored}">
								{getProficiencyName($character.armorProficiency.unarmored)}
							</span>
						{/if}
					</div>
					<div class="stat-details">
						<span class="stat-ac-value" title={acBreakdown}>
							{armorClass}
						</span>
					</div>
				</div>
			</div>
		</section>

		<!-- Skills -->
		<section class="content-section" aria-labelledby="skills">
			<div class="section-header-with-action">
				<h2 id="skills" class="section-title">Skills</h2>
				<button
					class="add-lore-button"
					onclick={() => showAddLoreModal = true}
					type="button"
					aria-label="Add Lore Skill"
				>
					+ Add Lore Skill
				</button>
			</div>
			<div class="stat-list">
				{#each displaySkills as skill}
					{@const modifier = getSkillModifier(skill.name, skill.ability as keyof typeof $character.abilities)}
					{@const skillKey = skill.isLore ? skill.name : skill.name.toLowerCase()}
					{@const proficiency = $character.skills[skillKey] || 0}
					<div class="stat-row">
						<div class="stat-main">
							<span class="stat-name">
								{skill.name}
								{#if skill.isLore && !isBackgroundLore(skill.name)}
									<button
										class="delete-lore"
										onclick={() => handleDeleteLore(skill.name)}
										aria-label="Remove {skill.name}"
										type="button"
									>
										×
									</button>
								{/if}
							</span>
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

<!-- Add Lore Skill Modal -->
{#if showAddLoreModal}
	<div class="modal-overlay" onclick={() => { showAddLoreModal = false; newLoreName = ''; loreNameError = ''; }} role="dialog" aria-modal="true" aria-labelledby="add-lore-title">
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<h3 id="add-lore-title">Add Lore Skill</h3>
			<label for="lore-name">Lore Name</label>
			<input
				id="lore-name"
				type="text"
				bind:value={newLoreName}
				placeholder="e.g., Academia, Sailing, Pathfinder Society"
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						handleAddLore();
					} else if (e.key === 'Escape') {
						showAddLoreModal = false;
						newLoreName = '';
						loreNameError = '';
					}
				}}
			/>
			<p class="help-text">
				" Lore" will be added automatically if not included
			</p>
			{#if loreNameError}
				<p class="error-text">{loreNameError}</p>
			{/if}
			<div class="modal-actions">
				<button onclick={() => { showAddLoreModal = false; newLoreName = ''; loreNameError = ''; }}>Cancel</button>
				<button onclick={handleAddLore} disabled={!newLoreName.trim()}>
					Add
				</button>
			</div>
		</div>
	</div>
{/if}

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

	/* Armor Class specific styles */
	.armor-type {
		font-size: 0.875rem;
		font-weight: 400;
		color: var(--text-secondary, #666666);
		font-style: italic;
		margin-left: 0.5rem;
	}

	.stat-ac-value {
		font-size: 1.75rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		min-width: 60px;
		text-align: right;
		color: var(--link-color, #5c7cfa);
		cursor: help;
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

	/* Section Header with Action */
	.section-header-with-action {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	/* Add Lore Button */
	.add-lore-button {
		padding: 0.5rem 1rem;
		background-color: var(--link-color, #5c7cfa);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.add-lore-button:hover {
		background-color: var(--link-hover-color, #4c63d2);
	}

	.add-lore-button:focus {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	/* Delete Lore Button */
	.delete-lore {
		margin-left: 0.5rem;
		padding: 0 0.375rem;
		background-color: var(--surface-3, #e0e0e0);
		color: var(--text-secondary, #666666);
		border: none;
		border-radius: 4px;
		font-size: 1.125rem;
		line-height: 1;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.delete-lore:hover {
		background-color: #ff6b6b;
		color: white;
	}

	.delete-lore:focus {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	/* Modal Overlay */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	/* Modal Content */
	.modal-content {
		background-color: var(--surface-1, #ffffff);
		padding: 2rem;
		border-radius: 12px;
		width: 90%;
		max-width: 500px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
	}

	.modal-content h3 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.modal-content label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.modal-content input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-size: 1rem;
		font-family: inherit;
		margin-bottom: 0.5rem;
	}

	.modal-content input:focus {
		outline: none;
		border-color: var(--focus-color, #5c7cfa);
	}

	.help-text {
		margin: 0 0 1rem 0;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
	}

	.error-text {
		margin: 0 0 1rem 0;
		font-size: 0.875rem;
		color: #ff6b6b;
		font-weight: 600;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.modal-actions button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.modal-actions button:first-child {
		background-color: var(--surface-2, #f5f5f5);
		color: var(--text-primary, #1a1a1a);
	}

	.modal-actions button:first-child:hover {
		background-color: var(--surface-3, #e0e0e0);
	}

	.modal-actions button:last-child {
		background-color: var(--link-color, #5c7cfa);
		color: white;
	}

	.modal-actions button:last-child:hover:not(:disabled) {
		background-color: var(--link-hover-color, #4c63d2);
	}

	.modal-actions button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
