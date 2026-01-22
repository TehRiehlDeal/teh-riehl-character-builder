<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { Spell } from '$lib/data/types/app';
	import { getAllSpells } from '$lib/data/repositories/spellRepository';
	import { character } from '$lib/stores/character';
	import FocusPointTracker from '$lib/components/spellcasting/FocusPointTracker.svelte';
	import SpellList from '$lib/components/spellcasting/SpellList.svelte';
	import SpellDetail from '$lib/components/spellcasting/SpellDetail.svelte';
	import SpellcastingInfo from '$lib/components/spellcasting/SpellcastingInfo.svelte';
	import SpellSlotGrid from '$lib/components/spellcasting/SpellSlotGrid.svelte';
	import Button from '$lib/components/common/Button.svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import {
		isSpellcaster,
		resolveSpellTradition,
		getSpellSlotsForLevel,
		getMaxSpellLevel,
		getCantripsKnownCount,
		getSpellcastingConfig,
		classRequiresPreparation,
		hasSpellbook,
		getSpellbookCapacity
	} from '$lib/utils/spellcasting';

	let spells = $state<Spell[]>([]);
	let loading = $state(true);
	let selectedSpell = $state<Spell | null>(null);
	let showSpellDetail = $state(false);

	// State for slot selection modal
	let showSlotSelectModal = $state(false);
	let selectingSlotLevel = $state<number | 'cantrip'>(0);
	let selectingSlotIndex = $state(0);

	// Derived values from character
	const className = $derived($character.class.name);
	const characterLevel = $derived($character.level);
	const ruleSelections = $derived($character.ruleSelections);

	// Check if the character is a spellcaster
	const hasSpellcasting = $derived(className ? isSpellcaster(className) : false);

	// Resolve spell tradition from class and selections
	const resolvedTradition = $derived(resolveSpellTradition(className, ruleSelections));

	// Get spellcasting config
	const spellcastingConfig = $derived(className ? getSpellcastingConfig(className) : null);
	const spellcastingType = $derived(spellcastingConfig?.type ?? null);

	// Check if this caster requires preparation (prepared AND bounded casters)
	const requiresPreparation = $derived(
		className ? classRequiresPreparation(className) : false
	);

	// Check if class has a spellbook
	const classHasSpellbook = $derived(className ? hasSpellbook(className) : false);

	// Get spellbook capacity
	const spellbookCapacity = $derived(
		className ? getSpellbookCapacity(className, characterLevel) : { cantrips: 0, spells: {} }
	);

	// Get max spell level available
	const maxSpellLevel = $derived(getMaxSpellLevel(characterLevel));

	// Get cantrips limit (for prepared slots, not spellbook)
	const cantripsLimit = $derived(
		className ? getCantripsKnownCount(className, characterLevel) : 0
	);

	// Create spell ID map for quick lookup
	const spellsByIdMap = $derived.by(() => {
		const map = new Map<string, Spell>();
		for (const spell of spells) {
			map.set(spell.id, spell);
		}
		return map;
	});

	// Get all spell IDs in spellbook (for Available Spells "In Spellbook" badge)
	const spellbookIds = $derived.by(() => {
		return [
			...$character.spellcasting.knownSpells,
			...$character.spellcasting.cantripsKnown
		];
	});

	// Get spells available for selection based on current slot
	const spellsForSlotSelection = $derived.by(() => {
		if (selectingSlotLevel === 'cantrip') {
			// Show cantrips from spellbook
			return $character.spellcasting.cantripsKnown
				.map(id => spellsByIdMap.get(id))
				.filter((s): s is Spell => s !== undefined);
		} else {
			// Show spells of the appropriate level from spellbook
			return $character.spellcasting.knownSpells
				.map(id => spellsByIdMap.get(id))
				.filter((s): s is Spell => s !== undefined && s.level === selectingSlotLevel);
		}
	});

	// Initialize spellcasting when class or level changes
	$effect(() => {
		// Read reactive dependencies
		const currentClassName = className;
		const currentLevel = characterLevel;
		const currentHasSpellcasting = hasSpellcasting;
		const currentTradition = resolvedTradition;
		const currentType = spellcastingType;
		const currentCantripsLimit = cantripsLimit;

		// Perform updates inside untrack to avoid creating new dependencies
		untrack(() => {
			if (currentClassName && currentHasSpellcasting) {
				// Set spellcasting info (method is idempotent - only updates if changed)
				character.setSpellcastingInfo(currentTradition, currentType);

				// Initialize prepared slots (method is idempotent - only updates if changed)
				const expectedSlots = getSpellSlotsForLevel(currentClassName, currentLevel);
				character.initializePreparedSlots(
					currentCantripsLimit,
					expectedSlots.map(s => ({ level: s.level, count: s.total }))
				);
			} else if (!currentHasSpellcasting) {
				// Clear spellcasting (method is idempotent - only updates if not already cleared)
				character.clearSpellcasting();
			}
		});
	});

	onMount(async () => {
		try {
			spells = await getAllSpells();
		} catch (error) {
			console.error('Failed to load spells:', error);
		} finally {
			loading = false;
		}
	});

	function handleFocusChange(current: number) {
		character.updateFocusPoints(current);
	}

	function handleRecoverAllSlots() {
		character.recoverAllPreparedSlots();
	}

	function handleViewDetails(spell: Spell) {
		selectedSpell = spell;
		showSpellDetail = true;
	}

	function handleCloseDetail() {
		showSpellDetail = false;
		selectedSpell = null;
	}

	// Add spell to spellbook
	function handleAddToSpellbook(spell: Spell) {
		if (spell.level === 0) {
			character.addCantrip(spell.id);
		} else {
			character.addKnownSpell(spell.id);
		}
	}

	// Remove spell from spellbook
	function handleRemoveFromSpellbook(spellId: string) {
		character.removeKnownSpell(spellId);
	}

	// Remove cantrip from spellbook
	function handleRemoveCantrip(spellId: string) {
		character.removeCantrip(spellId);
	}

	// Open slot selection modal for cantrip
	function handleSelectCantripSlot(slotIndex: number) {
		selectingSlotLevel = 'cantrip';
		selectingSlotIndex = slotIndex;
		showSlotSelectModal = true;
	}

	// Open slot selection modal for leveled spell
	function handleSelectSpellSlot(level: number, slotIndex: number) {
		selectingSlotLevel = level;
		selectingSlotIndex = slotIndex;
		showSlotSelectModal = true;
	}

	// Prepare a spell into the selected slot
	function handlePrepareSpellInSlot(spell: Spell) {
		if (selectingSlotLevel === 'cantrip') {
			character.prepareCantripInSlot(selectingSlotIndex, spell.id);
		} else {
			character.prepareSpellInSlot(selectingSlotLevel, selectingSlotIndex, spell.id);
		}
		showSlotSelectModal = false;
	}

	// Remove cantrip from slot
	function handleRemoveCantripFromSlot(slotIndex: number) {
		character.removeCantripFromSlot(slotIndex);
	}

	// Remove spell from slot
	function handleRemoveSpellFromSlot(level: number, slotIndex: number) {
		character.removeSpellFromSlot(level, slotIndex);
	}

	// Cast a spell from slot
	function handleCastSpellFromSlot(level: number, slotIndex: number) {
		character.castSpellFromSlot(level, slotIndex);
	}

	function closeSlotSelectModal() {
		showSlotSelectModal = false;
	}
</script>

<svelte:head>
	<title>Spells - Character Builder</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<h1 class="page-title">Spellcasting</h1>
		<p class="page-description">
			Manage your spellbook, prepare spells, and track spell slots.
		</p>
	</header>

	<div class="content-sections">
		<!-- Non-Caster Message -->
		{#if !hasSpellcasting}
			<section class="content-section non-caster" aria-labelledby="no-spellcasting">
				<h2 id="no-spellcasting" class="section-title">No Spellcasting</h2>
				<div class="section-body">
					<p>
						{#if className}
							Your current class ({className}) does not have spellcasting abilities.
						{:else}
							Select a class to see your spellcasting options.
						{/if}
					</p>
					<p class="hint">
						Spellcasting classes include Wizard, Cleric, Druid, Bard, Sorcerer, Oracle, Witch,
						Psychic, Magus, and Summoner.
					</p>
				</div>
			</section>
		{:else}
			<!-- Spellcasting Info -->
			<section class="content-section" aria-labelledby="spellcasting-info">
				<h2 id="spellcasting-info" class="section-title">Spellcasting Overview</h2>
				<div class="section-body">
					<SpellcastingInfo
						{className}
						{characterLevel}
						tradition={resolvedTradition}
						{spellcastingType}
					/>
				</div>
			</section>

			<!-- Focus Points Section -->
			{#if $character.spellcasting.focusPoints.max > 0}
				<section class="content-section" aria-labelledby="focus-points">
					<h2 id="focus-points" class="section-title">Focus Points</h2>
					<div class="section-body">
						<FocusPointTracker
							max={$character.spellcasting.focusPoints.max}
							current={$character.spellcasting.focusPoints.current}
							onChange={handleFocusChange}
						/>
					</div>
				</section>
			{/if}

			<!-- Prepared Spells / Spell Slots Section -->
			{#if requiresPreparation}
				<section class="content-section" aria-labelledby="spell-slots">
					<div class="section-header-row">
						<h2 id="spell-slots" class="section-title">Prepared Spells</h2>
						<Button variant="secondary" size="sm" onclick={handleRecoverAllSlots}>
							Daily Preparation
						</Button>
					</div>
					<p class="section-description">
						Select spells from your spellbook to prepare in each slot. Cast spells to mark slots as used.
					</p>
					<div class="section-body">
						<SpellSlotGrid
							preparedCantrips={$character.spellcasting.preparedCantrips}
							preparedSlots={$character.spellcasting.preparedSlots}
							{spellsByIdMap}
							onSelectCantripSlot={handleSelectCantripSlot}
							onSelectSpellSlot={handleSelectSpellSlot}
							onRemoveCantripFromSlot={handleRemoveCantripFromSlot}
							onRemoveSpellFromSlot={handleRemoveSpellFromSlot}
							onCastSpell={handleCastSpellFromSlot}
							onViewDetails={handleViewDetails}
						/>
					</div>
				</section>
			{/if}

			<!-- Spellbook Section -->
			{#if classHasSpellbook || requiresPreparation}
				<section class="content-section" aria-labelledby="spellbook">
					<h2 id="spellbook" class="section-title">Spellbook</h2>
					<p class="section-description">
						Spells inscribed in your spellbook. Add spells from the available spells list below.
					</p>
					<div class="section-body">
						<div class="spellbook-contents">
							<!-- Cantrips in spellbook -->
							{#if $character.spellcasting.cantripsKnown.length > 0 || spellbookCapacity.cantrips > 0}
								<div class="spellbook-level">
									<div class="spellbook-level-header">
										<h4>Cantrips</h4>
										<span class="capacity-badge" class:over={$character.spellcasting.cantripsKnown.length > spellbookCapacity.cantrips}>
											{$character.spellcasting.cantripsKnown.length}/{spellbookCapacity.cantrips}
										</span>
									</div>
									{#if $character.spellcasting.cantripsKnown.length === 0}
										<p class="empty-text">No cantrips inscribed yet.</p>
									{:else}
										<div class="spell-chips">
											{#each $character.spellcasting.cantripsKnown as spellId (spellId)}
												{@const spell = spellsByIdMap.get(spellId)}
												{#if spell}
													<div class="spell-chip cantrip">
														<button class="spell-chip-name" onclick={() => handleViewDetails(spell)}>
															{spell.name}
														</button>
														<button class="spell-chip-remove" onclick={() => handleRemoveCantrip(spellId)} aria-label="Remove {spell.name}">
															×
														</button>
													</div>
												{/if}
											{/each}
										</div>
									{/if}
								</div>
							{/if}

							<!-- Leveled spells in spellbook -->
							{#each Object.entries(spellbookCapacity.spells).sort((a, b) => Number(a[0]) - Number(b[0])) as [level, capacity] (level)}
								{@const spellLevel = Number(level)}
								{@const spellsAtLevel = $character.spellcasting.knownSpells.filter(id => {
									const s = spellsByIdMap.get(id);
									return s && s.level === spellLevel;
								})}
								<div class="spellbook-level">
									<div class="spellbook-level-header">
										<h4>Level {level}</h4>
										<span class="capacity-badge" class:over={spellsAtLevel.length > capacity}>
											{spellsAtLevel.length}/{capacity}
										</span>
									</div>
									{#if spellsAtLevel.length === 0}
										<p class="empty-text">No level {level} spells inscribed yet.</p>
									{:else}
										<div class="spell-chips">
											{#each spellsAtLevel as spellId (spellId)}
												{@const spell = spellsByIdMap.get(spellId)}
												{#if spell}
													<div class="spell-chip">
														<button class="spell-chip-name" onclick={() => handleViewDetails(spell)}>
															{spell.name}
														</button>
														<button class="spell-chip-remove" onclick={() => handleRemoveFromSpellbook(spellId)} aria-label="Remove {spell.name}">
															×
														</button>
													</div>
												{/if}
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</section>
			{/if}

			<!-- Available Spells Section -->
			<section class="content-section" aria-labelledby="available-spells">
				<h2 id="available-spells" class="section-title">
					Available {resolvedTradition
						? resolvedTradition.charAt(0).toUpperCase() + resolvedTradition.slice(1)
						: ''} Spells
				</h2>
				<p class="section-description">
					Browse and add spells to your spellbook.
				</p>
				<div class="section-body">
					{#if loading}
						<div class="loading-state">
							<p>Loading spells...</p>
						</div>
					{:else if spells.length === 0}
						<div class="empty-state">
							<p>No spells available.</p>
						</div>
					{:else}
						<SpellList
							{spells}
							selectedSpellId={selectedSpell?.id}
							onViewDetails={handleViewDetails}
							showCastButtons={false}
							traditionFilter={resolvedTradition}
							knownSpellIds={spellbookIds}
							knownBadgeLabel="In Spellbook"
							onAddSpell={handleAddToSpellbook}
							showAddButtons={true}
							addButtonLabel="Add to Spellbook"
							addedButtonLabel="In Spellbook"
							{maxSpellLevel}
							showSchoolFilter={false}
							title="Spells"
						/>
					{/if}
				</div>
			</section>
		{/if}
	</div>
</div>

<!-- Spell Detail Modal -->
<SpellDetail
	spell={selectedSpell}
	open={showSpellDetail}
	onClose={handleCloseDetail}
	showCastButton={false}
/>

<!-- Slot Selection Modal -->
<Modal open={showSlotSelectModal} onClose={closeSlotSelectModal} title="Select Spell to Prepare">
	<div class="slot-select-content">
		<p class="slot-select-info">
			{#if selectingSlotLevel === 'cantrip'}
				Select a cantrip from your spellbook to prepare in this slot.
			{:else}
				Select a level {selectingSlotLevel} spell from your spellbook to prepare.
			{/if}
		</p>

		{#if spellsForSlotSelection.length === 0}
			<div class="empty-state">
				<p>
					{#if selectingSlotLevel === 'cantrip'}
						No cantrips in your spellbook. Add cantrips from the Available Spells list first.
					{:else}
						No level {selectingSlotLevel} spells in your spellbook. Add spells from the Available Spells list first.
					{/if}
				</p>
			</div>
		{:else}
			<div class="spell-select-list">
				{#each spellsForSlotSelection as spell (spell.id)}
					<button class="spell-select-item" onclick={() => handlePrepareSpellInSlot(spell)}>
						<span class="spell-select-name">{spell.name}</span>
						<span class="spell-select-meta">{spell.castingTime}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<Button variant="secondary" onclick={closeSlotSelectModal}>Cancel</Button>
	{/snippet}
</Modal>

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

	.content-section.non-caster {
		text-align: center;
		padding: 3rem 2rem;
	}

	.non-caster p {
		margin: 0;
		font-size: 1.125rem;
		color: var(--text-primary, #1a1a1a);
	}

	.non-caster .hint {
		margin-top: 1rem;
		font-size: 0.9375rem;
		color: var(--text-secondary, #666666);
	}

	.section-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: var(--text-primary, #1a1a1a);
	}

	.section-description {
		font-size: 0.9375rem;
		margin: 0 0 1rem 0;
		color: var(--text-secondary, #666666);
	}

	.section-header-row .section-title {
		margin: 0;
	}

	.section-body {
		color: var(--text-secondary, #666666);
	}

	/* Spellbook Styles */
	.spellbook-contents {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.spellbook-level {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.spellbook-level-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border-color, #e0e0e0);
	}

	.spellbook-level-header h4 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.capacity-badge {
		font-size: 0.8125rem;
		font-weight: 500;
		padding: 0.25rem 0.5rem;
		background-color: var(--surface-1, #ffffff);
		border-radius: 4px;
		color: var(--text-secondary, #666666);
	}

	.capacity-badge.over {
		background-color: rgba(231, 76, 60, 0.1);
		color: #c0392b;
		font-weight: 600;
	}

	.empty-text {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		font-style: italic;
	}

	.spell-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.spell-chip {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.5rem 0.375rem 0.75rem;
		background-color: var(--surface-1, #ffffff);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 20px;
		font-size: 0.875rem;
	}

	.spell-chip.cantrip {
		background-color: rgba(155, 89, 182, 0.1);
		border-color: rgba(155, 89, 182, 0.3);
	}

	.spell-chip-name {
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		font: inherit;
		color: var(--link-color, #5c7cfa);
		cursor: pointer;
	}

	.spell-chip-name:hover {
		text-decoration: underline;
	}

	.spell-chip-remove {
		background: none;
		border: none;
		padding: 0.125rem;
		margin: 0;
		font-size: 1rem;
		line-height: 1;
		color: var(--text-secondary, #666666);
		cursor: pointer;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
	}

	.spell-chip-remove:hover {
		background-color: rgba(231, 76, 60, 0.1);
		color: #c0392b;
	}

	/* Slot Selection Modal */
	.slot-select-content {
		min-height: 200px;
	}

	.slot-select-info {
		margin: 0 0 1rem 0;
		color: var(--text-secondary, #666666);
	}

	.spell-select-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 400px;
		overflow-y: auto;
	}

	.spell-select-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background-color: var(--surface-1, #ffffff);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		font: inherit;
	}

	.spell-select-item:hover {
		border-color: var(--link-color, #5c7cfa);
		background-color: rgba(92, 124, 250, 0.05);
	}

	.spell-select-name {
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.spell-select-meta {
		font-size: 0.8125rem;
		color: var(--text-secondary, #666666);
	}

	.loading-state,
	.empty-state {
		padding: 3rem;
		text-align: center;
		color: var(--text-secondary, #666666);
	}

	.loading-state p,
	.empty-state p {
		margin: 0;
		font-size: 1rem;
	}

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

		.section-header-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}
	}
</style>
