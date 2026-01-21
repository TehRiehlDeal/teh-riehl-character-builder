<script lang="ts">
	import { onMount } from 'svelte';
	import type { Spell } from '$lib/data/types/app';
	import { getAllSpells } from '$lib/data/repositories/spellRepository';
	import { character } from '$lib/stores/character';
	import SpellSlotTracker from '$lib/components/spellcasting/SpellSlotTracker.svelte';
	import FocusPointTracker from '$lib/components/spellcasting/FocusPointTracker.svelte';
	import SpellList from '$lib/components/spellcasting/SpellList.svelte';
	import SpellDetail from '$lib/components/spellcasting/SpellDetail.svelte';

	let spells = $state<Spell[]>([]);
	let loading = $state(true);
	let selectedSpell = $state<Spell | null>(null);
	let showSpellDetail = $state(false);

	onMount(async () => {
		try {
			spells = await getAllSpells();
		} catch (error) {
			console.error('Failed to load spells:', error);
		} finally {
			loading = false;
		}
	});

	function handleSlotChange(level: number, used: number) {
		if ($character?.spellcasting) {
			character.updateSpellSlotUsed(level, used);
		}
	}

	function handleFocusChange(current: number) {
		if ($character?.spellcasting) {
			character.updateFocusPoints(current);
		}
	}

	function handleViewDetails(spell: Spell) {
		selectedSpell = spell;
		showSpellDetail = true;
	}

	function handleCastSpell(spell: Spell, heightenedLevel?: number) {
		const castLevel = heightenedLevel ?? spell.level;

		// Deduct spell slot if casting a leveled spell (not a cantrip)
		if (castLevel > 0 && $character?.spellcasting) {
			character.useSpellSlot(castLevel);
		}

		showSpellDetail = false;
	}

	function handleCloseDetail() {
		showSpellDetail = false;
		selectedSpell = null;
	}
</script>

<svelte:head>
	<title>Spells - Character Builder</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<h1 class="page-title">Spellcasting</h1>
		<p class="page-description">
			Manage spells, spell slots, and spellcasting abilities.
		</p>
	</header>

	<div class="content-sections">
		<!-- Focus Points Section -->
		{#if $character?.spellcasting?.focusPoints?.max && $character.spellcasting.focusPoints.max > 0}
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

		<!-- Spell Slots Section -->
		{#if $character?.spellcasting?.spellSlots && $character.spellcasting.spellSlots.length > 0}
			<section class="content-section" aria-labelledby="spell-slots">
				<h2 id="spell-slots" class="section-title">Spell Slots</h2>
				<div class="section-body">
					<div class="spell-slot-grid">
						{#each $character.spellcasting.spellSlots as slot (slot.level)}
							<SpellSlotTracker
								level={slot.level}
								total={slot.total}
								used={slot.used}
								onSlotChange={handleSlotChange}
							/>
						{/each}
					</div>
				</div>
			</section>
		{/if}

		<!-- Spellbook Section -->
		<section class="content-section" aria-labelledby="spellbook">
			<h2 id="spellbook" class="section-title">Spellbook</h2>
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
						onCastSpell={handleCastSpell}
						showCastButtons={false}
					/>
				{/if}
			</div>
		</section>
	</div>
</div>

<!-- Spell Detail Modal -->
<SpellDetail
	spell={selectedSpell}
	open={showSpellDetail}
	onClose={handleCloseDetail}
	onCast={handleCastSpell}
	showCastButton={true}
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

	.section-body {
		color: var(--text-secondary, #666666);
	}

	.spell-slot-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
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
	}
</style>
