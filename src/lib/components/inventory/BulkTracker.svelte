<script lang="ts">
	/**
	 * BulkTracker Component
	 *
	 * Displays the character's current bulk and encumbrance limits.
	 * PF2e Rules:
	 * - Light Bulk Limit: 5 + Strength modifier
	 * - Max Bulk Limit: 10 + Strength modifier
	 * - Encumbered: Movement reduced by 10ft, -5ft Climb/Swim, 10ft max Jump
	 * - Overloaded: Can't move
	 */

	interface Props {
		/** Current total bulk carried */
		currentBulk: number;

		/** Character's Strength modifier */
		strengthModifier: number;

		/** Whether the character has bonuses to bulk capacity */
		bulkCapacityBonus?: number;
	}

	let { currentBulk, strengthModifier, bulkCapacityBonus = 0 }: Props = $props();

	// Calculate bulk limits
	const lightBulkLimit = $derived(5 + strengthModifier + bulkCapacityBonus);
	const maxBulkLimit = $derived(10 + strengthModifier + bulkCapacityBonus);

	// Determine encumbrance state
	const encumbranceState = $derived.by(() => {
		if (currentBulk > maxBulkLimit) {
			return 'overloaded';
		} else if (currentBulk > lightBulkLimit) {
			return 'encumbered';
		} else {
			return 'normal';
		}
	});

	// Calculate percentage for visual display
	const bulkPercentage = $derived(Math.min((currentBulk / maxBulkLimit) * 100, 100));

	// Get status message
	const statusMessage = $derived.by(() => {
		switch (encumbranceState) {
			case 'overloaded':
				return 'Overloaded - Cannot Move!';
			case 'encumbered':
				return 'Encumbered - Speed reduced by 10 feet';
			default:
				return 'Light Load';
		}
	});

	// Get status color
	const statusColor = $derived.by(() => {
		switch (encumbranceState) {
			case 'overloaded':
				return 'var(--danger-color, #dc3545)';
			case 'encumbered':
				return 'var(--warning-color, #ffc107)';
			default:
				return 'var(--success-color, #28a745)';
		}
	});
</script>

<div class="bulk-tracker">
	<div class="tracker-header">
		<div class="bulk-info">
			<span class="bulk-label">Bulk</span>
			<span class="bulk-value">
				{currentBulk.toFixed(1)}/{maxBulkLimit}
			</span>
		</div>

		<span class="status-badge" style="background-color: {statusColor}">
			{statusMessage}
		</span>
	</div>

	<div class="bulk-bar-container">
		<div class="bulk-bar" style="width: {bulkPercentage}%; background-color: {statusColor}"></div>
		<div class="bulk-marker light-limit" style="left: {(lightBulkLimit / maxBulkLimit) * 100}%">
			<span class="marker-label">Light: {lightBulkLimit}</span>
		</div>
	</div>

	<div class="bulk-limits">
		<div class="limit-item">
			<strong>Light Bulk:</strong>
			<span>{lightBulkLimit} (5 + {strengthModifier}{bulkCapacityBonus > 0 ? ` + ${bulkCapacityBonus}` : ''})</span>
		</div>
		<div class="limit-item">
			<strong>Max Bulk:</strong>
			<span>{maxBulkLimit} (10 + {strengthModifier}{bulkCapacityBonus > 0 ? ` + ${bulkCapacityBonus}` : ''})</span>
		</div>
	</div>

	{#if encumbranceState !== 'normal'}
		<div class="encumbrance-warning">
			<strong>Encumbrance Effects:</strong>
			{#if encumbranceState === 'overloaded'}
				<p>You cannot move. Drop items to reduce bulk below {maxBulkLimit}.</p>
			{:else}
				<ul>
					<li>Speed reduced by 10 feet</li>
					<li>Climb and Swim speeds reduced by 5 feet</li>
					<li>Maximum Jump distance is 10 feet</li>
				</ul>
			{/if}
		</div>
	{/if}
</div>

<style>
	.bulk-tracker {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
	}

	.tracker-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.bulk-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.bulk-label {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.bulk-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.status-badge {
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
		color: white;
	}

	.bulk-bar-container {
		position: relative;
		height: 2rem;
		background-color: var(--surface-3, #e0e0e0);
		border-radius: 6px;
		overflow: visible;
	}

	.bulk-bar {
		height: 100%;
		border-radius: 6px;
		transition: width 0.3s ease, background-color 0.3s ease;
	}

	.bulk-marker {
		position: absolute;
		top: -0.5rem;
		bottom: -0.5rem;
		width: 2px;
		background-color: var(--text-secondary, #666666);
		transform: translateX(-50%);
	}

	.bulk-marker::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 8px;
		height: 8px;
		background-color: var(--text-secondary, #666666);
		border-radius: 50%;
	}

	.marker-label {
		position: absolute;
		top: -1.75rem;
		left: 50%;
		transform: translateX(-50%);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
		white-space: nowrap;
	}

	.bulk-limits {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}

	.limit-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.875rem;
	}

	.limit-item strong {
		color: var(--text-secondary, #666666);
		font-weight: 600;
	}

	.limit-item span {
		color: var(--text-primary, #1a1a1a);
	}

	.encumbrance-warning {
		padding: 1rem;
		background-color: rgba(255, 193, 7, 0.1);
		border: 2px solid var(--warning-color, #ffc107);
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.encumbrance-warning strong {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--text-primary, #1a1a1a);
	}

	.encumbrance-warning p {
		margin: 0;
		color: var(--text-primary, #1a1a1a);
	}

	.encumbrance-warning ul {
		margin: 0;
		padding-left: 1.5rem;
		color: var(--text-primary, #1a1a1a);
	}

	.encumbrance-warning li {
		margin-bottom: 0.25rem;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.tracker-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.status-badge {
			width: 100%;
			text-align: center;
		}

		.bulk-limits {
			flex-direction: column;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.bulk-bar {
			transition: none;
		}
	}
</style>
