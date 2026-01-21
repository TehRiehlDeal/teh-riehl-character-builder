<script lang="ts">
	/**
	 * FocusPointTracker Component
	 *
	 * Tracks focus points (typically 0-3).
	 * Focus points are used to cast focus spells and recover with the Refocus activity.
	 */

	interface Props {
		/** Maximum focus points (typically 1-3) */
		max: number;

		/** Current focus points */
		current?: number;

		/** Callback when focus points change */
		// eslint-disable-next-line no-unused-vars
		onChange?: (current: number) => void;

		/** Whether the tracker is interactive */
		interactive?: boolean;
	}

	let { max, current = max, onChange, interactive = true }: Props = $props();

	function spendFocusPoint() {
		if (current > 0 && interactive) {
			onChange?.(current - 1);
		}
	}

	function refocus() {
		if (current < max && interactive) {
			// Refocus restores 1 focus point
			onChange?.(Math.min(current + 1, max));
		}
	}

	function fullRest() {
		if (current < max && interactive) {
			// Full rest restores all focus points
			onChange?.(max);
		}
	}
</script>

<div class="focus-point-tracker">
	<div class="tracker-header">
		<div class="focus-info">
			<span class="focus-label">Focus Points</span>
			<span class="focus-count">{current}/{max}</span>
		</div>

		{#if interactive && current < max}
			<div class="action-buttons">
				<button
					class="action-btn refocus-btn"
					onclick={refocus}
					disabled={current === max}
					aria-label="Refocus (restore 1 focus point)"
				>
					Refocus (+1)
				</button>
				<button
					class="action-btn rest-btn"
					onclick={fullRest}
					disabled={current === max}
					aria-label="Full rest (restore all focus points)"
				>
					Rest
				</button>
			</div>
		{/if}
	</div>

	<div class="focus-track" role="group" aria-label="Focus points">
		{#each Array(max) as _, index}
			{@const isAvailable = index < current}
			<button
				class="focus-point"
				class:available={isAvailable}
				class:spent={!isAvailable}
				onclick={() => (isAvailable ? spendFocusPoint() : refocus())}
				disabled={!interactive}
				aria-label="{isAvailable ? 'Available' : 'Spent'} focus point {index + 1}"
				aria-pressed={isAvailable}
			>
				<span class="point-visual" aria-hidden="true">
					{isAvailable ? '●' : '○'}
				</span>
			</button>
		{/each}
	</div>

	{#if max > 0}
		<p class="refocus-note">
			<strong>Refocus:</strong> Spend 10 minutes to restore 1 Focus Point
		</p>
	{/if}
</div>

<style>
	.focus-point-tracker {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 12px;
		color: white;
	}

	.tracker-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.focus-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.focus-label {
		font-size: 1.125rem;
		font-weight: 600;
	}

	.focus-count {
		font-size: 0.9375rem;
		font-weight: 600;
		background-color: rgba(255, 255, 255, 0.2);
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
		padding: 0.5rem 1rem;
		background-color: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		color: white;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		backdrop-filter: blur(10px);
	}

	.action-btn:hover:not(:disabled) {
		background-color: rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 255, 255, 0.5);
		transform: translateY(-1px);
	}

	.action-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.focus-track {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		align-items: center;
	}

	.focus-point {
		width: 3.5rem;
		height: 3.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.1);
		cursor: pointer;
		transition: all 0.25s;
		font-size: 2rem;
		color: white;
		backdrop-filter: blur(5px);
	}

	.focus-point.available {
		border-color: white;
		background-color: rgba(255, 255, 255, 0.2);
		box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
	}

	.focus-point.available:hover:not(:disabled) {
		transform: scale(1.1);
		box-shadow: 0 0 25px rgba(255, 255, 255, 0.7);
	}

	.focus-point.spent {
		opacity: 0.4;
	}

	.focus-point.spent:hover:not(:disabled) {
		opacity: 0.7;
		transform: scale(1.05);
	}

	.focus-point:disabled {
		cursor: default;
	}

	.point-visual {
		display: block;
		line-height: 1;
	}

	.refocus-note {
		margin: 0;
		font-size: 0.8125rem;
		text-align: center;
		color: rgba(255, 255, 255, 0.9);
		background-color: rgba(0, 0, 0, 0.2);
		padding: 0.5rem;
		border-radius: 6px;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.focus-point {
			width: 3rem;
			height: 3rem;
			font-size: 1.75rem;
		}

		.action-buttons {
			flex-direction: column;
		}

		.action-btn {
			font-size: 0.75rem;
			padding: 0.375rem 0.75rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.focus-point {
			transition: none;
		}

		.focus-point:hover:not(:disabled) {
			transform: none;
		}
	}
</style>
