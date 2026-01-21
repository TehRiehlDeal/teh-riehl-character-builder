<script lang="ts">
	import type { Spell } from '$lib/data/types/app';
	import Modal from '../common/Modal.svelte';
	import Button from '../common/Button.svelte';

	/**
	 * SpellDetail Component
	 *
	 * Displays comprehensive spell information in a modal.
	 * Shows all metadata, full description, and heightening effects.
	 */

	interface Props {
		/** The spell to display */
		spell: Spell | null;

		/** Whether the modal is open */
		open?: boolean;

		/** Callback when modal closes */
		onClose?: () => void;

		/** Callback when spell is cast */
		// eslint-disable-next-line no-unused-vars
		onCast?: (spell: Spell, heightenedLevel?: number) => void;

		/** Whether to show the cast button */
		showCastButton?: boolean;

		/** Available spell slots by level (for heightening selection) */
		availableSlots?: Record<number, number>;
	}

	let {
		spell,
		open = $bindable(false),
		onClose,
		onCast,
		showCastButton = false,
		availableSlots = {}
	}: Props = $props();

	let selectedHeightenLevel = $state<number | undefined>(undefined);
	let showHeighteningDetails = $state(false);

	// Reset state when spell changes
	$effect(() => {
		if (spell) {
			selectedHeightenLevel = spell.level;
			showHeighteningDetails = false;
		}
	});

	// Get available heightening levels
	const availableHeightenLevels = $derived.by(() => {
		if (!spell || !spell.heightening) return [];

		const levels: number[] = [];
		const baseLevel = spell.level;

		if (spell.heightening.type === 'fixed') {
			// Fixed heightening: specific levels
			const heightenLevels = spell.heightening.levels
				? Object.keys(spell.heightening.levels).map(Number)
				: [];
			levels.push(baseLevel, ...heightenLevels);
		} else if (spell.heightening.type === 'interval') {
			// Interval heightening: every N levels
			// For simplicity, show levels up to 10
			for (let level = baseLevel; level <= 10; level++) {
				levels.push(level);
			}
		}

		return levels.sort((a, b) => a - b);
	});

	function handleCast() {
		if (spell && onCast) {
			onCast(spell, selectedHeightenLevel);
		}
	}

	function getActionIcon(castingTime: string): string {
		if (castingTime.includes('1 action') || castingTime.includes('Single Action')) {
			return '◆';
		} else if (castingTime.includes('2 actions') || castingTime.includes('Two Actions')) {
			return '◆◆';
		} else if (castingTime.includes('3 actions') || castingTime.includes('Three Actions')) {
			return '◆◆◆';
		} else if (castingTime.includes('reaction')) {
			return '⚡';
		} else if (castingTime.includes('free')) {
			return '◇';
		}
		return '';
	}
</script>

<Modal {open} {onClose} size="lg" title={spell?.name}>
	{#if spell}
		<div class="spell-detail">
			<!-- Header Info -->
			<div class="spell-header">
				<div class="spell-level-info">
					<span class="spell-level">
						{spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
					</span>
					<span class="spell-type">{spell.spellType}</span>
				</div>

				{#if spell.traits && spell.traits.length > 0}
					<div class="spell-traits">
						{#each spell.traits as trait}
							<span class="trait-badge">{trait}</span>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Traditions -->
			{#if spell.traditions && spell.traditions.length > 0}
				<div class="spell-meta-row">
					<strong>Traditions:</strong>
					<span>{spell.traditions.join(', ')}</span>
				</div>
			{/if}

			<!-- Casting Info -->
			<div class="spell-meta-grid">
				<div class="meta-item">
					<strong>Cast:</strong>
					<span>
						{getActionIcon(spell.castingTime)}
						{spell.castingTime}
					</span>
				</div>

				<div class="meta-item">
					<strong>Range:</strong>
					<span>{spell.range}</span>
				</div>

				{#if spell.target}
					<div class="meta-item">
						<strong>Target:</strong>
						<span>{spell.target}</span>
					</div>
				{/if}

				{#if spell.area}
					<div class="meta-item">
						<strong>Area:</strong>
						<span>{spell.area}</span>
					</div>
				{/if}

				{#if spell.duration}
					<div class="meta-item">
						<strong>Duration:</strong>
						<span>{spell.duration}</span>
					</div>
				{/if}

				{#if spell.defense}
					<div class="meta-item">
						<strong>Defense:</strong>
						<span>{spell.defense}</span>
					</div>
				{/if}
			</div>

			<!-- Description -->
			<div class="spell-description">
				<div class="description-content">
					{@html spell.description}
				</div>
			</div>

			<!-- Heightening -->
			{#if spell.heightening && availableHeightenLevels.length > 1}
				<div class="heightening-section">
					<button
						class="heightening-toggle"
						onclick={() => (showHeighteningDetails = !showHeighteningDetails)}
						aria-expanded={showHeighteningDetails}
					>
						<span class="toggle-icon">{showHeighteningDetails ? '▼' : '▶'}</span>
						<strong>Heightening</strong>
						<span class="heightening-type">({spell.heightening.type})</span>
					</button>

					{#if showHeighteningDetails}
						<div class="heightening-content">
							{#if spell.heightening.type === 'fixed'}
								<p class="heightening-description">
									This spell has special effects when cast at specific higher levels.
								</p>
								{#if spell.heightening.levels}
									{#each Object.entries(spell.heightening.levels) as [level, effects]}
										<div class="heightening-level">
											<strong>Level {level}:</strong>
											<div>{JSON.stringify(effects)}</div>
										</div>
									{/each}
								{/if}
							{:else if spell.heightening.type === 'interval'}
								<p class="heightening-description">
									This spell's effects improve for each spell level above its base level.
								</p>
							{/if}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Source -->
			<div class="spell-source">
				<strong>Source:</strong>
				{spell.source.title}
				{#if spell.source.remaster}
					<span class="remaster-badge">Remaster</span>
				{/if}
			</div>
		</div>

		{#snippet footer()}
			<div class="modal-actions">
				{#if showCastButton && onCast && availableHeightenLevels.length > 1}
					<select
						bind:value={selectedHeightenLevel}
						class="heighten-select"
						aria-label="Select spell level"
					>
						{#each availableHeightenLevels as level}
							<option value={level}>
								{level === 0 ? 'Cantrip' : `Level ${level}`}
								{#if availableSlots[level] !== undefined}
									({availableSlots[level]} slots)
								{/if}
							</option>
						{/each}
					</select>
				{/if}

				{#if showCastButton && onCast}
					<Button variant="primary" onclick={handleCast}>Cast Spell</Button>
				{/if}

				<Button variant="secondary" onclick={onClose}>Close</Button>
			</div>
		{/snippet}
	{/if}
</Modal>

<style>
	.spell-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.spell-header {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.spell-level-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.spell-level {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--link-color, #5c7cfa);
		background-color: rgba(92, 124, 250, 0.1);
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
	}

	.spell-type {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
		text-transform: capitalize;
	}

	.spell-traits {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.trait-badge {
		padding: 0.375rem 0.75rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 6px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
		text-transform: capitalize;
	}

	.spell-meta-row {
		display: flex;
		gap: 0.5rem;
		font-size: 0.9375rem;
	}

	.spell-meta-row strong {
		color: var(--text-primary, #1a1a1a);
	}

	.spell-meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.75rem;
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.875rem;
	}

	.meta-item strong {
		color: var(--text-secondary, #666666);
		font-weight: 600;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.meta-item span {
		color: var(--text-primary, #1a1a1a);
		font-weight: 500;
	}

	.spell-description {
		line-height: 1.6;
		color: var(--text-primary, #1a1a1a);
	}

	.description-content :global(p) {
		margin-bottom: 0.75rem;
	}

	.description-content :global(p:last-child) {
		margin-bottom: 0;
	}

	.description-content :global(strong) {
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.description-content :global(hr) {
		margin: 1rem 0;
		border: none;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}

	.heightening-section {
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		overflow: hidden;
	}

	.heightening-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border: none;
		cursor: pointer;
		font-size: 0.9375rem;
		transition: background-color 0.2s;
		text-align: left;
	}

	.heightening-toggle:hover {
		background-color: var(--surface-3, #e0e0e0);
	}

	.toggle-icon {
		font-size: 0.75rem;
		color: var(--text-secondary, #666666);
	}

	.heightening-type {
		font-size: 0.8125rem;
		font-weight: 400;
		color: var(--text-secondary, #666666);
	}

	.heightening-content {
		padding: 1rem;
		background-color: var(--surface-1, #ffffff);
	}

	.heightening-description {
		margin: 0 0 1rem 0;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
	}

	.heightening-level {
		margin-bottom: 0.75rem;
		padding: 0.75rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.heightening-level:last-child {
		margin-bottom: 0;
	}

	.spell-source {
		padding-top: 1rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.remaster-badge {
		padding: 0.25rem 0.5rem;
		background-color: var(--link-color, #5c7cfa);
		color: white;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.modal-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		justify-content: flex-end;
	}

	.heighten-select {
		padding: 0.5rem 0.75rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-size: 0.875rem;
		font-family: inherit;
		background-color: var(--surface-1, #ffffff);
		color: var(--text-primary, #1a1a1a);
		cursor: pointer;
	}

	.heighten-select:focus {
		outline: none;
		border-color: var(--focus-color, #5c7cfa);
	}

	/* Mobile */
	@media (max-width: 640px) {
		.spell-meta-grid {
			grid-template-columns: 1fr;
		}

		.modal-actions {
			flex-direction: column-reverse;
			align-items: stretch;
		}

		.heighten-select {
			width: 100%;
		}
	}
</style>
