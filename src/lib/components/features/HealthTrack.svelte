<script lang="ts">
	import Button from '../common/Button.svelte';

	interface Props {
		/** Maximum hit points */
		maxHp: number;
		/** Current hit points */
		currentHp: number;
		/** Temporary hit points */
		tempHp?: number;
		/** Callback when HP changes */
		// eslint-disable-next-line no-unused-vars
		onHpChange?: (current: number, temp: number) => void;
		/** Whether HP can be edited */
		editable?: boolean;
		/** Compact mode */
		compact?: boolean;
	}

	let {
		maxHp,
		currentHp = $bindable(),
		tempHp = $bindable(0),
		onHpChange,
		editable = true,
		compact = false
	}: Props = $props();

	let isEditing = $state(false);
	let editValue = $state('');
	let editTempValue = $state('');

	// Calculate HP percentage for visual indicator
	const hpPercentage = $derived(Math.max(0, Math.min(100, (currentHp / maxHp) * 100)));

	// Determine health status
	const healthStatus = $derived.by(() => {
		if (currentHp <= 0) return 'unconscious';
		if (currentHp <= maxHp * 0.25) return 'critical';
		if (currentHp <= maxHp * 0.5) return 'wounded';
		return 'healthy';
	});

	function startEditing() {
		if (!editable) return;
		editValue = currentHp.toString();
		editTempValue = tempHp.toString();
		isEditing = true;
	}

	function cancelEditing() {
		isEditing = false;
		editValue = '';
		editTempValue = '';
	}

	function saveChanges() {
		const newCurrent = Math.max(0, Math.min(maxHp, parseInt(editValue) || 0));
		const newTemp = Math.max(0, parseInt(editTempValue) || 0);

		currentHp = newCurrent;
		tempHp = newTemp;

		onHpChange?.(newCurrent, newTemp);

		isEditing = false;
		editValue = '';
		editTempValue = '';
	}

	function adjustHp(amount: number) {
		if (!editable) return;

		// Damage reduces temp HP first
		if (amount < 0) {
			const damage = Math.abs(amount);
			if (tempHp >= damage) {
				tempHp -= damage;
			} else {
				const remainingDamage = damage - tempHp;
				tempHp = 0;
				currentHp = Math.max(0, currentHp - remainingDamage);
			}
		} else {
			// Healing only affects current HP
			currentHp = Math.min(maxHp, currentHp + amount);
		}

		onHpChange?.(currentHp, tempHp);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			saveChanges();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			cancelEditing();
		}
	}
</script>

<div class="health-track" class:compact data-status={healthStatus}>
	<div class="health-header">
		<h3 class="health-label">Hit Points</h3>
		<div class="health-value" aria-live="polite">
			{#if isEditing}
				<div class="health-edit">
					<input
						type="number"
						bind:value={editValue}
						min="0"
						max={maxHp}
						class="hp-input"
						aria-label="Current hit points"
						onkeydown={handleKeyDown}
						autofocus
					/>
					<span class="hp-separator">/</span>
					<span class="hp-max">{maxHp}</span>
				</div>
			{:else}
				<button
					class="health-display"
					onclick={startEditing}
					disabled={!editable}
					aria-label="Hit points: {currentHp} of {maxHp}. {tempHp > 0 ? `${tempHp} temporary hit points.` : ''} Click to edit."
				>
					<span class="hp-current">{currentHp}</span>
					<span class="hp-separator">/</span>
					<span class="hp-max">{maxHp}</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- HP Bar -->
	<div class="health-bar">
		<div
			class="health-fill"
			style="width: {hpPercentage}%"
			role="progressbar"
			aria-valuenow={currentHp}
			aria-valuemin="0"
			aria-valuemax={maxHp}
			aria-label="Current hit points"
		></div>
		{#if tempHp > 0}
			<div class="health-temp-indicator" aria-label="Temporary hit points: {tempHp}">
				+{tempHp}
			</div>
		{/if}
	</div>

	<!-- Temp HP -->
	{#if tempHp > 0 || isEditing}
		<div class="temp-hp">
			{#if isEditing}
				<label class="temp-hp-label">
					Temp HP:
					<input
						type="number"
						bind:value={editTempValue}
						min="0"
						class="temp-hp-input"
						aria-label="Temporary hit points"
						onkeydown={handleKeyDown}
					/>
				</label>
			{:else}
				<span class="temp-hp-display">
					<span class="temp-hp-icon" aria-hidden="true">🛡️</span>
					<span class="temp-hp-value">{tempHp} temporary HP</span>
				</span>
			{/if}
		</div>
	{/if}

	<!-- Edit controls -->
	{#if isEditing}
		<div class="health-controls">
			<Button variant="primary" size="sm" onclick={saveChanges}>Save</Button>
			<Button variant="secondary" size="sm" onclick={cancelEditing}>Cancel</Button>
		</div>
	{:else if editable && !compact}
		<div class="health-quick-actions">
			<Button variant="ghost" size="sm" onclick={() => adjustHp(-1)} aria-label="Take 1 damage">
				-1
			</Button>
			<Button variant="ghost" size="sm" onclick={() => adjustHp(-5)} aria-label="Take 5 damage">
				-5
			</Button>
			<Button variant="ghost" size="sm" onclick={() => adjustHp(1)} aria-label="Heal 1 HP">
				+1
			</Button>
			<Button variant="ghost" size="sm" onclick={() => adjustHp(5)} aria-label="Heal 5 HP">
				+5
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onclick={() => adjustHp(maxHp)}
				aria-label="Full heal"
			>
				Max
			</Button>
		</div>
	{/if}

	<!-- Health status -->
	<div class="health-status" aria-live="polite">
		{#if currentHp <= 0}
			<span class="status-text status-unconscious">Unconscious</span>
		{:else if healthStatus === 'critical'}
			<span class="status-text status-critical">Critical</span>
		{:else if healthStatus === 'wounded'}
			<span class="status-text status-wounded">Wounded</span>
		{:else}
			<span class="status-text status-healthy">Healthy</span>
		{/if}
	</div>
</div>

<style>
	.health-track {
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.health-track.compact {
		padding: 1rem;
	}

	.health-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.health-label {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.compact .health-label {
		font-size: 1rem;
	}

	.health-display {
		background: none;
		border: none;
		padding: 0.25rem;
		font-family: inherit;
		font-size: 1.5rem;
		font-weight: 700;
		cursor: pointer;
		border-radius: 4px;
		transition: background-color var(--transition-fast);
		color: inherit;
	}

	.health-display:hover:not(:disabled) {
		background-color: var(--surface-1, #ffffff);
	}

	.health-display:disabled {
		cursor: default;
	}

	.health-edit {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.5rem;
		font-weight: 700;
	}

	.hp-current {
		color: var(--text-primary, #1a1a1a);
	}

	.hp-separator {
		color: var(--text-secondary, #666666);
	}

	.hp-max {
		color: var(--text-secondary, #666666);
	}

	.hp-input {
		width: 4rem;
		padding: 0.25rem 0.5rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 4px;
		font-size: 1.5rem;
		font-weight: 700;
		text-align: center;
	}

	/* Health bar */
	.health-bar {
		position: relative;
		height: 2rem;
		background-color: var(--surface-1, #ffffff);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 0.75rem;
	}

	.health-fill {
		height: 100%;
		transition: width 300ms ease, background-color 300ms ease;
		background-color: #51cf66;
	}

	.health-track[data-status='wounded'] .health-fill {
		background-color: #ffd43b;
	}

	.health-track[data-status='critical'] .health-fill {
		background-color: #ff8787;
	}

	.health-track[data-status='unconscious'] .health-fill {
		background-color: #868e96;
	}

	.health-temp-indicator {
		position: absolute;
		top: 50%;
		right: 0.5rem;
		transform: translateY(-50%);
		font-size: 0.875rem;
		font-weight: 600;
		color: #5c7cfa;
	}

	/* Temp HP */
	.temp-hp {
		margin-bottom: 0.75rem;
	}

	.temp-hp-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
	}

	.temp-hp-input {
		width: 4rem;
		padding: 0.25rem 0.5rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.temp-hp-display {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background-color: rgba(92, 124, 250, 0.1);
		border-radius: 4px;
		font-size: 0.875rem;
		color: #5c7cfa;
		font-weight: 600;
	}

	/* Controls */
	.health-controls {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.health-quick-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-top: 0.75rem;
	}

	/* Status */
	.health-status {
		margin-top: 0.75rem;
		text-align: center;
	}

	.status-text {
		font-size: 0.875rem;
		font-weight: 600;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
	}

	.status-healthy {
		color: #2f9e44;
		background-color: rgba(47, 158, 68, 0.1);
	}

	.status-wounded {
		color: #f08c00;
		background-color: rgba(240, 140, 0, 0.1);
	}

	.status-critical {
		color: #e03131;
		background-color: rgba(224, 49, 49, 0.1);
	}

	.status-unconscious {
		color: #495057;
		background-color: rgba(73, 80, 87, 0.1);
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.health-track,
		.health-bar,
		.hp-input,
		.temp-hp-input {
			border-width: 3px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.health-fill {
			transition: none;
		}
	}
</style>
