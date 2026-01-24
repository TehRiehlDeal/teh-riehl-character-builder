<script lang="ts">
	import type { Spell } from '$lib/data/types/app';
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';
	import RichDescription from './RichDescription.svelte';
	import { processDescription } from '$lib/utils/descriptionParser';
	import { calculateSpellDamage, formatDamageCompact, getCantripHeightenLevel } from '$lib/utils/spellDamage';

	interface Props {
		/** Whether the modal is open */
		open?: boolean;
		/** The spell to display */
		spell: Spell | null;
		/** Character level (for cantrip scaling) */
		characterLevel?: number;
		/** Heightened level for the spell (defaults to base level or cantrip scaling) */
		heightenedLevel?: number;
		/** Callback when modal is closed */
		onClose?: () => void;
	}

	let { open = $bindable(false), spell, characterLevel, heightenedLevel, onClose }: Props = $props();

	// Calculate effective heightened level
	const effectiveHeightenedLevel = $derived.by(() => {
		if (!spell) return 0;

		// If heightenedLevel is explicitly provided, use it
		if (heightenedLevel !== undefined) {
			return heightenedLevel;
		}

		// For cantrips, calculate based on character level
		if (spell.level === 0 && characterLevel !== undefined) {
			return getCantripHeightenLevel(characterLevel);
		}

		// Default to base spell level
		return spell.level;
	});

	// Calculate spell damage
	const spellDamage = $derived.by(() => {
		if (!spell) return [];
		return calculateSpellDamage(spell, effectiveHeightenedLevel, characterLevel);
	});

	// Process description with context for damage calculation
	const processedDescription = $derived.by(() => {
		if (!spell) return '';
		return processDescription(spell.description, {
			spellLevel: effectiveHeightenedLevel,
			characterLevel
		});
	});

	function handleClose() {
		open = false;
		onClose?.();
	}

	// Format traditions for display
	function formatTraditions(traditions: string[]): string {
		if (!traditions || traditions.length === 0) {
			return 'None';
		}
		return traditions.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
	}

	// Get spell type label
	function getSpellTypeLabel(level: number, spellType: string): string {
		if (level === 0) return 'Cantrip';
		if (spellType === 'focus') return 'Focus Spell';
		if (spellType === 'ritual') return 'Ritual';
		return `Spell ${level}`;
	}

	// Format action/casting time with icons
	function getCastingIcon(castingTime: string): string {
		if (!castingTime) return '';

		const lower = castingTime.toLowerCase();

		// Check for number of actions
		if (lower.includes('1 action') || lower === '1') return '◆';
		if (lower.includes('2 actions') || lower === '2') return '◆◆';
		if (lower.includes('3 actions') || lower === '3') return '◆◆◆';
		if (lower.includes('reaction')) return '↩️';
		if (lower.includes('free')) return '⚡';

		return '';
	}
</script>

{#if spell}
	<Modal bind:open={open} title={spell.name} size="lg" onClose={handleClose}>
		<div class="spell-detail">
			<!-- Header Info -->
			<div class="spell-header">
				<div class="spell-meta-row">
					<div class="spell-meta">
						<span class="meta-badge level-badge">
							{getSpellTypeLabel(spell.level, spell.spellType)}
						</span>

						{#if spell.traditions && spell.traditions.length > 0}
							<span class="meta-badge tradition-badge">{formatTraditions(spell.traditions)}</span>
						{/if}

						{#if spell.rarity && spell.rarity !== 'common'}
							<span class="meta-badge rarity-badge rarity-{spell.rarity}">{spell.rarity}</span>
						{/if}
					</div>

					<!-- Damage Display -->
					{#if spellDamage.length > 0}
						<div class="spell-damage-display">
							{#each spellDamage as damage, i (i)}
								<div class="damage-entry" class:splash={damage.category === 'splash'} class:persistent={damage.category === 'persistent'}>
									<span class="damage-formula">{damage.formula}</span>
									<span class="damage-type">{damage.type}</span>
									{#if damage.category}
										<span class="damage-category">({damage.category})</span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Spell Stats -->
			<div class="spell-stats">
				<div class="stat-grid">
					{#if spell.castingTime}
						<div class="stat-item">
							<dt class="stat-label">Cast</dt>
							<dd class="stat-value">
								<span class="action-icon">{getCastingIcon(spell.castingTime)}</span>
								{spell.castingTime}
							</dd>
						</div>
					{/if}

					{#if spell.range}
						<div class="stat-item">
							<dt class="stat-label">Range</dt>
							<dd class="stat-value">{spell.range}</dd>
						</div>
					{/if}

					{#if spell.target}
						<div class="stat-item">
							<dt class="stat-label">Target</dt>
							<dd class="stat-value">{spell.target}</dd>
						</div>
					{/if}

					{#if spell.area}
						<div class="stat-item">
							<dt class="stat-label">Area</dt>
							<dd class="stat-value">{spell.area}</dd>
						</div>
					{/if}

					{#if spell.duration}
						<div class="stat-item">
							<dt class="stat-label">Duration</dt>
							<dd class="stat-value">
								{spell.duration}
								{#if spell.sustained}
									<span class="sustained-badge">sustained</span>
								{/if}
							</dd>
						</div>
					{/if}

					{#if spell.defense}
						<div class="stat-item">
							<dt class="stat-label">Defense</dt>
							<dd class="stat-value">{spell.defense}</dd>
						</div>
					{/if}
				</div>
			</div>

			<!-- Description -->
			<div class="detail-section">
				<h4>Description</h4>
				<div class="spell-description-content">
					{@html processedDescription}
				</div>
			</div>

			<!-- Heightening -->
			{#if spell.heightening}
				<div class="detail-section">
					<h4>Heightening</h4>
					<p class="heightening-text">
						{#if spell.heightening.type === 'interval'}
							This spell can be heightened at regular intervals.
						{:else if spell.heightening.type === 'fixed'}
							This spell can be heightened to specific levels.
						{/if}
					</p>
				</div>
			{/if}

			<!-- Traits -->
			{#if spell.traits && spell.traits.length > 0}
				<div class="detail-section">
					<h4>Traits</h4>
					<div class="trait-list">
						{#each spell.traits as trait}
							<span class="trait-badge">{trait}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Source -->
			{#if spell.source}
				<div class="detail-section source-section">
					<p class="source-text">
						<strong>Source:</strong> {spell.source.title}
						{#if spell.source.remaster}
							<span class="remaster-badge" title="Remastered content">Remaster</span>
						{/if}
					</p>
				</div>
			{/if}
		</div>

		{#snippet footer()}
			<Button variant="secondary" onclick={handleClose}>Close</Button>
		{/snippet}
	</Modal>
{/if}

<style>
	.spell-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.spell-header {
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.spell-meta-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.spell-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.spell-damage-display {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		align-items: flex-end;
	}

	.damage-entry {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background-color: rgba(224, 49, 49, 0.1);
		border: 1px solid rgba(224, 49, 49, 0.3);
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.damage-entry.splash {
		background-color: rgba(250, 176, 5, 0.1);
		border-color: rgba(250, 176, 5, 0.3);
	}

	.damage-entry.persistent {
		background-color: rgba(174, 62, 201, 0.1);
		border-color: rgba(174, 62, 201, 0.3);
	}

	.damage-formula {
		color: var(--text-primary, #1a1a1a);
		font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
	}

	.damage-type {
		color: var(--text-secondary, #666);
		text-transform: capitalize;
	}

	.damage-category {
		color: var(--text-secondary, #666);
		font-size: 0.75rem;
		font-style: italic;
	}

	.meta-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		border-radius: 4px;
		text-transform: capitalize;
	}

	.level-badge {
		background-color: rgba(174, 62, 201, 0.1);
		color: #ae3ec9;
		border: 1px solid rgba(174, 62, 201, 0.3);
	}

	.tradition-badge {
		background-color: rgba(55, 178, 77, 0.1);
		color: #2f9e44;
		border: 1px solid rgba(55, 178, 77, 0.3);
	}

	.rarity-badge {
		border: 1px solid currentColor;
	}

	.rarity-badge.rarity-uncommon {
		background-color: rgba(250, 176, 5, 0.1);
		color: #c77700;
	}

	.rarity-badge.rarity-rare {
		background-color: rgba(240, 62, 62, 0.1);
		color: #e03131;
	}

	.rarity-badge.rarity-unique {
		background-color: rgba(174, 62, 201, 0.1);
		color: #ae3ec9;
	}

	.spell-stats {
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
		padding: 1rem;
	}

	.stat-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary, #666);
		margin: 0;
	}

	.stat-value {
		font-size: 0.875rem;
		color: var(--text-primary, #1a1a1a);
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.action-icon {
		font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
		color: var(--link-color, #5c7cfa);
		font-weight: bold;
		font-size: 1.1em;
	}

	.sustained-badge {
		display: inline-block;
		padding: 0.125rem 0.375rem;
		background-color: rgba(92, 124, 250, 0.1);
		color: #5c7cfa;
		border: 1px solid rgba(92, 124, 250, 0.3);
		border-radius: 3px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		margin-left: 0.25rem;
	}

	.detail-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.detail-section h4 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		border-bottom: 1px solid var(--border-color, #e0e0e0);
		padding-bottom: 0.25rem;
	}

	.heightening-text {
		margin: 0;
		color: var(--text-secondary, #666);
		font-style: italic;
	}

	.trait-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.trait-badge {
		display: inline-block;
		padding: 0.25rem 0.625rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 4px;
		font-size: 0.875rem;
		color: var(--text-secondary, #666);
		text-transform: lowercase;
	}

	.source-section {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}

	.source-text {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary, #666);
	}

	.remaster-badge {
		display: inline-block;
		margin-left: 0.5rem;
		padding: 0.125rem 0.5rem;
		background-color: rgba(55, 178, 77, 0.1);
		color: #2f9e44;
		border: 1px solid rgba(55, 178, 77, 0.3);
		border-radius: 3px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	/* Description content styles */
	.spell-description-content {
		color: var(--text-primary, #1a1a1a);
		line-height: 1.6;
	}

	.spell-description-content :global(p) {
		margin: 0 0 0.75rem 0;
	}

	.spell-description-content :global(p:last-child) {
		margin-bottom: 0;
	}

	.spell-description-content :global(.inline-damage) {
		color: #e03131;
		font-weight: 600;
		padding: 0.125rem 0.25rem;
		background-color: rgba(224, 49, 49, 0.1);
		border-radius: 3px;
	}

	.spell-description-content :global(.inline-healing) {
		color: #2f9e44;
		font-weight: 600;
		padding: 0.125rem 0.25rem;
		background-color: rgba(47, 158, 68, 0.1);
		border-radius: 3px;
	}
</style>
