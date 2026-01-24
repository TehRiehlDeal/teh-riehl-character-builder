<script lang="ts">
	import type { Background, Class } from '$lib/data/types/app';

	interface Props {
		/** Selected background */
		background?: Background | null;
		/** Selected class */
		selectedClass?: Class | null;
		/** Character level */
		level?: number;
		/** Ability scores (for calculating modifiers) */
		abilityScores?: Record<string, number>;
		/** Currently selected trained skills */
		trainedSkills?: string[];
		/** Heritage skills (from heritage choices like Skilled Human) */
		heritageSkills?: string[];
		/** Callback when trained skills change */
		// eslint-disable-next-line no-unused-vars
		onTrainedSkillsChange?: (skills: string[]) => void;
	}

	let {
		background = null,
		selectedClass = null,
		level = 1,
		abilityScores = {},
		trainedSkills = [],
		heritageSkills = [],
		onTrainedSkillsChange
	}: Props = $props();

	// PF2e skill list with associated abilities
	const SKILLS = [
		{ name: 'Acrobatics', ability: 'Dexterity', description: 'Balance, tumble, and maneuver while flying' },
		{ name: 'Arcana', ability: 'Intelligence', description: 'Recall knowledge about arcane magic and creatures' },
		{ name: 'Athletics', ability: 'Strength', description: 'Climb, force open, grapple, and swim' },
		{ name: 'Crafting', ability: 'Intelligence', description: 'Create and repair items' },
		{ name: 'Deception', ability: 'Charisma', description: 'Lie and mislead others' },
		{ name: 'Diplomacy', ability: 'Charisma', description: 'Influence others with tact' },
		{ name: 'Intimidation', ability: 'Charisma', description: 'Threaten and coerce others' },
		{ name: 'Medicine', ability: 'Wisdom', description: 'Heal wounds and ailments' },
		{ name: 'Nature', ability: 'Wisdom', description: 'Recall knowledge about the natural world' },
		{ name: 'Occultism', ability: 'Intelligence', description: 'Recall knowledge about occult magic and creatures' },
		{ name: 'Performance', ability: 'Charisma', description: 'Impress audiences with music, dance, or acting' },
		{ name: 'Religion', ability: 'Wisdom', description: 'Recall knowledge about divine magic and creatures' },
		{ name: 'Society', ability: 'Intelligence', description: 'Recall knowledge about society and culture' },
		{ name: 'Stealth', ability: 'Dexterity', description: 'Hide and move quietly' },
		{ name: 'Survival', ability: 'Wisdom', description: 'Track, navigate, and survive in the wild' },
		{ name: 'Thievery', ability: 'Dexterity', description: 'Pick locks and pockets' }
	];

	// Calculate skill modifier
	function getSkillModifier(skillName: string, abilityName: string): number {
		const abilityScore = abilityScores[abilityName] || 10;
		const abilityModifier = Math.floor((abilityScore - 10) / 2);

		// Proficiency bonus
		let proficiencyBonus = 0;
		if (isSkillTrained(skillName)) {
			proficiencyBonus = level + 2; // Trained = level + 2
		}

		return abilityModifier + proficiencyBonus;
	}

	// Check if a skill is trained (case-insensitive)
	function isSkillTrained(skillName: string): boolean {
		const lowerSkill = skillName.toLowerCase();
		return trainedSkills.some(skill => skill.toLowerCase() === lowerSkill);
	}

	// Capitalize first letter of skill name to match SKILLS array format
	function capitalizeSkillName(skill: string): string {
		return skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase();
	}

	// Get skills granted by background
	const backgroundSkills = $derived.by(() => {
		if (!background || !background.trainedSkills) return [];
		return background.trainedSkills
			.filter(skill => !skill.toLowerCase().includes('lore'))
			.map(capitalizeSkillName);
	});

	// Get skills granted by class
	const classGrantedSkills = $derived.by(() => {
		if (!selectedClass || !selectedClass.skills?.trained) return [];
		return selectedClass.skills.trained
			.filter(skill => !skill.toLowerCase().includes('lore'))
			.map(capitalizeSkillName);
	});

	// Get number of additional skills from class
	const additionalSkillCount = $derived.by(() => {
		if (!selectedClass || !selectedClass.skills?.additional) return 0;

		// Base number from class
		let count = selectedClass.skills.additional;

		// Add Intelligence modifier
		const intelligenceScore = abilityScores['Intelligence'] || 10;
		const intelligenceModifier = Math.floor((intelligenceScore - 10) / 2);
		count += intelligenceModifier;

		// Ensure we don't go negative
		return Math.max(0, count);
	});

	// Get skills that are automatically trained (from background or class)
	const automaticSkills = $derived.by(() => {
		return [...backgroundSkills, ...classGrantedSkills, ...heritageSkills];
	});

	// Get source of automatic skills (case-insensitive)
	function getSkillSource(skillName: string): string[] {
		const sources: string[] = [];
		const lowerSkill = skillName.toLowerCase();
		if (backgroundSkills.some(s => s.toLowerCase() === lowerSkill)) sources.push('Background');
		if (classGrantedSkills.some(s => s.toLowerCase() === lowerSkill)) sources.push('Class');
		if (heritageSkills.some(s => s.toLowerCase() === lowerSkill)) sources.push('Heritage');
		return sources;
	}

	// Check if a skill is automatic (case-insensitive)
	function isAutomaticSkill(skillName: string): boolean {
		const lowerSkill = skillName.toLowerCase();
		return automaticSkills.some(autoSkill => autoSkill.toLowerCase() === lowerSkill);
	}

	// Track previous background/class to detect changes
	let previousBackgroundId = $state<string | null>(null);
	let previousClassId = $state<string | null>(null);

	// Detect when background or class changes and clear non-automatic skills
	$effect(() => {
		const currentBackgroundId = background?.id || null;
		const currentClassId = selectedClass?.id || null;

		const backgroundChanged = previousBackgroundId !== null && previousBackgroundId !== currentBackgroundId;
		const classChanged = previousClassId !== null && previousClassId !== currentClassId;

		if (backgroundChanged || classChanged) {
			// Clear all non-automatic skills when background/class changes
			onTrainedSkillsChange?.(automaticSkills);
		}

		previousBackgroundId = currentBackgroundId;
		previousClassId = currentClassId;
	});

	// Ensure automatic skills are always included in trained skills
	// and clean up any invalid skills from saved data
	$effect(() => {
		// Normalize all trainedSkills to proper capitalization
		const normalizedTrained = trainedSkills.map(skill => {
			// First check if it's an automatic skill
			const autoSkill = automaticSkills.find(
				auto => auto.toLowerCase() === skill.toLowerCase()
			);
			if (autoSkill) return autoSkill;

			// Otherwise, match against valid SKILLS array for proper capitalization
			const validSkill = SKILLS.find(s => s.name.toLowerCase() === skill.toLowerCase());
			return validSkill ? validSkill.name : skill;
		});

		// Get current manual selections (skills that aren't automatic)
		// Only keep skills that are actually valid skills from SKILLS array
		const validSkillNames = SKILLS.map(s => s.name.toLowerCase());
		const currentManual = normalizedTrained.filter(skill => {
			const isAuto = isAutomaticSkill(skill);
			const isValid = validSkillNames.includes(skill.toLowerCase());
			return !isAuto && isValid;
		});

		// Build the complete list: all automatic skills + valid manual selections
		const completeList = [...automaticSkills, ...currentManual];

		// Check if we need to update
		const needsUpdate =
			completeList.length !== trainedSkills.length ||
			!completeList.every(skill => trainedSkills.includes(skill)) ||
			!trainedSkills.every(skill => completeList.includes(skill));

		if (needsUpdate) {
			onTrainedSkillsChange?.(completeList);
		}
	});

	// Get manually selected skills (not automatic)
	const manuallySelectedSkills = $derived.by(() => {
		return trainedSkills.filter(skill => !isAutomaticSkill(skill));
	});

	// Calculate remaining skill selections
	const remainingSelections = $derived.by(() => {
		return additionalSkillCount - manuallySelectedSkills.length;
	});

	function toggleSkill(skillName: string) {
		// Can't toggle automatic skills
		if (isAutomaticSkill(skillName)) return;

		const newSkills = [...trainedSkills];
		const index = newSkills.indexOf(skillName);

		if (index >= 0) {
			// Remove skill
			newSkills.splice(index, 1);
		} else {
			// Add skill if we haven't reached the limit
			if (manuallySelectedSkills.length < additionalSkillCount) {
				newSkills.push(skillName);
			}
		}

		onTrainedSkillsChange?.(newSkills);
	}

	function formatModifier(modifier: number): string {
		return modifier >= 0 ? `+${modifier}` : `${modifier}`;
	}

	// Check if all required skills are selected
	const allSkillsSelected = $derived.by(() => {
		return remainingSelections === 0;
	});
</script>

<div class="skill-selector">
	<div class="selector-header">
		<h2 class="selector-title">Skills</h2>
		<p class="selector-description">
			Choose which skills your character is trained in. Your background and class provide some
			automatic training, and your class grants additional skill selections.
		</p>
	</div>

	{#if additionalSkillCount > 0}
		<div class="selection-counter">
			<span class="counter-label">Additional Skills to Select:</span>
			<span class="counter-value" class:complete={allSkillsSelected}>
				{manuallySelectedSkills.length} / {additionalSkillCount}
			</span>
		</div>
	{/if}

	<!-- Skill Grid -->
	<div class="skill-grid">
		{#each SKILLS as skill}
			{@const isTrained = isSkillTrained(skill.name)}
			{@const isAutomatic = isAutomaticSkill(skill.name)}
			{@const modifier = getSkillModifier(skill.name, skill.ability)}
			{@const canToggle = !isAutomatic && (isTrained || remainingSelections > 0)}

			<button
				type="button"
				class="skill-card"
				class:trained={isTrained}
				class:automatic={isAutomatic}
				class:selectable={canToggle && !isTrained}
				disabled={!canToggle && !isTrained}
				onclick={() => toggleSkill(skill.name)}
			>
				<div class="card-header">
					<div class="skill-name">{skill.name}</div>
					<div class="skill-modifier" class:trained={isTrained && !isAutomatic} class:automatic={isAutomatic}>
						{formatModifier(modifier)}
					</div>
				</div>

				<div class="card-body">
					<div class="skill-ability">{skill.ability}</div>
					<div class="skill-description">{skill.description}</div>
				</div>

				<div class="card-footer">
					{#if isAutomatic}
						{@const sources = getSkillSource(skill.name)}
						<div class="proficiency-badge automatic">
							Trained ({sources.join(' + ')})
						</div>
					{:else if isTrained}
						<div class="proficiency-badge trained">
							Trained
						</div>
					{:else}
						<div class="proficiency-badge untrained">
							Untrained
						</div>
					{/if}
				</div>

				{#if isTrained}
					<div class="selected-indicator" class:automatic-indicator={isAutomatic} aria-hidden="true">
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M16.6667 5L7.50004 14.1667L3.33337 10"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
				{/if}
			</button>
		{/each}
	</div>

	{#if !allSkillsSelected && additionalSkillCount > 0}
		<div class="validation-message">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
					fill="currentColor"
				/>
			</svg>
			Please select {remainingSelections} more {remainingSelections === 1 ? 'skill' : 'skills'}.
		</div>
	{/if}

</div>

<style>
	.skill-selector {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.selector-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.selector-title {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.selector-description {
		margin: 0;
		color: var(--text-secondary, #666666);
		line-height: 1.6;
	}

	.selection-counter {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background-color: var(--surface-2, #f5f5f5);
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

	/* Skill Grid */
	.skill-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}

	.skill-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 10px;
		cursor: pointer;
		transition: all var(--transition-fast);
		text-align: left;
		font-family: inherit;
		color: inherit;
	}

	.skill-card:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.skill-card.selectable:hover:not(:disabled) {
		border-color: var(--link-color, #5c7cfa);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	/* Manually trained skills - green */
	.skill-card.trained:not(.automatic) {
		background-color: rgba(55, 178, 77, 0.1);
		border-color: #37b24d;
	}

	/* Automatic skills - blue (takes precedence) */
	.skill-card.automatic {
		background-color: rgba(92, 124, 250, 0.1);
		border-color: var(--link-color, #5c7cfa);
		cursor: not-allowed;
	}

	.skill-card:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.skill-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.skill-modifier {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-secondary, #666666);
		min-width: 2.5rem;
		text-align: right;
	}

	.skill-modifier.trained {
		color: #37b24d;
	}

	.skill-modifier.automatic {
		color: var(--link-color, #5c7cfa);
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.skill-ability {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-secondary, #666666);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.skill-description {
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		line-height: 1.4;
	}

	.card-footer {
		margin-top: auto;
	}

	.proficiency-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.proficiency-badge.untrained {
		background-color: var(--surface-3, #e0e0e0);
		color: var(--text-secondary, #666666);
	}

	.proficiency-badge.trained {
		background-color: rgba(55, 178, 77, 0.2);
		color: #2b8a3e;
	}

	.proficiency-badge.automatic {
		background-color: rgba(92, 124, 250, 0.2);
		color: #4263eb;
	}

	.selected-indicator {
		position: absolute;
		bottom: 0.5rem;
		right: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background-color: #37b24d;
		border-radius: 50%;
		color: white;
	}

	.selected-indicator.automatic-indicator {
		background-color: var(--link-color, #5c7cfa);
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
		.skill-grid {
			grid-template-columns: 1fr;
		}

		.selector-title {
			font-size: 1.5rem;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.skill-card {
			border-width: 3px;
		}

		.skill-card.trained,
		.skill-card.automatic {
			border-width: 4px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.skill-card {
			transition: none;
		}

		.skill-card.selectable:hover:not(:disabled) {
			transform: none;
		}
	}
</style>
