<script lang="ts">
	/**
	 * PreparedSpellsSection Component
	 *
	 * Displays the character's prepared/known spells organized by level.
	 * For prepared casters: shows spells prepared for the day
	 * For spontaneous casters: shows spells known in repertoire
	 * For all casters: shows cantrips separately
	 */

	import type { Spell } from '$lib/data/types/app';
	import Button from '../common/Button.svelte';
	import { getSpellLevelLabel } from '$lib/utils/spellcasting';

	interface Props {
		/** Prepared spells by level (level -> spell IDs) */
		preparedSpells: Record<number, string[]>;
		/** Known cantrips (spell IDs) */
		cantrips: string[];
		/** Spellcasting type */
		spellcastingType: 'prepared' | 'spontaneous' | 'bounded' | null;
		/** Spell tradition */
		tradition: string | null;
		/** All available spells (for looking up spell info) */
		spellsByIdMap: Map<string, Spell>;
		/** Callback to remove a spell */
		onRemoveSpell?: (level: number, spellId: string) => void;
		/** Callback to remove a cantrip */
		onRemoveCantrip?: (spellId: string) => void;
		/** Callback to view spell details */
		onViewDetails?: (spell: Spell) => void;
		/** Spell slots by level for showing capacity */
		spellSlots?: Array<{ level: number; total: number }>;
		/** Cantrips limit */
		cantripsLimit?: number;
	}

	let {
		preparedSpells,
		cantrips,
		spellcastingType,
		tradition,
		spellsByIdMap,
		onRemoveSpell,
		onRemoveCantrip,
		onViewDetails,
		spellSlots = [],
		cantripsLimit = 5
	}: Props = $props();

	// Get sorted spell levels that have prepared spells
	const spellLevels = $derived.by(() => {
		const levels = Object.keys(preparedSpells)
			.map(Number)
			.filter((level) => preparedSpells[level]?.length > 0)
			.sort((a, b) => a - b);
		return levels;
	});

	// Get total prepared spells count
	const totalPrepared = $derived(
		Object.values(preparedSpells).reduce((sum, spells) => sum + spells.length, 0) + cantrips.length
	);

	// Get label based on spellcasting type
	const sectionLabel = $derived(
		spellcastingType === 'spontaneous' ? 'Spell Repertoire' : 'Prepared Spells'
	);

	const actionLabel = $derived(spellcastingType === 'spontaneous' ? 'Known' : 'Prepared');

	// Get spell info by ID
	function getSpell(spellId: string): Spell | undefined {
		return spellsByIdMap.get(spellId);
	}

	// Get capacity for a spell level
	function getCapacity(level: number): number {
		const slot = spellSlots.find((s) => s.level === level);
		return slot?.total ?? 0;
	}
</script>

<div class="prepared-spells-section">
	<div class="section-header">
		<h3 class="section-title">{sectionLabel}</h3>
		<span class="spell-count">{totalPrepared} {actionLabel.toLowerCase()}</span>
	</div>

	{#if totalPrepared === 0}
		<div class="empty-state">
			<p>No spells {actionLabel.toLowerCase()} yet.</p>
			<p class="empty-hint">Add spells from the spell list below.</p>
		</div>
	{:else}
		<!-- Cantrips Section -->
		{#if cantrips.length > 0}
			<div class="level-group">
				<div class="level-header">
					<h4 class="level-title">Cantrips</h4>
					<span class="level-count">{cantrips.length}/{cantripsLimit}</span>
				</div>

				<div class="spell-list">
					{#each cantrips as spellId (spellId)}
						{@const spell = getSpell(spellId)}
						{#if spell}
							<div class="spell-item">
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
								<Button
									variant="ghost"
									size="sm"
									onclick={() => onRemoveCantrip?.(spellId)}
									aria-label="Remove {spell.name}"
								>
									Remove
								</Button>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}

		<!-- Leveled Spells by Level -->
		{#each spellLevels as level (level)}
			{@const spellsAtLevel = preparedSpells[level] || []}
			{@const capacity = getCapacity(level)}
			<div class="level-group">
				<div class="level-header">
					<h4 class="level-title">{getSpellLevelLabel(level)}</h4>
					<span class="level-count"
						>{spellsAtLevel.length}{capacity > 0 ? `/${capacity}` : ''}</span
					>
				</div>

				<div class="spell-list">
					{#each spellsAtLevel as spellId (spellId)}
						{@const spell = getSpell(spellId)}
						{#if spell}
							<div class="spell-item">
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
								<Button
									variant="ghost"
									size="sm"
									onclick={() => onRemoveSpell?.(level, spellId)}
									aria-label="Remove {spell.name}"
								>
									Remove
								</Button>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.prepared-spells-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
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
	}

	.level-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.level-count {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
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
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		transition: border-color 0.2s;
	}

	.spell-item:hover {
		border-color: var(--link-color, #5c7cfa);
	}

	.spell-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
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

	.spell-meta {
		font-size: 0.8125rem;
		color: var(--text-secondary, #666666);
	}

	/* Mobile */
	@media (max-width: 640px) {
		.spell-item {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}

		.spell-info {
			flex: 1;
		}
	}
</style>
