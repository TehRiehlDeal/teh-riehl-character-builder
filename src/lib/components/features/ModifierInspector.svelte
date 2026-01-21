<script lang="ts">
	import type { Modifier } from '$lib/engine/models/Modifier';
	import { applyModifierStacking } from '$lib/engine/rules/stacking';

	interface Props {
		/** Label for the statistic being inspected */
		label: string;
		/** Base value (before modifiers) */
		baseValue: number;
		/** Array of modifiers to display */
		modifiers: Modifier[];
		/** Whether to show the inspector in compact mode */
		compact?: boolean;
	}

	let { label, baseValue, modifiers, compact = false }: Props = $props();

	// Apply stacking rules to get final modifiers
	const activeModifiers = $derived(applyModifierStacking(modifiers));

	// Calculate total modifier value
	const totalModifier = $derived(
		activeModifiers.reduce((sum, mod) => sum + mod.value, 0)
	);

	// Calculate final value
	const finalValue = $derived(baseValue + totalModifier);

	// Group modifiers by type for better display
	const groupedModifiers = $derived.by(() => {
		const groups = new Map<string, Modifier[]>();

		for (const mod of activeModifiers) {
			const type = mod.type || 'untyped';
			if (!groups.has(type)) {
				groups.set(type, []);
			}
			groups.get(type)!.push(mod);
		}

		return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
	});

	// Format modifier value with sign
	function formatValue(value: number): string {
		return value >= 0 ? `+${value}` : `${value}`;
	}
</script>

<div class="modifier-inspector" class:compact>
	<div class="inspector-header">
		<h3 class="inspector-title">{label}</h3>
		<div class="inspector-total" aria-live="polite">
			<span class="total-label">Total:</span>
			<strong class="total-value">{finalValue}</strong>
		</div>
	</div>

	<div class="inspector-breakdown">
		<!-- Base value -->
		<div class="modifier-row base-value">
			<span class="modifier-source">Base</span>
			<span class="modifier-type"></span>
			<span class="modifier-value">{baseValue}</span>
		</div>

		<!-- Modifiers grouped by type -->
		{#if activeModifiers.length > 0}
			{#each groupedModifiers as [type, mods]}
				<div class="modifier-group">
					<div class="modifier-group-header">
						<span class="group-type">{type}</span>
					</div>
					{#each mods as modifier}
						<div class="modifier-row">
							<span class="modifier-source" title={modifier.source}>
								{modifier.source}
							</span>
							<span class="modifier-type">{modifier.type || 'untyped'}</span>
							<span
								class="modifier-value"
								class:positive={modifier.value > 0}
								class:negative={modifier.value < 0}
							>
								{formatValue(modifier.value)}
							</span>
						</div>
					{/each}
				</div>
			{/each}
		{:else}
			<div class="no-modifiers">
				<em>No active modifiers</em>
			</div>
		{/if}

		<!-- Total row -->
		{#if totalModifier !== 0}
			<div class="modifier-row total-row">
				<span class="modifier-source">Total Modifiers</span>
				<span class="modifier-type"></span>
				<span
					class="modifier-value total"
					class:positive={totalModifier > 0}
					class:negative={totalModifier < 0}
				>
					{formatValue(totalModifier)}
				</span>
			</div>
		{/if}
	</div>

	<!-- Screen reader summary -->
	<div class="sr-only" aria-live="polite" aria-atomic="true">
		{label}: {finalValue} ({baseValue} base
		{#if totalModifier !== 0}
			{formatValue(totalModifier)} from modifiers
		{/if})
	</div>
</div>

<style>
	.modifier-inspector {
		background-color: var(--surface-2, #f5f5f5);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		padding: 1rem;
		font-size: 0.875rem;
	}

	.modifier-inspector.compact {
		padding: 0.75rem;
		font-size: 0.8125rem;
	}

	.inspector-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.inspector-title {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.compact .inspector-title {
		font-size: 1rem;
	}

	.inspector-total {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.total-label {
		color: var(--text-secondary, #666666);
		font-weight: 500;
	}

	.total-value {
		font-size: 1.5rem;
		color: var(--link-color, #5c7cfa);
	}

	.compact .total-value {
		font-size: 1.25rem;
	}

	.inspector-breakdown {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.modifier-row {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 0.75rem;
		align-items: center;
		padding: 0.5rem;
		border-radius: 4px;
		transition: background-color var(--transition-fast);
	}

	.modifier-row:hover {
		background-color: var(--surface-1, #ffffff);
	}

	.base-value {
		font-weight: 600;
		background-color: var(--surface-1, #ffffff);
	}

	.modifier-group {
		margin-top: 0.5rem;
	}

	.modifier-group-header {
		padding: 0.25rem 0.5rem;
		margin-bottom: 0.25rem;
	}

	.group-type {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--text-secondary, #666666);
		letter-spacing: 0.05em;
	}

	.modifier-source {
		color: var(--text-primary, #1a1a1a);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.modifier-type {
		font-size: 0.75rem;
		color: var(--text-secondary, #666666);
		text-transform: capitalize;
	}

	.modifier-value {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		text-align: right;
		min-width: 3rem;
	}

	.modifier-value.positive {
		color: #37b24d;
	}

	.modifier-value.negative {
		color: #f03e3e;
	}

	.modifier-value.total {
		font-size: 1.125rem;
	}

	.total-row {
		margin-top: 0.5rem;
		padding-top: 0.75rem;
		border-top: 2px solid var(--border-color, #e0e0e0);
		font-weight: 600;
	}

	.no-modifiers {
		padding: 1rem;
		text-align: center;
		color: var(--text-secondary, #666666);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.modifier-inspector {
			border-width: 2px;
		}

		.inspector-header,
		.total-row {
			border-width: 3px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.modifier-row {
			transition: none;
		}
	}
</style>
