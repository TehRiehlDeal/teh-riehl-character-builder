<script lang="ts">
	/**
	 * Spellbook Component
	 *
	 * Displays spells that have been learned/added to the character's spellbook.
	 * For prepared casters: allows preparing spells for daily use
	 * For spontaneous casters: shows the spell repertoire
	 */

	import type { Spell } from '$lib/data/types/app';
	import Button from '../common/Button.svelte';
	import { getSpellLevelLabel, classRequiresPreparation } from '$lib/utils/spellcasting';

	interface Props {
		/** Known spells (in spellbook) by ID */
		knownSpells: string[];
		/** Prepared spells by level (level -> spell IDs) */
		preparedSpells: Record<number, string[]>;
		/** Known cantrips by ID */
		cantripsKnown: string[];
		/** Spellcasting type */
		spellcastingType: 'prepared' | 'spontaneous' | 'bounded' | null;
		/** All available spells (for looking up spell info) */
		spellsByIdMap: Map<string, Spell>;
		/** Callback to prepare a spell */
		onPrepareSpell?: (level: number, spellId: string) => void;
		/** Callback to unprepare a spell */
		onUnprepareSpell?: (level: number, spellId: string) => void;
		/** Callback to remove a spell from spellbook */
		onRemoveFromSpellbook?: (spellId: string) => void;
		/** Callback to remove a cantrip */
		onRemoveCantrip?: (spellId: string) => void;
		/** Callback to view spell details */
		onViewDetails?: (spell: Spell) => void;
		/** Spell slots by level for showing preparation capacity */
		spellSlots?: Array<{ level: number; total: number }>;
		/** Cantrips limit */
		cantripsLimit?: number;
		/** Class name for determining spellcasting behavior */
		className?: string | null;
		/** Spells known limits per level (for spontaneous/bounded casters) */
		spellsKnownLimits?: Map<number, number>;
	}

	let {
		knownSpells,
		preparedSpells,
		cantripsKnown,
		spellcastingType,
		spellsByIdMap,
		onPrepareSpell,
		onUnprepareSpell,
		onRemoveFromSpellbook,
		onRemoveCantrip,
		onViewDetails,
		spellSlots = [],
		cantripsLimit = 5,
		className = null,
		spellsKnownLimits = new Map()
	}: Props = $props();

	// Get spell info by ID
	function getSpell(spellId: string): Spell | undefined {
		return spellsByIdMap.get(spellId);
	}

	// Check if a spell is prepared at a given level
	function isPrepared(spellId: string, level: number): boolean {
		return preparedSpells[level]?.includes(spellId) ?? false;
	}

	// Get how many times a specific spell is prepared at a given level
	function getSpellPreparedCount(spellId: string, level: number): number {
		return preparedSpells[level]?.filter((id) => id === spellId).length ?? 0;
	}

	// Get total count of prepared spells at a level
	function getTotalPreparedCount(level: number): number {
		return preparedSpells[level]?.length ?? 0;
	}

	// Get capacity for a spell level
	function getCapacity(level: number): number {
		const slot = spellSlots.find((s) => s.level === level);
		return slot?.total ?? 0;
	}

	// Check if we can prepare more spells at a level
	function canPrepareMore(level: number): boolean {
		return getTotalPreparedCount(level) < getCapacity(level);
	}

	// Get spells grouped by level from knownSpells
	const spellsByLevel = $derived.by(() => {
		const grouped = new Map<number, Spell[]>();

		for (const spellId of knownSpells) {
			const spell = getSpell(spellId);
			if (spell && spell.level > 0) {
				// Exclude cantrips
				if (!grouped.has(spell.level)) {
					grouped.set(spell.level, []);
				}
				grouped.get(spell.level)!.push(spell);
			}
		}

		// Sort within each level by name
		for (const spellList of grouped.values()) {
			spellList.sort((a, b) => a.name.localeCompare(b.name));
		}

		return grouped;
	});

	// Get sorted levels
	const spellLevels = $derived(Array.from(spellsByLevel.keys()).sort((a, b) => a - b));

	// Get cantrip spells
	const cantripSpells = $derived.by(() => {
		return cantripsKnown
			.map((id) => getSpell(id))
			.filter((s): s is Spell => s !== undefined)
			.sort((a, b) => a.name.localeCompare(b.name));
	});

	// Total spells in spellbook
	const totalSpells = $derived(knownSpells.length + cantripsKnown.length);

	// Label based on spellcasting type
	const sectionLabel = $derived(
		spellcastingType === 'spontaneous' ? 'Spell Repertoire' : 'Spellbook'
	);

	// Both prepared and bounded casters need to prepare spells
	const requiresPreparation = $derived(
		className ? classRequiresPreparation(className) : spellcastingType === 'prepared'
	);

	// Check if we have spells known limits (spontaneous and bounded casters)
	const hasLimits = $derived(spellsKnownLimits.size > 0);

	// Get spells known limit for a level
	function getSpellsKnownLimit(level: number): number | null {
		return spellsKnownLimits.get(level) ?? null;
	}

	// Get count of spells in spellbook at a given level
	function getSpellsAtLevel(level: number): number {
		return spellsByLevel.get(level)?.length ?? 0;
	}

	// Check if over capacity at a level
	function isOverCapacity(level: number): boolean {
		const limit = getSpellsKnownLimit(level);
		if (limit === null) return false;
		return getSpellsAtLevel(level) > limit;
	}
</script>

<div class="spellbook">
	<div class="section-header">
		<h3 class="section-title">{sectionLabel}</h3>
		<span class="spell-count">{totalSpells} spells</span>
	</div>

	{#if totalSpells === 0}
		<div class="empty-state">
			<p>Your {sectionLabel.toLowerCase()} is empty.</p>
			<p class="empty-hint">Add spells from the available spells list below.</p>
		</div>
	{:else}
		<!-- Cantrips Section -->
		{#if cantripSpells.length > 0}
			<div class="level-group">
				<div class="level-header">
					<h4 class="level-title">Cantrips</h4>
					<span class="level-count">{cantripSpells.length}/{cantripsLimit}</span>
				</div>

				<div class="spell-list">
					{#each cantripSpells as spell (spell.id)}
						<div class="spell-item cantrip">
							<div class="spell-info">
								<button
									class="spell-name-btn"
									onclick={() => onViewDetails?.(spell)}
									type="button"
								>
									{spell.name}
								</button>
								<span class="spell-meta">
									{spell.castingTime}
									{#if spell.range && spell.range !== 'touch'}
										• {spell.range}
									{/if}
								</span>
							</div>
							<div class="spell-actions">
								<Button
									variant="ghost"
									size="sm"
									onclick={() => onRemoveCantrip?.(spell.id)}
									aria-label="Remove {spell.name} from spellbook"
								>
									Remove
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Leveled Spells by Level -->
		{#each spellLevels as level (level)}
			{@const levelSpells = spellsByLevel.get(level) ?? []}
			{@const capacity = getCapacity(level)}
			{@const preparedCount = getTotalPreparedCount(level)}
			{@const knownLimit = getSpellsKnownLimit(level)}
			{@const overCapacity = isOverCapacity(level)}
			<div class="level-group">
				<div class="level-header">
					<h4 class="level-title">{getSpellLevelLabel(level)}</h4>
					<div class="level-stats">
						{#if knownLimit !== null}
							<span class="level-count" class:over-capacity={overCapacity}>
								{levelSpells.length}/{knownLimit} known
							</span>
						{:else}
							<span class="level-count">{levelSpells.length} in spellbook</span>
						{/if}
						{#if requiresPreparation && capacity > 0}
							<span class="prepared-count" class:full={preparedCount >= capacity}>
								{preparedCount}/{capacity} prepared
							</span>
						{/if}
					</div>
				</div>
				{#if overCapacity}
					<div class="capacity-warning">
						You have more spells than your class allows at this level. Remove {levelSpells.length - (knownLimit ?? 0)} spell(s).
					</div>
				{/if}

				<div class="spell-list">
					{#each levelSpells as spell (spell.id)}
						{@const prepared = isPrepared(spell.id, level)}
						{@const spellPrepCount = getSpellPreparedCount(spell.id, level)}
						<div class="spell-item" class:prepared>
							<div class="spell-info">
								<div class="spell-name-row">
									<button
										class="spell-name-btn"
										onclick={() => onViewDetails?.(spell)}
										type="button"
									>
										{spell.name}
									</button>
									{#if prepared}
										<span class="prepared-badge">
											Prepared{#if spellPrepCount > 1} x{spellPrepCount}{/if}
										</span>
									{/if}
								</div>
								<span class="spell-meta">
									{spell.castingTime}
									{#if spell.range && spell.range !== 'touch'}
										• {spell.range}
									{/if}
								</span>
							</div>
							<div class="spell-actions">
								{#if requiresPreparation}
									{#if prepared && spellPrepCount > 0}
										<Button
											variant="secondary"
											size="sm"
											onclick={() => onUnprepareSpell?.(level, spell.id)}
											aria-label="Unprepare one {spell.name}"
										>
											Unprepare
										</Button>
									{/if}
									<Button
										variant="primary"
										size="sm"
										onclick={() => onPrepareSpell?.(level, spell.id)}
										disabled={!canPrepareMore(level)}
										aria-label="Prepare {spell.name}"
									>
										Prepare
									</Button>
								{/if}
								<Button
									variant="ghost"
									size="sm"
									onclick={() => onRemoveFromSpellbook?.(spell.id)}
									aria-label="Remove {spell.name} from spellbook"
								>
									Remove
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.spellbook {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 0.75rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.section-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.spell-count {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
		background-color: var(--surface-3, #e0e0e0);
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
		border: 2px dashed var(--border-color, #e0e0e0);
	}

	.empty-state p {
		margin: 0;
		color: var(--text-secondary, #666666);
	}

	.empty-state p:first-child {
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.empty-hint {
		font-size: 0.875rem;
	}

	.level-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.level-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
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

	.level-count {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
	}

	.level-count.over-capacity {
		color: #e74c3c;
		font-weight: 600;
	}

	.capacity-warning {
		padding: 0.5rem 0.75rem;
		background-color: rgba(231, 76, 60, 0.1);
		border: 1px solid rgba(231, 76, 60, 0.3);
		border-radius: 6px;
		font-size: 0.8125rem;
		color: #c0392b;
		margin-bottom: 0.5rem;
	}

	.prepared-count {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--link-color, #5c7cfa);
		padding: 0.25rem 0.5rem;
		background-color: rgba(92, 124, 250, 0.1);
		border-radius: 4px;
	}

	.prepared-count.full {
		color: #40c057;
		background-color: rgba(64, 192, 87, 0.1);
	}

	.spell-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.spell-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background-color: var(--surface-1, #ffffff);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		transition: border-color 0.2s, background-color 0.2s;
	}

	.spell-item:hover {
		border-color: var(--link-color, #5c7cfa);
	}

	.spell-item.prepared {
		background-color: rgba(92, 124, 250, 0.05);
		border-color: var(--link-color, #5c7cfa);
	}

	.spell-item.cantrip {
		background-color: rgba(155, 89, 182, 0.05);
		border-color: rgba(155, 89, 182, 0.3);
	}

	.spell-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
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
		color: var(--link-color, #5c7cfa);
		cursor: pointer;
		text-align: left;
	}

	.spell-name-btn:hover {
		text-decoration: underline;
	}

	.prepared-badge {
		padding: 0.125rem 0.5rem;
		background-color: var(--link-color, #5c7cfa);
		color: white;
		border-radius: 4px;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.spell-meta {
		font-size: 0.8125rem;
		color: var(--text-secondary, #666666);
	}

	.spell-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.spell-item {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}

		.spell-actions {
			justify-content: flex-end;
		}

		.level-header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
