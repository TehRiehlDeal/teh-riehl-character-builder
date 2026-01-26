<script lang="ts">
	import { character } from '$lib/stores/character';
	import { getBuilderDataContext } from '$lib/contexts/builderDataContext.svelte';
	import type { Feat } from '$lib/data/types/app';
	import FeatPicker from '$lib/components/features/FeatPicker.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import Modal from '$lib/components/common/Modal.svelte';

	// Get shared data from context
	const builderData = getBuilderDataContext();

	// Modal state for feat selection
	let showFeatPicker = $state(false);
	let currentCategory = $state<'ancestry' | 'class' | 'skill' | 'general'>('ancestry');
	let currentLevel = $state(1);

	// Get feat slots from class
	const featSlots = $derived.by(() => {
		const selectedClass = builderData.classes.find((c) => c.name === $character.class.name);
		if (!selectedClass) {
			return { ancestry: [], class: [], skill: [], general: [] };
		}
		return selectedClass.featSlots;
	});

	// Get available feat slots for each category up to current level
	const availableSlots = $derived.by(() => {
		const slots = {
			ancestry: featSlots.ancestry.filter((level) => level <= $character.level),
			class: featSlots.class.filter((level) => level <= $character.level),
			skill: featSlots.skill.filter((level) => level <= $character.level),
			general: featSlots.general.filter((level) => level <= $character.level)
		};
		return slots;
	});

	// Get selected feats for each slot
	function getFeatForSlot(category: 'ancestry' | 'class' | 'skill' | 'general', level: number) {
		return $character.feats[category].find((f) => f.level === level);
	}

	// Check if a slot is filled
	function isSlotFilled(category: 'ancestry' | 'class' | 'skill' | 'general', level: number): boolean {
		return $character.feats[category].some((f) => f.level === level);
	}

	// Open feat picker for a specific slot
	function handleSelectFeat(category: 'ancestry' | 'class' | 'skill' | 'general', level: number) {
		currentCategory = category;
		currentLevel = level;
		showFeatPicker = true;
	}

	// Handle feat selection
	function handleFeatSelected(feat: Feat) {
		// Remove existing feat at this level if any
		const existingFeat = getFeatForSlot(currentCategory, currentLevel);
		if (existingFeat) {
			character.removeFeat(currentCategory, existingFeat.featId);
		}

		// Add new feat
		character.addFeat(currentCategory, currentLevel, feat.id, feat.name);
		showFeatPicker = false;
	}

	// Remove a feat
	function handleRemoveFeat(category: 'ancestry' | 'class' | 'skill' | 'general', featId: string) {
		const confirmed = confirm('Are you sure you want to remove this feat?');
		if (confirmed) {
			character.removeFeat(category, featId);
		}
	}

	// Get filtered feats for current picker
	const pickerFeats = $derived.by(() => {
		if (!showFeatPicker) return [];

		return builderData.feats.filter((feat) => {
			// Filter by category
			if (feat.category !== currentCategory) return false;

			// Filter by level (can't exceed slot level)
			if (feat.level > currentLevel) return false;

			// Filter by ancestry traits for ancestry feats
			if (currentCategory === 'ancestry' && $character.ancestry.name) {
				const ancestrySlug = $character.ancestry.name.toLowerCase();
				if (!feat.traits.includes(ancestrySlug)) return false;
			}

			// Filter by class traits for class feats
			if (currentCategory === 'class' && $character.class.name) {
				const classSlug = $character.class.name.toLowerCase();
				if (!feat.traits.includes(classSlug)) return false;
			}

			return true;
		});
	});

	// Get category display name
	function getCategoryName(category: string): string {
		return category.charAt(0).toUpperCase() + category.slice(1);
	}
</script>

<svelte:head>
	<title>Feats - Character Builder</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<h1 class="page-title">Feats</h1>
		<p class="page-description">
			Select feats for your character at each level. Feats provide special abilities and enhancements.
		</p>
	</header>

	{#if !$character.class.name}
		<div class="empty-state">
			<p class="empty-text">No Class Selected</p>
			<p class="empty-help">
				Select a class on the General tab to see available feat slots.
			</p>
		</div>
	{:else}
		<div class="content-sections">
			<!-- Ancestry Feats -->
			<section class="content-section" aria-labelledby="ancestry-feats">
				<h2 id="ancestry-feats" class="section-title">Ancestry Feats</h2>
				<p class="section-description">
					{#if $character.ancestry.name}
						{$character.ancestry.name} ancestry feats
					{:else}
						Select an ancestry on the General tab to see ancestry feats
					{/if}
				</p>

				{#if availableSlots.ancestry.length === 0}
					<p class="no-slots">No ancestry feat slots at level {$character.level}</p>
				{:else}
					<div class="feat-slots">
						{#each availableSlots.ancestry as level}
							{@const selectedFeat = getFeatForSlot('ancestry', level)}
							<div class="feat-slot" class:filled={isSlotFilled('ancestry', level)}>
								<div class="slot-header">
									<span class="slot-level">Level {level}</span>
									{#if selectedFeat}
										<span class="slot-status filled">Selected</span>
									{:else}
										<span class="slot-status empty">Empty</span>
									{/if}
								</div>

								{#if selectedFeat}
									<div class="selected-feat">
										<span class="feat-name">{selectedFeat.name}</span>
										<div class="feat-actions">
											<Button
												variant="secondary"
												size="sm"
												onclick={() => handleSelectFeat('ancestry', level)}
											>
												Change
											</Button>
											<Button
												variant="danger"
												size="sm"
												onclick={() => handleRemoveFeat('ancestry', selectedFeat.featId)}
											>
												Remove
											</Button>
										</div>
									</div>
								{:else}
									<Button
										variant="primary"
										size="sm"
										onclick={() => handleSelectFeat('ancestry', level)}
									>
										Select Feat
									</Button>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Class Feats -->
			<section class="content-section" aria-labelledby="class-feats">
				<h2 id="class-feats" class="section-title">Class Feats</h2>
				<p class="section-description">
					{$character.class.name} class feats
				</p>

				{#if availableSlots.class.length === 0}
					<p class="no-slots">No class feat slots at level {$character.level}</p>
				{:else}
					<div class="feat-slots">
						{#each availableSlots.class as level}
							{@const selectedFeat = getFeatForSlot('class', level)}
							{@const isAutoGranted = selectedFeat?.autoGranted ?? false}
							<div class="feat-slot" class:filled={isSlotFilled('class', level)} class:auto-granted={isAutoGranted}>
								<div class="slot-header">
									<span class="slot-level">Level {level}</span>
									{#if selectedFeat}
										{#if isAutoGranted}
											<span class="slot-status auto-granted">Auto-Granted</span>
										{:else}
											<span class="slot-status filled">Selected</span>
										{/if}
									{:else}
										<span class="slot-status empty">Empty</span>
									{/if}
								</div>

								{#if selectedFeat}
									<div class="selected-feat">
										<span class="feat-name">{selectedFeat.name}</span>
										{#if isAutoGranted}
											<p class="auto-granted-note">Granted by class archetype</p>
										{:else}
											<div class="feat-actions">
												<Button
													variant="secondary"
													size="sm"
													onclick={() => handleSelectFeat('class', level)}
												>
													Change
												</Button>
												<Button
													variant="danger"
													size="sm"
													onclick={() => handleRemoveFeat('class', selectedFeat.featId)}
												>
													Remove
												</Button>
											</div>
										{/if}
									</div>
								{:else}
									<Button
										variant="primary"
										size="sm"
										onclick={() => handleSelectFeat('class', level)}
									>
										Select Feat
									</Button>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Skill Feats -->
			<section class="content-section" aria-labelledby="skill-feats">
				<h2 id="skill-feats" class="section-title">Skill Feats</h2>
				<p class="section-description">
					Skill feats enhance your trained skills
				</p>

				{#if availableSlots.skill.length === 0}
					<p class="no-slots">No skill feat slots at level {$character.level}</p>
				{:else}
					<div class="feat-slots">
						{#each availableSlots.skill as level}
							{@const selectedFeat = getFeatForSlot('skill', level)}
							<div class="feat-slot" class:filled={isSlotFilled('skill', level)}>
								<div class="slot-header">
									<span class="slot-level">Level {level}</span>
									{#if selectedFeat}
										<span class="slot-status filled">Selected</span>
									{:else}
										<span class="slot-status empty">Empty</span>
									{/if}
								</div>

								{#if selectedFeat}
									<div class="selected-feat">
										<span class="feat-name">{selectedFeat.name}</span>
										<div class="feat-actions">
											<Button
												variant="secondary"
												size="sm"
												onclick={() => handleSelectFeat('skill', level)}
											>
												Change
											</Button>
											<Button
												variant="danger"
												size="sm"
												onclick={() => handleRemoveFeat('skill', selectedFeat.featId)}
											>
												Remove
											</Button>
										</div>
									</div>
								{:else}
									<Button
										variant="primary"
										size="sm"
										onclick={() => handleSelectFeat('skill', level)}
									>
										Select Feat
									</Button>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- General Feats -->
			<section class="content-section" aria-labelledby="general-feats">
				<h2 id="general-feats" class="section-title">General Feats</h2>
				<p class="section-description">
					General feats provide versatile character options
				</p>

				{#if availableSlots.general.length === 0}
					<p class="no-slots">No general feat slots at level {$character.level}</p>
				{:else}
					<div class="feat-slots">
						{#each availableSlots.general as level}
							{@const selectedFeat = getFeatForSlot('general', level)}
							<div class="feat-slot" class:filled={isSlotFilled('general', level)}>
								<div class="slot-header">
									<span class="slot-level">Level {level}</span>
									{#if selectedFeat}
										<span class="slot-status filled">Selected</span>
									{:else}
										<span class="slot-status empty">Empty</span>
									{/if}
								</div>

								{#if selectedFeat}
									<div class="selected-feat">
										<span class="feat-name">{selectedFeat.name}</span>
										<div class="feat-actions">
											<Button
												variant="secondary"
												size="sm"
												onclick={() => handleSelectFeat('general', level)}
											>
												Change
											</Button>
											<Button
												variant="danger"
												size="sm"
												onclick={() => handleRemoveFeat('general', selectedFeat.featId)}
											>
												Remove
											</Button>
										</div>
									</div>
								{:else}
									<Button
										variant="primary"
										size="sm"
										onclick={() => handleSelectFeat('general', level)}
									>
										Select Feat
									</Button>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</section>
		</div>
	{/if}
</div>

<!-- Feat Picker Modal -->
<Modal bind:open={showFeatPicker} size="xl" title="Select {getCategoryName(currentCategory)} Feat (Level {currentLevel})">
	<FeatPicker
		feats={pickerFeats}
		characterLevel={$character.level}
		filterCategory={currentCategory}
		filterLevel={currentLevel}
		onSelect={handleFeatSelected}
	/>
</Modal>

<style>
	.page-content {
		max-width: 1200px;
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

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 10px;
	}

	.empty-text {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: var(--text-secondary, #666666);
	}

	.empty-help {
		font-size: 1rem;
		margin: 0;
		color: var(--text-tertiary, #999999);
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
		margin: 0 0 0.5rem 0;
		color: var(--text-primary, #1a1a1a);
	}

	.section-description {
		font-size: 0.9375rem;
		margin: 0 0 1.5rem 0;
		color: var(--text-secondary, #666666);
	}

	.no-slots {
		font-size: 0.9375rem;
		font-style: italic;
		color: var(--text-tertiary, #999999);
		margin: 0;
	}

	.feat-slots {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
	}

	.feat-slot {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		transition: all var(--transition-fast);
	}

	.feat-slot.filled {
		border-color: var(--link-color, #5c7cfa);
		background-color: rgba(92, 124, 250, 0.05);
	}

	.feat-slot.auto-granted {
		border-color: var(--success-color, #37b24d);
		background-color: rgba(55, 178, 77, 0.05);
	}

	.feat-slot:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.slot-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.slot-level {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.slot-status {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	.slot-status.filled {
		background-color: rgba(55, 178, 77, 0.1);
		color: #37b24d;
	}

	.slot-status.empty {
		background-color: rgba(134, 142, 150, 0.1);
		color: #868e96;
	}

	.slot-status.auto-granted {
		background-color: rgba(55, 178, 77, 0.1);
		color: #37b24d;
	}

	.selected-feat {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.feat-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.feat-actions {
		display: flex;
		gap: 0.5rem;
	}

	.auto-granted-note {
		font-size: 0.875rem;
		font-style: italic;
		color: var(--success-color, #37b24d);
		margin: 0.5rem 0 0 0;
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

		.feat-slots {
			grid-template-columns: 1fr;
		}
	}

	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		.feat-slot {
			transition: none;
		}
	}
</style>
