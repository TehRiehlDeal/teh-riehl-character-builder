<script lang="ts">
	/**
	 * SpellSlotGrid Component
	 *
	 * Displays spell slots organized by level, with each slot showing:
	 * - The prepared spell (or empty placeholder)
	 * - Cast button (marks slot as used for leveled spells)
	 * - Remove button (clears the slot for different preparation)
	 */

	import type { Spell } from '$lib/data/types/app';
	import Button from '../common/Button.svelte';
	import { getSpellLevelLabel } from '$lib/utils/spellcasting';

	interface CantripSlot {
		spellId: string | null;
	}

	interface SpellSlot {
		spellId: string | null;
		cast: boolean;
	}

	interface Props {
		/** Prepared cantrip slots */
		preparedCantrips: CantripSlot[];
		/** Prepared spell slots by level */
		preparedSlots: Record<number, SpellSlot[]>;
		/** Map of spell ID to spell data for lookup */
		spellsByIdMap: Map<string, Spell>;
		/** Callback when a cantrip slot is clicked to add/change spell */
		onSelectCantripSlot?: (slotIndex: number) => void;
		/** Callback when a spell slot is clicked to add/change spell */
		onSelectSpellSlot?: (level: number, slotIndex: number) => void;
		/** Callback to remove cantrip from slot */
		onRemoveCantripFromSlot?: (slotIndex: number) => void;
		/** Callback to remove spell from slot */
		onRemoveSpellFromSlot?: (level: number, slotIndex: number) => void;
		/** Callback when cast is clicked on a leveled spell */
		onCastSpell?: (level: number, slotIndex: number) => void;
		/** Callback to view spell details (with optional heightened level for slots) */
		onViewDetails?: (spell: Spell, heightenedLevel?: number) => void;
	}

	let {
		preparedCantrips,
		preparedSlots,
		spellsByIdMap,
		onSelectCantripSlot,
		onSelectSpellSlot,
		onRemoveCantripFromSlot,
		onRemoveSpellFromSlot,
		onCastSpell,
		onViewDetails
	}: Props = $props();

	// Get spell by ID
	function getSpell(spellId: string | null): Spell | undefined {
		if (!spellId) return undefined;
		return spellsByIdMap.get(spellId);
	}

	// Get sorted spell levels from preparedSlots
	const spellLevels = $derived(
		Object.keys(preparedSlots)
			.map(Number)
			.sort((a, b) => a - b)
	);

	// Check if there are any slots
	const hasCantrips = $derived(preparedCantrips.length > 0);
	const hasLeveledSlots = $derived(spellLevels.length > 0);
</script>

<div class="spell-slot-grid">
	{#if !hasCantrips && !hasLeveledSlots}
		<div class="empty-state">
			<p>No spell slots available. Select a spellcasting class to see your spell slots.</p>
		</div>
	{:else}
		<!-- Cantrip Slots -->
		{#if hasCantrips}
			<div class="slot-level-group">
				<div class="level-header">
					<h4 class="level-title">Cantrips</h4>
					<span class="slot-count">{preparedCantrips.filter(s => s.spellId).length}/{preparedCantrips.length}</span>
				</div>
				<div class="slots-row">
					{#each preparedCantrips as slot, index (index)}
						{@const spell = getSpell(slot.spellId)}
						<div class="spell-slot cantrip" class:empty={!spell} class:filled={!!spell}>
							{#if spell}
								<div class="slot-content">
									<button
										class="spell-name-btn"
										onclick={() => onViewDetails?.(spell)}
										type="button"
									>
										{spell.name}
									</button>
									<div class="slot-actions">
										<Button
											variant="ghost"
											size="sm"
											onclick={() => onRemoveCantripFromSlot?.(index)}
											aria-label="Remove {spell.name}"
										>
											Remove
										</Button>
									</div>
								</div>
							{:else}
								<button
									class="empty-slot-btn"
									onclick={() => onSelectCantripSlot?.(index)}
									type="button"
									aria-label="Prepare a cantrip in this slot"
								>
									<span class="empty-icon">+</span>
									<span class="empty-label">Add Cantrip</span>
								</button>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Leveled Spell Slots -->
		{#each spellLevels as level (level)}
			{@const slotsAtLevel = preparedSlots[level] || []}
			{@const filledCount = slotsAtLevel.filter(s => s.spellId).length}
			{@const castCount = slotsAtLevel.filter(s => s.cast).length}
			<div class="slot-level-group">
				<div class="level-header">
					<h4 class="level-title">{getSpellLevelLabel(level)}</h4>
					<div class="level-stats">
						<span class="slot-count">{filledCount}/{slotsAtLevel.length} prepared</span>
						{#if castCount > 0}
							<span class="cast-count">{castCount} cast</span>
						{/if}
					</div>
				</div>
				<div class="slots-row">
					{#each slotsAtLevel as slot, index (index)}
						{@const spell = getSpell(slot.spellId)}
						{@const isHeightened = spell && spell.level < level}
						<div
							class="spell-slot leveled"
							class:empty={!spell}
							class:filled={!!spell}
							class:cast={slot.cast}
							class:heightened={isHeightened}
						>
							{#if spell}
								<div class="slot-content">
									<div class="spell-name-row">
										<button
											class="spell-name-btn"
											onclick={() => onViewDetails?.(spell, level)}
											type="button"
										>
											{spell.name}
										</button>
										{#if isHeightened}
											<span class="heightened-badge" title="Heightened from rank {spell.level} to rank {level}">
												+{level - spell.level}
											</span>
										{/if}
									</div>
									<div class="slot-actions">
										{#if !slot.cast}
											<Button
												variant="primary"
												size="sm"
												onclick={() => onCastSpell?.(level, index)}
												aria-label="Cast {spell.name}"
											>
												Cast
											</Button>
										{:else}
											<span class="cast-badge">Cast</span>
										{/if}
										<Button
											variant="ghost"
											size="sm"
											onclick={() => onRemoveSpellFromSlot?.(level, index)}
											aria-label="Remove {spell.name}"
										>
											Remove
										</Button>
									</div>
								</div>
							{:else}
								<button
									class="empty-slot-btn"
									onclick={() => onSelectSpellSlot?.(level, index)}
									type="button"
									aria-label="Prepare a level {level} spell in this slot"
								>
									<span class="empty-icon">+</span>
									<span class="empty-label">Add Spell</span>
								</button>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.spell-slot-grid {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		color: var(--text-secondary, #666666);
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
		border: 2px dashed var(--border-color, #e0e0e0);
	}

	.empty-state p {
		margin: 0;
	}

	.slot-level-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.level-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.level-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.level-stats {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.slot-count {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
	}

	.cast-count {
		font-size: 0.75rem;
		font-weight: 600;
		color: #e74c3c;
		padding: 0.25rem 0.5rem;
		background-color: rgba(231, 76, 60, 0.1);
		border-radius: 4px;
	}

	.slots-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.spell-slot {
		min-width: 180px;
		max-width: 280px;
		flex: 1;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		background-color: var(--surface-1, #ffffff);
		transition: all 0.2s;
	}

	.spell-slot.empty {
		border-style: dashed;
		background-color: var(--surface-2, #f5f5f5);
	}

	.spell-slot.filled {
		border-color: var(--link-color, #5c7cfa);
	}

	.spell-slot.cantrip.filled {
		border-color: rgba(155, 89, 182, 0.5);
		background-color: rgba(155, 89, 182, 0.05);
	}

	.spell-slot.cast {
		opacity: 0.6;
		background-color: var(--surface-2, #f0f0f0);
		border-color: #999;
	}

	.spell-slot.heightened {
		border-color: rgba(155, 89, 182, 0.6);
		background-color: rgba(155, 89, 182, 0.05);
	}

	.slot-content {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.spell-name-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.spell-name-btn {
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		font: inherit;
		font-weight: 600;
		font-size: 0.9375rem;
		color: var(--link-color, #5c7cfa);
		cursor: pointer;
		text-align: left;
		word-break: break-word;
		flex: 1;
	}

	.heightened-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.125rem 0.375rem;
		background-color: rgba(155, 89, 182, 0.2);
		color: #7d3c98;
		border-radius: 4px;
		font-size: 0.6875rem;
		font-weight: 700;
		line-height: 1;
		flex-shrink: 0;
	}

	.spell-name-btn:hover {
		text-decoration: underline;
	}

	.spell-slot.cast .spell-name-btn {
		color: var(--text-secondary, #666666);
	}

	.slot-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.cast-badge {
		padding: 0.25rem 0.5rem;
		background-color: #e74c3c;
		color: white;
		border-radius: 4px;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.empty-slot-btn {
		width: 100%;
		padding: 1rem;
		background: none;
		border: none;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		color: var(--text-secondary, #666666);
		transition: color 0.2s, background-color 0.2s;
		border-radius: 6px;
	}

	.empty-slot-btn:hover {
		background-color: rgba(92, 124, 250, 0.1);
		color: var(--link-color, #5c7cfa);
	}

	.empty-icon {
		font-size: 1.5rem;
		font-weight: 300;
		line-height: 1;
	}

	.empty-label {
		font-size: 0.8125rem;
		font-weight: 500;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.spell-slot {
			min-width: 100%;
			max-width: 100%;
		}

		.slot-actions {
			justify-content: flex-end;
		}
	}
</style>
