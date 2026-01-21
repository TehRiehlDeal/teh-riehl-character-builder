<script lang="ts">
	import { onMount } from 'svelte';
	import Modal from '../common/Modal.svelte';
	import Button from '../common/Button.svelte';

	/**
	 * LevelUpModal Component
	 *
	 * Guides users through the level-up process with celebration and step-by-step prompts.
	 * Pre-fills selections from planned choices and allows confirmation or modification.
	 */

	export interface LevelUpChoice {
		classFeat?: string;
		ancestryFeat?: string;
		skillFeat?: string;
		generalFeat?: string;
		abilityBoosts?: string[];
		skillIncrease?: string;
		// Add other level-up choices as needed
	}

	export interface PlannedSelection {
		level: number;
		choices: LevelUpChoice;
	}

	interface Props {
		/** Whether the modal is open */
		open?: boolean;

		/** The level being leveled up to */
		newLevel: number;

		/** Planned selections for this level (from planning page) */
		plannedSelection?: PlannedSelection;

		/** Callback when level-up is completed */
		// eslint-disable-next-line no-unused-vars
		onComplete?: (choices: LevelUpChoice) => void;

		/** Callback when level-up is skipped */
		onSkip?: () => void;

		/** Callback when modal closes */
		onClose?: () => void;
	}

	let {
		open = $bindable(false),
		newLevel,
		plannedSelection,
		onComplete,
		onSkip,
		onClose
	}: Props = $props();

	// Multi-step flow
	type Step = 'celebration' | 'review' | 'feats' | 'abilities' | 'skills' | 'confirm';
	let currentStep = $state<Step>('celebration');
	let showCelebration = $state(true);

	// User choices (pre-filled from planned selections)
	let choices = $state<LevelUpChoice>(plannedSelection?.choices ?? {});

	// Check if user prefers reduced motion
	let prefersReducedMotion = $state(false);

	onMount(() => {
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = mediaQuery.matches;

		const handleChange = (e: MediaQueryListEvent) => {
			prefersReducedMotion = e.matches;
		};

		mediaQuery.addEventListener('change', handleChange);

		return () => {
			mediaQuery.removeEventListener('change', handleChange);
		};
	});

	// Skip celebration if reduced motion is preferred
	$effect(() => {
		if (open && prefersReducedMotion && currentStep === 'celebration') {
			// Auto-advance after brief delay
			setTimeout(() => {
				currentStep = 'review';
				showCelebration = false;
			}, 500);
		} else if (open && currentStep === 'celebration') {
			// Show celebration for 2 seconds
			setTimeout(() => {
				currentStep = 'review';
				showCelebration = false;
			}, 2000);
		}
	});

	// Reset when modal opens
	$effect(() => {
		if (open) {
			currentStep = 'celebration';
			showCelebration = true;
			choices = plannedSelection?.choices ?? {};
		}
	});

	function handleSkip() {
		onSkip?.();
		handleClose();
	}

	function handleComplete() {
		onComplete?.(choices);
		handleClose();
	}

	function handleClose() {
		open = false;
		onClose?.();
	}

	function nextStep() {
		if (currentStep === 'review') {
			currentStep = 'feats';
		} else if (currentStep === 'feats') {
			currentStep = 'abilities';
		} else if (currentStep === 'abilities') {
			currentStep = 'skills';
		} else if (currentStep === 'skills') {
			currentStep = 'confirm';
		}
	}

	function previousStep() {
		if (currentStep === 'confirm') {
			currentStep = 'skills';
		} else if (currentStep === 'skills') {
			currentStep = 'abilities';
		} else if (currentStep === 'abilities') {
			currentStep = 'feats';
		} else if (currentStep === 'feats') {
			currentStep = 'review';
		}
	}

	const stepTitles = {
		celebration: `Level ${newLevel}!`,
		review: 'Review Planned Choices',
		feats: 'Select Feats',
		abilities: 'Boost Abilities',
		skills: 'Increase Skills',
		confirm: 'Confirm Level-Up'
	};

	const hasPlannedChoices = $derived(
		plannedSelection && Object.keys(plannedSelection.choices).length > 0
	);
</script>

<Modal {open} size="lg" title={stepTitles[currentStep]} closeOnBackdrop={false}>
	<div class="level-up-modal">
		<!-- Celebration Step -->
		{#if currentStep === 'celebration'}
			<div class="celebration-container">
				{#if !prefersReducedMotion}
					<div class="celebration-animation">
						<div class="star star-1">★</div>
						<div class="star star-2">★</div>
						<div class="star star-3">★</div>
						<div class="star star-4">★</div>
						<div class="star star-5">★</div>
					</div>
				{/if}

				<div class="celebration-content">
					<h2 class="celebration-title">Level {newLevel}!</h2>
					<p class="celebration-message">
						Congratulations! Your character has reached level {newLevel}.
					</p>
				</div>
			</div>
		{/if}

		<!-- Review Step -->
		{#if currentStep === 'review'}
			<div class="step-content">
				<p class="step-description">
					{#if hasPlannedChoices}
						Review your planned selections for level {newLevel}. You can proceed with these choices
						or modify them in the following steps.
					{:else}
						No planned selections found for level {newLevel}. You'll need to make your choices in the
						following steps.
					{/if}
				</p>

				{#if hasPlannedChoices}
					<div class="planned-summary">
						<h4 class="summary-title">Planned Selections:</h4>
						<ul class="choice-list">
							{#if choices.classFeat}
								<li><strong>Class Feat:</strong> {choices.classFeat}</li>
							{/if}
							{#if choices.ancestryFeat}
								<li><strong>Ancestry Feat:</strong> {choices.ancestryFeat}</li>
							{/if}
							{#if choices.skillFeat}
								<li><strong>Skill Feat:</strong> {choices.skillFeat}</li>
							{/if}
							{#if choices.generalFeat}
								<li><strong>General Feat:</strong> {choices.generalFeat}</li>
							{/if}
							{#if choices.abilityBoosts && choices.abilityBoosts.length > 0}
								<li><strong>Ability Boosts:</strong> {choices.abilityBoosts.join(', ')}</li>
							{/if}
							{#if choices.skillIncrease}
								<li><strong>Skill Increase:</strong> {choices.skillIncrease}</li>
							{/if}
						</ul>
					</div>
				{/if}

				<div class="skip-option">
					<p class="skip-text">
						Experienced user? You can skip this wizard and apply your planned selections directly.
					</p>
					<Button variant="ghost" onclick={handleSkip}>
						Skip & Apply Planned Selections
					</Button>
				</div>
			</div>
		{/if}

		<!-- Feats Step -->
		{#if currentStep === 'feats'}
			<div class="step-content">
				<p class="step-description">
					Select your feats for level {newLevel}. Pre-filled selections are shown below.
				</p>

				<div class="feat-selections">
					{#if choices.classFeat !== undefined}
						<div class="selection-item">
							<label for="class-feat">Class Feat:</label>
							<input
								id="class-feat"
								type="text"
								bind:value={choices.classFeat}
								placeholder="Select a class feat..."
								class="feat-input"
							/>
						</div>
					{/if}

					{#if choices.ancestryFeat !== undefined}
						<div class="selection-item">
							<label for="ancestry-feat">Ancestry Feat:</label>
							<input
								id="ancestry-feat"
								type="text"
								bind:value={choices.ancestryFeat}
								placeholder="Select an ancestry feat..."
								class="feat-input"
							/>
						</div>
					{/if}

					{#if choices.skillFeat !== undefined}
						<div class="selection-item">
							<label for="skill-feat">Skill Feat:</label>
							<input
								id="skill-feat"
								type="text"
								bind:value={choices.skillFeat}
								placeholder="Select a skill feat..."
								class="feat-input"
							/>
						</div>
					{/if}

					{#if choices.generalFeat !== undefined}
						<div class="selection-item">
							<label for="general-feat">General Feat:</label>
							<input
								id="general-feat"
								type="text"
								bind:value={choices.generalFeat}
								placeholder="Select a general feat..."
								class="feat-input"
							/>
						</div>
					{/if}
				</div>

				<p class="help-text">
					Note: In the full implementation, these would open feat pickers with filtering based on
					level and prerequisites.
				</p>
			</div>
		{/if}

		<!-- Abilities Step -->
		{#if currentStep === 'abilities'}
			<div class="step-content">
				<p class="step-description">
					{#if choices.abilityBoosts && choices.abilityBoosts.length > 0}
						You gain ability boosts at level {newLevel}. Your planned boosts are shown below.
					{:else}
						You gain ability boosts at level {newLevel}. Select which abilities to increase.
					{/if}
				</p>

				<div class="ability-boosts">
					{#if choices.abilityBoosts}
						<div class="boost-display">
							<strong>Planned Boosts:</strong>
							<div class="boost-badges">
								{#each choices.abilityBoosts as boost}
									<span class="boost-badge">{boost.toUpperCase()}</span>
								{/each}
							</div>
						</div>
					{:else}
						<p class="no-boosts">No ability boosts at this level.</p>
					{/if}
				</div>

				<p class="help-text">
					Note: In the full implementation, this would show an interactive ability boost selector.
				</p>
			</div>
		{/if}

		<!-- Skills Step -->
		{#if currentStep === 'skills'}
			<div class="step-content">
				<p class="step-description">
					{#if choices.skillIncrease}
						Increase your proficiency in a skill. Your planned choice: {choices.skillIncrease}
					{:else}
						You gain a skill increase at level {newLevel}. Select a skill to improve.
					{/if}
				</p>

				<div class="skill-increase">
					{#if choices.skillIncrease}
						<div class="selection-item">
							<label for="skill-increase">Skill Increase:</label>
							<input
								id="skill-increase"
								type="text"
								bind:value={choices.skillIncrease}
								placeholder="Select a skill..."
								class="feat-input"
							/>
						</div>
					{:else}
						<p class="no-skills">No skill increases at this level.</p>
					{/if}
				</div>

				<p class="help-text">
					Note: In the full implementation, this would show available skills with current proficiency
					levels.
				</p>
			</div>
		{/if}

		<!-- Confirm Step -->
		{#if currentStep === 'confirm'}
			<div class="step-content">
				<p class="step-description">
					Review your final selections and confirm to level up to {newLevel}.
				</p>

				<div class="final-summary">
					<h4 class="summary-title">Final Selections:</h4>
					<ul class="choice-list">
						{#if choices.classFeat}
							<li><strong>Class Feat:</strong> {choices.classFeat}</li>
						{/if}
						{#if choices.ancestryFeat}
							<li><strong>Ancestry Feat:</strong> {choices.ancestryFeat}</li>
						{/if}
						{#if choices.skillFeat}
							<li><strong>Skill Feat:</strong> {choices.skillFeat}</li>
						{/if}
						{#if choices.generalFeat}
							<li><strong>General Feat:</strong> {choices.generalFeat}</li>
						{/if}
						{#if choices.abilityBoosts && choices.abilityBoosts.length > 0}
							<li><strong>Ability Boosts:</strong> {choices.abilityBoosts.join(', ')}</li>
						{/if}
						{#if choices.skillIncrease}
							<li><strong>Skill Increase:</strong> {choices.skillIncrease}</li>
						{/if}
					</ul>
				</div>

				<div class="confirm-warning">
					<strong>⚠️ Important:</strong> Once confirmed, these selections will be applied to your
					character. You can always modify them later from the character sheet.
				</div>
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="modal-footer-actions">
			{#if currentStep !== 'celebration' && currentStep !== 'review'}
				<Button variant="ghost" onclick={previousStep}>Back</Button>
			{/if}

			{#if currentStep === 'review'}
				<Button variant="primary" onclick={nextStep}>Continue</Button>
			{:else if currentStep === 'confirm'}
				<Button variant="primary" onclick={handleComplete}>Confirm & Level Up</Button>
			{:else if currentStep !== 'celebration'}
				<Button variant="primary" onclick={nextStep}>Next</Button>
			{/if}

			{#if currentStep !== 'celebration'}
				<Button variant="ghost" onclick={handleClose}>Cancel</Button>
			{/if}
		</div>
	{/snippet}
</Modal>

<style>
	.level-up-modal {
		min-height: 300px;
	}

	/* Celebration Animation */
	.celebration-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 400px;
	}

	.celebration-animation {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.star {
		position: absolute;
		font-size: 3rem;
		color: #ffd700;
		animation: float-up 2s ease-out forwards;
		opacity: 0;
	}

	.star-1 {
		left: 20%;
		top: 50%;
		animation-delay: 0s;
	}

	.star-2 {
		left: 40%;
		top: 60%;
		animation-delay: 0.2s;
	}

	.star-3 {
		left: 50%;
		top: 40%;
		animation-delay: 0.4s;
	}

	.star-4 {
		left: 60%;
		top: 55%;
		animation-delay: 0.6s;
	}

	.star-5 {
		left: 80%;
		top: 45%;
		animation-delay: 0.8s;
	}

	@keyframes float-up {
		0% {
			transform: translateY(0) scale(0);
			opacity: 0;
		}
		50% {
			opacity: 1;
		}
		100% {
			transform: translateY(-100px) scale(1.5);
			opacity: 0;
		}
	}

	.celebration-content {
		text-align: center;
		z-index: 1;
	}

	.celebration-title {
		font-size: 3rem;
		font-weight: 700;
		color: var(--link-color, #5c7cfa);
		margin: 0 0 1rem 0;
		animation: title-bounce 0.6s ease-out;
	}

	@keyframes title-bounce {
		0% {
			transform: scale(0);
		}
		50% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
		}
	}

	.celebration-message {
		font-size: 1.25rem;
		color: var(--text-primary, #1a1a1a);
		margin: 0;
		animation: fade-in 1s ease-out 0.3s both;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Step Content */
	.step-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.step-description {
		margin: 0;
		font-size: 1rem;
		line-height: 1.6;
		color: var(--text-primary, #1a1a1a);
	}

	.planned-summary,
	.final-summary {
		padding: 1.5rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
		border-left: 4px solid var(--link-color, #5c7cfa);
	}

	.summary-title {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.choice-list {
		margin: 0;
		padding-left: 1.5rem;
		list-style: none;
	}

	.choice-list li {
		margin-bottom: 0.75rem;
		font-size: 0.9375rem;
		line-height: 1.5;
		color: var(--text-primary, #1a1a1a);
	}

	.choice-list li:last-child {
		margin-bottom: 0;
	}

	.choice-list li::before {
		content: '✓';
		color: var(--success-color, #28a745);
		font-weight: 700;
		margin-right: 0.5rem;
	}

	.skip-option {
		padding: 1.5rem;
		background-color: rgba(108, 117, 125, 0.1);
		border: 2px dashed var(--border-color, #e0e0e0);
		border-radius: 8px;
		text-align: center;
	}

	.skip-text {
		margin: 0 0 1rem 0;
		font-size: 0.9375rem;
		color: var(--text-secondary, #666666);
	}

	.feat-selections,
	.ability-boosts,
	.skill-increase {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.selection-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.selection-item label {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.feat-input {
		padding: 0.75rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-size: 1rem;
		font-family: inherit;
	}

	.feat-input:focus {
		outline: none;
		border-color: var(--focus-color, #5c7cfa);
	}

	.boost-display {
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 6px;
	}

	.boost-display strong {
		display: block;
		margin-bottom: 0.75rem;
		color: var(--text-primary, #1a1a1a);
	}

	.boost-badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.boost-badge {
		padding: 0.5rem 1rem;
		background-color: var(--link-color, #5c7cfa);
		color: white;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.no-boosts,
	.no-skills {
		margin: 0;
		padding: 1.5rem;
		text-align: center;
		color: var(--text-secondary, #666666);
		font-style: italic;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 6px;
	}

	.help-text {
		margin: 0;
		padding: 1rem;
		background-color: rgba(92, 124, 250, 0.05);
		border: 1px solid rgba(92, 124, 250, 0.2);
		border-radius: 6px;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		font-style: italic;
	}

	.confirm-warning {
		padding: 1rem;
		background-color: rgba(255, 193, 7, 0.1);
		border: 2px solid var(--warning-color, #ffc107);
		border-radius: 6px;
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	.confirm-warning strong {
		color: var(--text-primary, #1a1a1a);
	}

	.modal-footer-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		width: 100%;
	}

	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		.star {
			animation: none;
		}

		.celebration-title {
			animation: none;
		}

		.celebration-message {
			animation: none;
			opacity: 1;
		}
	}

	/* Mobile */
	@media (max-width: 640px) {
		.celebration-title {
			font-size: 2rem;
		}

		.celebration-message {
			font-size: 1rem;
		}

		.modal-footer-actions {
			flex-direction: column-reverse;
		}

		.star {
			font-size: 2rem;
		}
	}
</style>
