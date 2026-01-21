<script lang="ts">
	import { activeModifiersStore } from '$lib/stores/activeModifiers';
	import type { GroupedModifier } from '$lib/stores/activeModifiers';
	import { character } from '$lib/stores/character';

	interface Props {
		/** Whether to show in compact mode (for mobile drawer) */
		compact?: boolean;
	}

	let { compact = false }: Props = $props();

	// Subscribe to active modifiers
	const modifiers = activeModifiersStore;

	// Group modifiers by selector for cleaner display
	const groupedBySelector = $derived.by(() => {
		const groups = new Map<string, GroupedModifier[]>();

		for (const item of $modifiers) {
			if (!groups.has(item.selector)) {
				groups.set(item.selector, []);
			}
			groups.get(item.selector)!.push(item);
		}

		return Array.from(groups.entries());
	});

	// Format modifier value with sign
	function formatValue(value: number): string {
		return value >= 0 ? `+${value}` : `${value}`;
	}

	// Get color class based on modifier state
	function getColorClass(item: GroupedModifier): string {
		if (!item.isActive) {
			return 'conditional'; // Grey for conditional/inactive
		}
		if (item.modifier.value > 0) {
			return 'bonus'; // Green for bonuses
		}
		if (item.modifier.value < 0) {
			return 'penalty'; // Red for penalties
		}
		return '';
	}

	// Check if a modifier is toggleable (has predicates but enabled is user-controlled)
	function isToggleable(item: GroupedModifier): boolean {
		return item.effectId !== undefined && item.modifier.predicate !== undefined;
	}

	// Toggle an effect on/off
	function handleToggle(item: GroupedModifier) {
		if (item.effectId) {
			character.toggleEffect(item.effectId);
		}
	}
</script>

<div class="active-effects-panel" class:compact>
	<div class="panel-header">
		<h2 class="panel-title">Active Effects</h2>
		<p class="panel-subtitle">Bonuses, penalties, and conditions</p>
	</div>

	<div class="effects-list" role="list">
		{#if groupedBySelector.length === 0}
			<div class="empty-state">
				<p class="empty-text">No active effects</p>
				<p class="empty-help">
					Effects from feats, equipment, and conditions will appear here.
				</p>
			</div>
		{:else}
			{#each groupedBySelector as [selector, items]}
				<div class="effect-group" role="listitem">
					<h3 class="group-label">{items[0].selectorLabel}</h3>
					<div class="group-items">
						{#each items as item}
							<div class="effect-item {getColorClass(item)}" title={item.modifier.source}>
								<div class="effect-content">
									<div class="effect-text">
										<span class="effect-label">
											{item.modifier.label}
											{#if !item.isActive}
												<span class="conditional-badge">(conditional)</span>
											{/if}
										</span>
										{#if item.modifier.description}
											<span class="effect-description">{item.modifier.description}</span>
										{/if}
									</div>
									<span class="effect-value">
										{formatValue(item.modifier.value)}
									</span>
								</div>
								{#if isToggleable(item)}
									<button
										class="toggle-button"
										onclick={() => handleToggle(item)}
										aria-label={item.modifier.enabled ? `Disable ${item.modifier.label}` : `Enable ${item.modifier.label}`}
										aria-pressed={item.modifier.enabled}
										title={item.modifier.enabled ? 'Click to disable' : 'Click to enable'}
									>
										<span class="toggle-track" class:enabled={item.modifier.enabled}>
											<span class="toggle-thumb"></span>
										</span>
									</button>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<!-- Legend -->
	<div class="panel-legend">
		<div class="legend-item">
			<span class="legend-dot bonus"></span>
			<span class="legend-label">Active Bonus</span>
		</div>
		<div class="legend-item">
			<span class="legend-dot penalty"></span>
			<span class="legend-label">Active Penalty</span>
		</div>
		<div class="legend-item">
			<span class="legend-dot conditional"></span>
			<span class="legend-label">Conditional</span>
		</div>
	</div>
</div>

<style>
	.active-effects-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		background-color: var(--surface-1, #ffffff);
		border-left: 1px solid var(--border-color, #e0e0e0);
	}

	.active-effects-panel.compact {
		border-left: none;
	}

	.panel-header {
		padding: 1.5rem 1rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
		background-color: var(--surface-2, #f5f5f5);
	}

	.panel-title {
		margin: 0 0 0.25rem 0;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.panel-subtitle {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
	}

	.effects-list {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		text-align: center;
	}

	.empty-text {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-secondary, #666666);
	}

	.empty-help {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-tertiary, #999999);
		max-width: 250px;
	}

	.effect-group {
		margin-bottom: 1.5rem;
	}

	.effect-group:last-child {
		margin-bottom: 0;
	}

	.group-label {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary, #666666);
		border-bottom: 1px solid var(--border-color, #e0e0e0);
		padding-bottom: 0.5rem;
	}

	.group-items {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.effect-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: 6px;
		background-color: var(--surface-2, #f5f5f5);
		border-left: 3px solid transparent;
		transition: all var(--transition-fast);
	}

	.effect-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex: 1;
		min-width: 0;
		gap: 0.75rem;
	}

	.effect-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
		min-width: 0;
	}

	.effect-item:hover {
		background-color: var(--surface-3, #e0e0e0);
	}

	.effect-item.bonus {
		border-left-color: #37b24d;
		background-color: rgba(55, 178, 77, 0.05);
	}

	.effect-item.bonus .effect-value {
		color: #37b24d;
		font-weight: 700;
	}

	.effect-item.penalty {
		border-left-color: #f03e3e;
		background-color: rgba(240, 62, 62, 0.05);
	}

	.effect-item.penalty .effect-value {
		color: #f03e3e;
		font-weight: 700;
	}

	.effect-item.conditional {
		border-left-color: #868e96;
		background-color: rgba(134, 142, 150, 0.05);
		opacity: 0.7;
	}

	.effect-item.conditional .effect-label,
	.effect-item.conditional .effect-value {
		color: #868e96;
	}

	.effect-label {
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--text-primary, #1a1a1a);
	}

	.effect-description {
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--text-secondary, #666666);
		font-style: italic;
	}

	.conditional-badge {
		display: inline-block;
		margin-left: 0.5rem;
		font-size: 0.75rem;
		font-style: italic;
		color: var(--text-tertiary, #999999);
	}

	.effect-value {
		font-size: 1.125rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--text-primary, #1a1a1a);
	}

	.panel-legend {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
		background-color: var(--surface-2, #f5f5f5);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.legend-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.legend-dot.bonus {
		background-color: #37b24d;
	}

	.legend-dot.penalty {
		background-color: #f03e3e;
	}

	.legend-dot.conditional {
		background-color: #868e96;
	}

	.legend-label {
		font-size: 0.8125rem;
		color: var(--text-secondary, #666666);
	}

	/* Scrollbar styling */
	.effects-list::-webkit-scrollbar {
		width: 8px;
	}

	.effects-list::-webkit-scrollbar-track {
		background: var(--surface-2, #f5f5f5);
	}

	.effects-list::-webkit-scrollbar-thumb {
		background: var(--border-color, #e0e0e0);
		border-radius: 4px;
	}

	.effects-list::-webkit-scrollbar-thumb:hover {
		background: var(--text-tertiary, #999999);
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.effect-item {
			border: 1px solid var(--border-color, #000000);
		}

		.effect-item.bonus {
			border-left-width: 4px;
		}

		.effect-item.penalty {
			border-left-width: 4px;
		}

		.effect-item.conditional {
			border-left-width: 4px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.effect-item {
			transition: none;
		}
	}

	/* Compact mode adjustments */
	.compact .panel-header {
		padding: 1rem;
	}

	.compact .panel-title {
		font-size: 1.125rem;
	}

	.compact .effects-list {
		padding: 0.75rem;
	}

	.compact .effect-group {
		margin-bottom: 1rem;
	}

	.compact .effect-item {
		padding: 0.625rem;
	}

	/* Toggle button */
	.toggle-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		flex-shrink: 0;
	}

	.toggle-button:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
		border-radius: 12px;
	}

	.toggle-track {
		position: relative;
		width: 40px;
		height: 20px;
		background-color: #d1d5db;
		border-radius: 10px;
		transition: background-color 0.2s ease;
	}

	.toggle-track.enabled {
		background-color: #5c7cfa;
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 16px;
		height: 16px;
		background-color: #ffffff;
		border-radius: 50%;
		transition: transform 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.toggle-track.enabled .toggle-thumb {
		transform: translateX(20px);
	}

	.toggle-button:hover .toggle-track {
		background-color: #9ca3af;
	}

	.toggle-button:hover .toggle-track.enabled {
		background-color: #4c6ef5;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.toggle-track,
		.toggle-thumb {
			transition: none;
		}
	}
</style>
