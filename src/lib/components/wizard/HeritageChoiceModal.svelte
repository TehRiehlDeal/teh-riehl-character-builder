<script lang="ts">
	/**
	 * Heritage Choice Modal
	 *
	 * A modal for selecting feats/items for heritage choices (e.g., Ancient Elf dedication selection).
	 * NOTE: This component is deprecated. New code should use ItemSelectionModal instead.
	 * Uses a split-panel layout for feat selection.
	 */

	import type { Feat } from '$lib/data/types/app';
	import type { ChoiceBenefit } from '$lib/data/processors/heritageRuleProcessor';
	import Modal from '$lib/components/common/Modal.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import RichDescription from '$lib/components/common/RichDescription.svelte';

	interface Props {
		/** The choice configuration from the heritage */
		choice: ChoiceBenefit;
		/** Available feats to choose from (already filtered) */
		availableFeats: Feat[];
		/** Currently selected feat UUID (if any) */
		selectedValue?: string;
		/** Callback when a feat is selected */
		onSelect: (value: string) => void;
		/** Whether the selector is disabled */
		disabled?: boolean;
		/** Loading state */
		loading?: boolean;
		/** Character's ability scores for prerequisite checking */
		abilityScores?: Record<string, number>;
		/** Character's trained skills for prerequisite checking */
		trainedSkills?: string[];
	}

	let {
		choice,
		availableFeats,
		selectedValue = undefined,
		onSelect,
		disabled = false,
		loading = false,
		abilityScores = {},
		trainedSkills = []
	}: Props = $props();

	// Modal state
	let modalOpen = $state(false);
	let selectedInModal = $state<string | undefined>(undefined);
	let searchQuery = $state('');

	// Get currently selected feat from the list
	const selectedFeat = $derived(
		selectedValue
			? availableFeats.find((f) => selectedValue.includes(f.id))
			: undefined
	);

	// Get feat being previewed in modal
	const previewFeat = $derived(
		selectedInModal ? availableFeats.find((f) => selectedInModal?.includes(f.id)) : undefined
	);

	// Filter feats by search query
	const filteredFeats = $derived(
		availableFeats.filter(
			(feat) =>
				feat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				feat.traits.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
		)
	);

	// Get human-readable label from the prompt
	const choiceLabel = $derived(getPromptLabel(choice.prompt));

	function getPromptLabel(prompt: string): string {
		// Map common localization keys to human-readable labels
		const promptMap: Record<string, string> = {
			'PF2E.SpecificRule.AncientElf.Prompt': 'Select a Multiclass Dedication',
			'PF2E.SpecificRule.Prompt.Dedication': 'Select a Dedication',
			'PF2E.SpecificRule.Prompt.Feat': 'Select a Feat'
		};

		return promptMap[prompt] || prompt.replace('PF2E.SpecificRule.', '').replace('.Prompt', '');
	}

	function openModal() {
		if (disabled || loading) return;
		selectedInModal = selectedValue;
		searchQuery = '';
		modalOpen = true;
	}

	function handleAccept() {
		if (selectedInModal) {
			// Format as Foundry UUID
			const uuid = selectedInModal.startsWith('Compendium.')
				? selectedInModal
				: `Compendium.pf2e.feats-srd.Item.${selectedInModal}`;
			onSelect(uuid);
			modalOpen = false;
		}
	}

	function handleCancel() {
		modalOpen = false;
		selectedInModal = undefined;
	}

	function handleFeatClick(featId: string) {
		selectedInModal = featId;
	}

	function checkPrerequisites(feat: Feat): { met: boolean; unmetReasons: string[] } {
		const unmetReasons: string[] = [];

		if (!feat.prerequisites || feat.prerequisites.length === 0) {
			return { met: true, unmetReasons: [] };
		}

		for (const prereq of feat.prerequisites) {
			const prereqLower = prereq.toLowerCase();

			// Skip level prerequisites - bypassed by Ancient Elf heritage
			if (prereqLower.includes('level')) {
				continue;
			}

			// Check ability score prerequisites
			// Format can be either "Strength 14" (score) or "Strength +2" (modifier)
			const abilityScoreMatch = prereq.match(/^(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+(\d+)/i);
			const abilityModifierMatch = prereq.match(/^(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+\+(\d+)/i);

			if (abilityScoreMatch || abilityModifierMatch) {
				const match = abilityScoreMatch || abilityModifierMatch;
				const abilityName = match![1]; // Keep original casing
				const value = parseInt(match![2], 10);

				// Convert modifier to required score if needed
				// +0 = 10, +1 = 12, +2 = 14, +3 = 16, etc.
				const requiredScore = abilityModifierMatch ? 10 + (value * 2) : value;

				// Try both the original case and lowercase versions
				const currentScore = abilityScores[abilityName] || abilityScores[abilityName.toLowerCase()] || 10;

				if (currentScore < requiredScore) {
					unmetReasons.push(prereq);
				}
				continue;
			}

			// Check trained skill prerequisites (e.g., "trained in Religion")
			const trainedMatch = prereq.match(/trained in (\w+)/i);
			if (trainedMatch) {
				const skillName = trainedMatch[1].toLowerCase();
				const isTrainedInSkill = trainedSkills.some(s => s.toLowerCase() === skillName);

				if (!isTrainedInSkill) {
					unmetReasons.push(prereq);
				}
				continue;
			}

			// For other prerequisites (feats, deity, etc.), we can't check them here
			// So don't add them to unmet reasons - assume they might be met or not applicable
		}

		return { met: unmetReasons.length === 0, unmetReasons };
	}
</script>

<div class="heritage-choice-selector">
	<div class="selector-label">
		{choiceLabel}:
	</div>

	<button
		class="selector-button"
		class:has-selection={!!selectedFeat}
		class:disabled={disabled || loading}
		onclick={openModal}
		type="button"
		disabled={disabled || loading}
	>
		{#if loading}
			<span class="button-text loading">Loading...</span>
		{:else if selectedFeat}
			<span class="button-text selected">{selectedFeat.name}</span>
			<span class="feat-level">Level {selectedFeat.level}</span>
		{:else}
			<span class="button-text placeholder">Select...</span>
		{/if}
	</button>
</div>

{#if modalOpen}
	<Modal open={modalOpen} title={choiceLabel} onClose={handleCancel} size="xl">
		<div class="modal-content">
			<!-- Search bar -->
			<div class="search-bar">
				<input
					type="text"
					class="search-input"
					placeholder="Search by name or trait..."
					bind:value={searchQuery}
					autofocus
				/>
				<span class="search-count">{filteredFeats.length} options</span>
			</div>

			<div class="split-layout">
				<!-- Left panel: Feat list -->
				<div class="feat-list-panel">
					<div class="feat-list">
						{#if filteredFeats.length === 0}
							<div class="no-results">
								{#if searchQuery}
									No options match "{searchQuery}"
								{:else}
									No options available
								{/if}
							</div>
						{:else}
							{#each filteredFeats as feat}
								{@const prereqCheck = checkPrerequisites(feat)}
								{@const isSelected = selectedInModal === feat.id || selectedInModal?.includes(feat.id)}

								<button
									class="feat-item"
									class:selected={isSelected}
									class:has-unmet-prereqs={prereqCheck.unmetReasons.length > 0}
									onclick={() => handleFeatClick(feat.id)}
									type="button"
								>
									<div class="feat-item-header">
										<span class="feat-name">{feat.name}</span>
										<span class="feat-level">Level {feat.level}</span>
									</div>

									{#if feat.traits && feat.traits.length > 0}
										<div class="feat-traits">
											{#each feat.traits as trait}
												<span class="trait-badge">{trait}</span>
											{/each}
										</div>
									{/if}

									{#if prereqCheck.unmetReasons.length > 0}
										<div class="prerequisites unmet">
											<strong>Prerequisites not met:</strong>
											{prereqCheck.unmetReasons.join(', ')}
										</div>
									{:else if feat.prerequisites && feat.prerequisites.length > 0}
										<div class="prerequisites met">
											<strong>Prerequisites:</strong>
											{feat.prerequisites.join(', ')}
											{#if feat.prerequisites.some(p => p.toLowerCase().includes('level'))}
												<span class="bypass-note">(level requirement bypassed)</span>
											{/if}
										</div>
									{/if}
								</button>
							{/each}
						{/if}
					</div>
				</div>

				<!-- Right panel: Detail view -->
				<div class="detail-panel">
					{#if previewFeat}
						<div class="feat-detail">
							<h3 class="detail-title">{previewFeat.name}</h3>

							<div class="detail-metadata">
								<div class="metadata-item">
									<strong>Level:</strong>
									{previewFeat.level}
								</div>
								{#if previewFeat.prerequisites && previewFeat.prerequisites.length > 0}
									<div class="metadata-item">
										<strong>Prerequisites:</strong>
										{previewFeat.prerequisites.join(', ')}
									</div>
								{/if}
								{#if previewFeat.traits && previewFeat.traits.length > 0}
									<div class="metadata-item">
										<strong>Traits:</strong>
										<div class="traits-list">
											{#each previewFeat.traits as trait}
												<span class="trait-badge">{trait}</span>
											{/each}
										</div>
									</div>
								{/if}
							</div>

							{#if previewFeat.description}
								<div class="detail-description">
									<RichDescription content={previewFeat.description} />
								</div>
							{/if}
						</div>
					{:else}
						<div class="no-selection">
							<p>Select an option from the list to see details</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#snippet footer()}
			<Button variant="secondary" onclick={handleCancel}>Cancel</Button>
			<Button variant="primary" disabled={!selectedInModal} onclick={handleAccept}>
				Select
			</Button>
		{/snippet}
	</Modal>
{/if}

<style>
	.heritage-choice-selector {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.selector-label {
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.selector-button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background-color: var(--surface-1, #ffffff);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		cursor: pointer;
		transition: all var(--transition-fast);
		min-height: 48px;
	}

	.selector-button:hover:not(.disabled) {
		border-color: var(--link-color, #5c7cfa);
		background-color: var(--surface-2, #f5f5f5);
	}

	.selector-button.has-selection {
		background-color: rgba(92, 124, 250, 0.05);
	}

	.selector-button.disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.button-text {
		font-size: 1rem;
	}

	.button-text.placeholder {
		color: var(--text-tertiary, #999999);
	}

	.button-text.selected {
		color: var(--text-primary, #1a1a1a);
		font-weight: 500;
	}

	.button-text.loading {
		color: var(--text-secondary, #666666);
	}

	.feat-level {
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		padding: 0.25rem 0.5rem;
		background-color: var(--surface-3, #e0e0e0);
		border-radius: 4px;
	}

	/* Modal content */
	.modal-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 70vh;
		max-height: 600px;
	}

	.search-bar {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		padding-bottom: 0.75rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.search-input {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		font-size: 1rem;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--link-color, #5c7cfa);
	}

	.search-count {
		color: var(--text-secondary, #666666);
		font-size: 0.875rem;
		white-space: nowrap;
	}

	.split-layout {
		display: grid;
		grid-template-columns: 1fr 1.5fr;
		gap: 1.5rem;
		overflow: hidden;
		flex: 1;
	}

	.feat-list-panel {
		overflow-y: auto;
		border-right: 2px solid var(--border-color, #e0e0e0);
		padding-right: 1rem;
	}

	.feat-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.feat-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		cursor: pointer;
		transition: all var(--transition-fast);
		text-align: left;
	}

	.feat-item:hover {
		border-color: var(--link-color, #5c7cfa);
	}

	.feat-item.selected {
		background-color: rgba(92, 124, 250, 0.1);
		border-color: var(--link-color, #5c7cfa);
		border-width: 3px;
	}

	.feat-item.has-unmet-prereqs {
		border-color: #ffc107;
		background-color: rgba(255, 193, 7, 0.05);
	}

	.feat-item.has-unmet-prereqs .feat-name {
		color: #856404;
	}

	.feat-item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.feat-name {
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.feat-traits {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.trait-badge {
		padding: 0.125rem 0.375rem;
		background-color: var(--surface-1, #ffffff);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
	}

	.prerequisites {
		font-size: 0.875rem;
		padding: 0.5rem;
		border-radius: 4px;
		margin-top: 0.5rem;
	}

	.prerequisites.met {
		background-color: rgba(40, 167, 69, 0.1);
		color: #155724;
		border: 1px solid rgba(40, 167, 69, 0.3);
	}

	.prerequisites.unmet {
		background-color: rgba(255, 193, 7, 0.1);
		color: #856404;
		border: 1px solid rgba(255, 193, 7, 0.5);
	}

	.prerequisites strong {
		color: inherit;
	}

	.bypass-note {
		font-style: italic;
		font-size: 0.8rem;
		opacity: 0.85;
		margin-left: 0.25rem;
	}

	.detail-panel {
		overflow-y: auto;
	}

	.feat-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.detail-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.detail-metadata {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
	}

	.metadata-item {
		line-height: 1.6;
	}

	.metadata-item strong {
		color: var(--text-primary, #1a1a1a);
		margin-right: 0.5rem;
	}

	.traits-list {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-top: 0.5rem;
	}

	.detail-description {
		line-height: 1.6;
		color: var(--text-primary, #1a1a1a);
	}

	.no-results,
	.no-selection {
		padding: 3rem;
		text-align: center;
		color: var(--text-secondary, #666666);
	}

	@media (max-width: 768px) {
		.split-layout {
			grid-template-columns: 1fr;
		}

		.feat-list-panel {
			border-right: none;
			padding-right: 0;
			max-height: 300px;
		}

		.detail-panel {
			border-top: 2px solid var(--border-color, #e0e0e0);
			padding-top: 1rem;
		}
	}
</style>
