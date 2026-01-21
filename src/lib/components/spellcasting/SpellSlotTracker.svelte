<script lang="ts">
	/**
	 * SpellSlotTracker Component
	 *
	 * Tracks spell slots for each spell level (1-10).
	 * Cantrips (level 0) are handled separately as they don't use slots.
	 */

	interface Props {
		/** Spell level (1-10) */
		level: number;

		/** Total number of slots available */
		total: number;

		/** Number of slots used */
		used?: number;

		/** Callback when slots are used/recovered */
		// eslint-disable-next-line no-unused-vars
		onSlotChange?: (level: number, used: number) => void;

		/** Whether slots can be modified (default true) */
		interactive?: boolean;
	}

	let { level, total, used = 0, onSlotChange, interactive = true }: Props = $props();

	// Calculate remaining slots
	const remaining = $derived(total - used);

	function useSlot() {
		if (used < total && interactive) {
			const newUsed = used + 1;
			onSlotChange?.(level, newUsed);
		}
	}

	function recoverSlot() {
		if (used > 0 && interactive) {
			const newUsed = used - 1;
			onSlotChange?.(level, newUsed);
		}
	}

	function recoverAll() {
		if (used > 0 && interactive) {
			onSlotChange?.(level, 0);
		}
	}
</script>

<div class="spell-slot-tracker">
	<div class="tracker-header">
		<div class="level-info">
			<span class="level-label">Level {level}</span>
			<span class="slot-count">{remaining}/{total}</span>
		</div>

		{#if interactive}
			<button
				class="recover-all-btn"
				onclick={recoverAll}
				disabled={used === 0}
				aria-label="Recover all level {level} spell slots"
			>
				Recover All
			</button>
		{/if}
	</div>

	<div class="slot-track" role="group" aria-label="Level {level} spell slots">
		{#each Array(total) as _, index}
			{@const isUsed = index < used}
			<button
				class="slot-indicator"
				class:used={isUsed}
				class:available={!isUsed}
				onclick={() => (isUsed ? recoverSlot() : useSlot())}
				disabled={!interactive}
				aria-label="{isUsed ? 'Used' : 'Available'} slot {index + 1}"
				aria-pressed={!isUsed}
			>
				<span class="slot-visual" aria-hidden="true">
					{isUsed ? '✕' : '◆'}
				</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.spell-slot-tracker {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
	}

	.tracker-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.level-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.level-label {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.slot-count {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
		background-color: var(--surface-1, #ffffff);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	.recover-all-btn {
		padding: 0.375rem 0.75rem;
		background-color: var(--surface-1, #ffffff);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 4px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
		cursor: pointer;
		transition: all 0.2s;
	}

	.recover-all-btn:hover:not(:disabled) {
		background-color: var(--link-color, #5c7cfa);
		border-color: var(--link-color, #5c7cfa);
		color: white;
	}

	.recover-all-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.slot-track {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.slot-indicator {
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		background-color: var(--surface-1, #ffffff);
		cursor: pointer;
		transition: all 0.2s;
		font-size: 1.25rem;
	}

	.slot-indicator.available {
		border-color: var(--link-color, #5c7cfa);
		color: var(--link-color, #5c7cfa);
	}

	.slot-indicator.available:hover:not(:disabled) {
		background-color: var(--link-color, #5c7cfa);
		color: white;
	}

	.slot-indicator.used {
		border-color: #d0d0d0;
		background-color: #f0f0f0;
		color: #999999;
	}

	.slot-indicator.used:hover:not(:disabled) {
		border-color: var(--link-color, #5c7cfa);
		background-color: var(--link-color, #5c7cfa);
		color: white;
	}

	.slot-indicator:disabled {
		cursor: default;
		opacity: 0.7;
	}

	.slot-visual {
		display: block;
		line-height: 1;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.slot-indicator {
			width: 2rem;
			height: 2rem;
			font-size: 1rem;
		}

		.recover-all-btn {
			font-size: 0.75rem;
			padding: 0.25rem 0.5rem;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.slot-indicator {
			border-width: 3px;
		}
	}
</style>
