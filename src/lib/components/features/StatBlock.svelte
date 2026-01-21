<script lang="ts">
	import type { Modifier } from '$lib/engine/models/Modifier';
	import ModifierInspector from './ModifierInspector.svelte';
	import Modal from '../common/Modal.svelte';

	interface AbilityScore {
		name: string;
		abbreviation: string;
		value: number;
		modifiers: Modifier[];
	}

	interface Props {
		/** Ability scores with their modifiers */
		abilities: {
			strength: number;
			dexterity: number;
			constitution: number;
			intelligence: number;
			wisdom: number;
			charisma: number;
		};
		/** Optional modifiers for each ability */
		modifiers?: {
			strength?: Modifier[];
			dexterity?: Modifier[];
			constitution?: Modifier[];
			intelligence?: Modifier[];
			wisdom?: Modifier[];
			charisma?: Modifier[];
		};
		/** Whether to show in compact mode */
		compact?: boolean;
	}

	let { abilities, modifiers = {}, compact = false }: Props = $props();

	// State for modal
	let inspectorOpen = $state(false);
	let selectedAbility: AbilityScore | null = $state(null);

	// Calculate ability modifier from score
	function calculateModifier(score: number): number {
		return Math.floor((score - 10) / 2);
	}

	// Format modifier with sign
	function formatModifier(value: number): string {
		return value >= 0 ? `+${value}` : `${value}`;
	}

	// Build ability score objects
	const abilityScores = $derived([
		{
			name: 'Strength',
			abbreviation: 'STR',
			value: abilities.strength,
			modifiers: modifiers.strength || []
		},
		{
			name: 'Dexterity',
			abbreviation: 'DEX',
			value: abilities.dexterity,
			modifiers: modifiers.dexterity || []
		},
		{
			name: 'Constitution',
			abbreviation: 'CON',
			value: abilities.constitution,
			modifiers: modifiers.constitution || []
		},
		{
			name: 'Intelligence',
			abbreviation: 'INT',
			value: abilities.intelligence,
			modifiers: modifiers.intelligence || []
		},
		{
			name: 'Wisdom',
			abbreviation: 'WIS',
			value: abilities.wisdom,
			modifiers: modifiers.wisdom || []
		},
		{
			name: 'Charisma',
			abbreviation: 'CHA',
			value: abilities.charisma,
			modifiers: modifiers.charisma || []
		}
	]);

	function openInspector(ability: AbilityScore) {
		selectedAbility = ability;
		inspectorOpen = true;
	}
</script>

<div class="stat-block" class:compact>
	<div class="stat-grid">
		{#each abilityScores as ability}
			{@const modifier = calculateModifier(ability.value)}
			<button
				class="stat-card"
				onclick={() => openInspector(ability)}
				aria-label="{ability.name}: {ability.value} (modifier {formatModifier(modifier)})"
			>
				<div class="stat-header">
					<span class="stat-abbr">{ability.abbreviation}</span>
				</div>
				<div class="stat-score">{ability.value}</div>
				<div class="stat-modifier" class:positive={modifier > 0} class:negative={modifier < 0}>
					{formatModifier(modifier)}
				</div>
				{#if ability.modifiers.length > 0}
					<div class="stat-indicator" aria-hidden="true">
						<span class="indicator-dot"></span>
					</div>
				{/if}
			</button>
		{/each}
	</div>
</div>

<!-- Modifier Inspector Modal -->
{#if selectedAbility}
	<Modal
		bind:open={inspectorOpen}
		title={selectedAbility.name}
		size="md"
	>
		<ModifierInspector
			label={selectedAbility.name}
			baseValue={10}
			modifiers={selectedAbility.modifiers}
		/>

		<div class="ability-info">
			<p><strong>Current Score:</strong> {selectedAbility.value}</p>
			<p><strong>Modifier:</strong> {formatModifier(calculateModifier(selectedAbility.value))}</p>
			<p class="info-text">
				The modifier is calculated as: (Score - 10) ÷ 2, rounded down
			</p>
		</div>
	</Modal>
{/if}

<style>
	.stat-block {
		width: 100%;
	}

	.stat-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
	}

	.compact .stat-grid {
		grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
		gap: 0.75rem;
	}

	.stat-card {
		position: relative;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		transition: all var(--transition-fast);
		font-family: inherit;
		color: inherit;
	}

	.compact .stat-card {
		padding: 0.75rem;
	}

	.stat-card:hover {
		background-color: var(--surface-1, #ffffff);
		border-color: var(--link-color, #5c7cfa);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.stat-card:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	.stat-card:active {
		transform: translateY(0);
	}

	.stat-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.stat-abbr {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--text-secondary, #666666);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.compact .stat-abbr {
		font-size: 0.75rem;
	}

	.stat-score {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
		line-height: 1;
	}

	.compact .stat-score {
		font-size: 1.5rem;
	}

	.stat-modifier {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-secondary, #666666);
		font-variant-numeric: tabular-nums;
	}

	.compact .stat-modifier {
		font-size: 1rem;
	}

	.stat-modifier.positive {
		color: #37b24d;
	}

	.stat-modifier.negative {
		color: #f03e3e;
	}

	.stat-indicator {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
	}

	.indicator-dot {
		display: block;
		width: 8px;
		height: 8px;
		background-color: var(--link-color, #5c7cfa);
		border-radius: 50%;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.ability-info {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}

	.ability-info p {
		margin: 0.5rem 0;
		color: var(--text-primary, #1a1a1a);
	}

	.info-text {
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		font-style: italic;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.stat-grid {
			grid-template-columns: repeat(3, 1fr);
			gap: 0.5rem;
		}

		.stat-card {
			padding: 0.75rem 0.5rem;
		}

		.stat-score {
			font-size: 1.5rem;
		}

		.stat-modifier {
			font-size: 1rem;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.stat-card {
			border-width: 3px;
		}

		.stat-card:hover {
			border-width: 3px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.stat-card {
			transition: none;
		}

		.stat-card:hover {
			transform: none;
		}

		.indicator-dot {
			animation: none;
		}
	}
</style>
