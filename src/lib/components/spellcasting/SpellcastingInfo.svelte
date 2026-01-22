<script lang="ts">
	/**
	 * SpellcastingInfo Component
	 *
	 * Displays information about a character's spellcasting abilities:
	 * - Spell tradition (arcane, divine, primal, occult)
	 * - Spellcasting type (prepared, spontaneous, bounded)
	 * - Max spell level available
	 * - Cantrips known count
	 * - For spontaneous casters: spells known per level
	 */

	import {
		getTraditionLabel,
		getSpellcastingTypeLabel,
		getMaxSpellLevel,
		getCantripsKnownCount,
		getSpellSlotsForLevel,
		getSpellsKnownCount,
		getSpellcastingDescription,
		isSpontaneousCaster
	} from '$lib/utils/spellcasting';

	interface Props {
		/** Class name */
		className: string | null;
		/** Character level */
		characterLevel: number;
		/** Resolved spell tradition */
		tradition: string | null;
		/** Spellcasting type */
		spellcastingType: 'prepared' | 'spontaneous' | 'bounded' | null;
	}

	let { className, characterLevel, tradition, spellcastingType }: Props = $props();

	// Derived values
	const maxSpellLevel = $derived(getMaxSpellLevel(characterLevel));
	const cantripsCount = $derived(className ? getCantripsKnownCount(className, characterLevel) : 0);
	const description = $derived(getSpellcastingDescription(className));
	const isSpontaneous = $derived(className ? isSpontaneousCaster(className) : false);
	const spellSlots = $derived(className ? getSpellSlotsForLevel(className, characterLevel) : []);

	// Get spells known for spontaneous casters
	const spellsKnownByLevel = $derived.by(() => {
		if (!className || !isSpontaneous) return [];
		return spellSlots.map((slot) => ({
			level: slot.level,
			known: getSpellsKnownCount(className, characterLevel, slot.level)
		}));
	});
</script>

<div class="spellcasting-info">
	<div class="info-grid">
		<div class="info-item">
			<span class="info-label">Tradition</span>
			<span class="info-value tradition" class:arcane={tradition === 'arcane'}
				class:divine={tradition === 'divine'} class:primal={tradition === 'primal'}
				class:occult={tradition === 'occult'}>
				{getTraditionLabel(tradition)}
			</span>
		</div>

		<div class="info-item">
			<span class="info-label">Spellcasting Type</span>
			<span class="info-value">{getSpellcastingTypeLabel(spellcastingType)}</span>
		</div>

		<div class="info-item">
			<span class="info-label">Max Spell Level</span>
			<span class="info-value">{maxSpellLevel === 0 ? 'Cantrips only' : `${maxSpellLevel}th`}</span>
		</div>

		<div class="info-item">
			<span class="info-label">Cantrips Known</span>
			<span class="info-value">{cantripsCount}</span>
		</div>
	</div>

	{#if isSpontaneous && spellsKnownByLevel.length > 0}
		<div class="spells-known-section">
			<h4 class="spells-known-title">Spells Known by Level</h4>
			<div class="spells-known-grid">
				{#each spellsKnownByLevel as { level, known }}
					<div class="known-item">
						<span class="known-level">Lvl {level}</span>
						<span class="known-count">{known}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if description}
		<p class="casting-description">{description}</p>
	{/if}
</div>

<style>
	.spellcasting-info {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		background: var(--surface-2, #f5f5f5);
		border-radius: 12px;
		border: 2px solid var(--border-color, #e0e0e0);
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.info-label {
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary, #666666);
	}

	.info-value {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	/* Tradition-specific colors */
	.tradition.arcane {
		color: #5c7cfa;
	}

	.tradition.divine {
		color: #f59f00;
	}

	.tradition.primal {
		color: #40c057;
	}

	.tradition.occult {
		color: #9775fa;
	}

	.spells-known-section {
		padding-top: 1rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}

	.spells-known-title {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.spells-known-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.known-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		background-color: var(--surface-3, #e0e0e0);
		border-radius: 6px;
	}

	.known-level {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
	}

	.known-count {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.casting-description {
		margin: 0;
		padding: 0.75rem;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--text-secondary, #666666);
		background-color: rgba(0, 0, 0, 0.05);
		border-radius: 6px;
		font-style: italic;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.info-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.info-value {
			font-size: 1rem;
		}
	}
</style>
