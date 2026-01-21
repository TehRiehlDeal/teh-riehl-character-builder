<script lang="ts">
	import LevelUpModal from '$lib/components/features/LevelUpModal.svelte';
	import type {
		LevelUpChoice,
		PlannedSelection
	} from '$lib/components/features/LevelUpModal.svelte';
	import Button from '$lib/components/common/Button.svelte';

	let showModal = $state(false);
	let currentLevel = $state(4);
	let usePlannedSelections = $state(true);

	// Example planned selections
	const examplePlanned: PlannedSelection = {
		level: 5,
		choices: {
			classFeat: 'Power Attack',
			skillFeat: 'Intimidating Prowess',
			abilityBoosts: ['str', 'con', 'wis', 'cha'],
			skillIncrease: 'Athletics'
		}
	};

	const emptyPlanned: PlannedSelection = {
		level: 5,
		choices: {}
	};

	function handleLevelUp() {
		showModal = true;
	}

	function handleComplete(choices: LevelUpChoice) {
		console.log('Level-up completed with choices:', choices);
		currentLevel = 5;
		alert('Level-up completed! Check console for choices.');
	}

	function handleSkip() {
		console.log('Level-up skipped, applying planned selections');
		currentLevel = 5;
		alert('Skipped wizard and applied planned selections!');
	}

	function handleClose() {
		console.log('Level-up modal closed');
	}
</script>

<svelte:head>
	<title>Level-Up Demo - Character Builder</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<h1 class="page-title">Level-Up Experience Demo</h1>
		<p class="page-description">
			Test the level-up modal with different configurations.
		</p>
	</header>

	<div class="content-sections">
		<!-- Current State -->
		<section class="content-section">
			<h2 class="section-title">Current Character State</h2>
			<div class="character-info">
				<div class="info-item">
					<span class="info-label">Current Level:</span>
					<span class="info-value">{currentLevel}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Next Level:</span>
					<span class="info-value">{currentLevel + 1}</span>
				</div>
			</div>
		</section>

		<!-- Configuration -->
		<section class="content-section">
			<h2 class="section-title">Demo Configuration</h2>
			<div class="config-options">
				<label class="config-option">
					<input type="checkbox" bind:checked={usePlannedSelections} />
					<span>Use Planned Selections (pre-filled choices)</span>
				</label>
			</div>

			{#if usePlannedSelections}
				<div class="planned-preview">
					<h4>Planned Selections for Level {currentLevel + 1}:</h4>
					<ul>
						<li><strong>Class Feat:</strong> {examplePlanned.choices.classFeat}</li>
						<li><strong>Skill Feat:</strong> {examplePlanned.choices.skillFeat}</li>
						<li>
							<strong>Ability Boosts:</strong>
							{examplePlanned.choices.abilityBoosts?.join(', ')}
						</li>
						<li><strong>Skill Increase:</strong> {examplePlanned.choices.skillIncrease}</li>
					</ul>
				</div>
			{:else}
				<div class="no-planned">
					<p>No planned selections - modal will show empty choices for user to fill in.</p>
				</div>
			{/if}
		</section>

		<!-- Action -->
		<section class="content-section">
			<h2 class="section-title">Test Level-Up</h2>
			<div class="action-area">
				<Button variant="primary" size="lg" onclick={handleLevelUp}>
					Level Up to {currentLevel + 1}
				</Button>
			</div>

			<div class="feature-info">
				<h4>Features Demonstrated:</h4>
				<ul>
					<li>✨ Celebration animation (stars and title bounce)</li>
					<li>📋 Review planned selections or start fresh</li>
					<li>🎯 Step-by-step wizard (Review → Feats → Abilities → Skills → Confirm)</li>
					<li>⚡ Skip option for experienced users</li>
					<li>🎨 Respects prefers-reduced-motion setting</li>
					<li>✏️ Pre-fill from planning page</li>
					<li>↩️ Back/Next navigation through steps</li>
					<li>✅ Final confirmation with summary</li>
				</ul>
			</div>
		</section>

		<!-- Instructions -->
		<section class="content-section info-box">
			<h3>How to Test</h3>
			<ol>
				<li>Toggle "Use Planned Selections" to test with or without pre-filled choices</li>
				<li>Click "Level Up to 5" to open the modal</li>
				<li>Watch the celebration animation (disable in OS settings to test reduced motion)</li>
				<li>Try the "Skip & Apply" button on the review screen</li>
				<li>Or click "Continue" to go through the step-by-step wizard</li>
				<li>Use Back/Next buttons to navigate between steps</li>
				<li>Modify any pre-filled choices as needed</li>
				<li>Confirm to complete the level-up</li>
			</ol>

			<p class="note">
				<strong>Note:</strong> In the full application, this modal would be triggered automatically
				when the character gains enough XP or when the user manually increases the level. The feat/skill
				selections would open the actual feat picker components instead of text inputs.
			</p>
		</section>
	</div>
</div>

<!-- Level-Up Modal -->
<LevelUpModal
	bind:open={showModal}
	newLevel={currentLevel + 1}
	plannedSelection={usePlannedSelections ? examplePlanned : emptyPlanned}
	onComplete={handleComplete}
	onSkip={handleSkip}
	onClose={handleClose}
/>

<style>
	.page-content {
		max-width: 1000px;
		margin: 0 auto;
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
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		color: var(--text-primary, #1a1a1a);
	}

	.character-info {
		display: flex;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.info-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary, #666666);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.info-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--link-color, #5c7cfa);
	}

	.config-options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.config-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		font-size: 1rem;
	}

	.config-option input[type='checkbox'] {
		width: 1.25rem;
		height: 1.25rem;
		cursor: pointer;
	}

	.planned-preview {
		padding: 1rem;
		background-color: rgba(92, 124, 250, 0.1);
		border: 2px solid var(--link-color, #5c7cfa);
		border-radius: 6px;
	}

	.planned-preview h4 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.planned-preview ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.planned-preview li {
		margin-bottom: 0.5rem;
		font-size: 0.9375rem;
	}

	.no-planned {
		padding: 1rem;
		background-color: var(--surface-1, #ffffff);
		border: 2px dashed var(--border-color, #e0e0e0);
		border-radius: 6px;
		text-align: center;
	}

	.no-planned p {
		margin: 0;
		color: var(--text-secondary, #666666);
		font-style: italic;
	}

	.action-area {
		display: flex;
		justify-content: center;
		padding: 2rem;
		background-color: var(--surface-1, #ffffff);
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.feature-info {
		padding: 1rem;
		background-color: var(--surface-1, #ffffff);
		border-radius: 6px;
	}

	.feature-info h4 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.feature-info ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.feature-info li {
		margin-bottom: 0.5rem;
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	.info-box {
		background-color: #e3f2fd;
		border: 2px solid #2196f3;
	}

	.info-box h3 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1565c0;
	}

	.info-box ol {
		margin: 0 0 1rem 0;
		padding-left: 1.5rem;
	}

	.info-box li {
		margin-bottom: 0.5rem;
		font-size: 0.9375rem;
		line-height: 1.5;
		color: #1a1a1a;
	}

	.note {
		margin: 0;
		padding: 1rem;
		background-color: rgba(33, 150, 243, 0.1);
		border-left: 4px solid #2196f3;
		border-radius: 4px;
		font-size: 0.875rem;
		line-height: 1.5;
		color: #1a1a1a;
	}

	.note strong {
		color: #1565c0;
	}

	/* Mobile */
	@media (max-width: 768px) {
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

		.character-info {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>
