<script lang="ts">
	interface Props {
		/** Label for this boost selector */
		label: string;
		/** Description of what this boost is for */
		description?: string;
		/** Available abilities to choose from */
		availableAbilities: string[];
		/** Currently selected ability */
		selectedAbility?: string | null;
		/** Callback when ability is selected */
		// eslint-disable-next-line no-unused-vars
		onSelect?: (ability: string) => void;
		/** Whether selection is required */
		required?: boolean;
		/** Abilities that should be disabled */
		disabledAbilities?: string[];
	}

	let {
		label,
		description,
		availableAbilities,
		selectedAbility = null,
		onSelect,
		required = false,
		disabledAbilities = []
	}: Props = $props();

	const abilityInfo: Record<
		string,
		{ fullName: string; description: string; icon: string }
	> = {
		Strength: {
			fullName: 'Strength',
			description: 'Physical power and athletic ability',
			icon: '💪'
		},
		Dexterity: {
			fullName: 'Dexterity',
			description: 'Agility, reflexes, and hand-eye coordination',
			icon: '🏹'
		},
		Constitution: {
			fullName: 'Constitution',
			description: 'Endurance and health',
			icon: '❤️'
		},
		Intelligence: {
			fullName: 'Intelligence',
			description: 'Reasoning and memory',
			icon: '🧠'
		},
		Wisdom: {
			fullName: 'Wisdom',
			description: 'Awareness and intuition',
			icon: '👁️'
		},
		Charisma: {
			fullName: 'Charisma',
			description: 'Confidence and force of personality',
			icon: '✨'
		},
		Free: {
			fullName: 'Free Choice',
			description: 'Choose any ability score',
			icon: '🎯'
		}
	};

	function handleSelect(ability: string) {
		// Don't allow selecting disabled abilities
		if (disabledAbilities.includes(ability)) return;
		onSelect?.(ability);
	}

	function isDisabled(ability: string): boolean {
		return disabledAbilities.includes(ability);
	}

	function getAbilityAbbreviation(ability: string): string {
		const abbrev: Record<string, string> = {
			Strength: 'STR',
			Dexterity: 'DEX',
			Constitution: 'CON',
			Intelligence: 'INT',
			Wisdom: 'WIS',
			Charisma: 'CHA',
			Free: 'FREE'
		};
		return abbrev[ability] || ability.substring(0, 3).toUpperCase();
	}
</script>

<div class="ability-boost-selector">
	<div class="selector-header">
		<h3 class="selector-label">
			{label}
			{#if required}
				<span class="required-indicator" aria-label="Required">*</span>
			{/if}
		</h3>
		{#if description}
			<p class="selector-description">{description}</p>
		{/if}
	</div>

	<div class="ability-grid">
		{#each availableAbilities as ability}
			{@const isSelected = selectedAbility === ability}
			{@const disabled = isDisabled(ability)}
			{@const info = abilityInfo[ability]}

			<button
				type="button"
				class="ability-card"
				class:selected={isSelected}
				class:disabled={disabled}
				onclick={() => handleSelect(ability)}
				aria-pressed={isSelected}
				aria-disabled={disabled}
				disabled={disabled}
			>
				<div class="card-icon" aria-hidden="true">{info?.icon || '⚡'}</div>
				<div class="card-content">
					<div class="card-abbr">{getAbilityAbbreviation(ability)}</div>
					<div class="card-name">{info?.fullName || ability}</div>
					{#if info?.description}
						<div class="card-description">{info.description}</div>
					{/if}
				</div>
				{#if isSelected}
					<div class="selected-indicator" aria-hidden="true">
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M16.6667 5L7.50004 14.1667L3.33337 10"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
				{/if}
			</button>
		{/each}
	</div>

	{#if !selectedAbility && required}
		<p class="validation-message">Please select an ability boost</p>
	{/if}
</div>

<style>
	.ability-boost-selector {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.selector-header {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.selector-label {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.required-indicator {
		color: #f03e3e;
		margin-left: 0.25rem;
	}

	.selector-description {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		line-height: 1.5;
	}

	.ability-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 1rem;
	}

	.ability-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1.25rem 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 10px;
		cursor: pointer;
		transition: all var(--transition-fast);
		font-family: inherit;
		color: inherit;
	}

	.ability-card:hover {
		border-color: var(--link-color, #5c7cfa);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.ability-card:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	.ability-card:active {
		transform: translateY(0);
	}

	.ability-card.selected {
		background-color: rgba(92, 124, 250, 0.15);
		border-color: var(--link-color, #5c7cfa);
		border-width: 3px;
	}

	.ability-card.disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background-color: var(--surface-3, #e0e0e0);
	}

	.ability-card.disabled:hover {
		border-color: var(--border-color, #e0e0e0);
		box-shadow: none;
		transform: none;
	}

	.card-icon {
		font-size: 2rem;
		line-height: 1;
	}

	.card-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		text-align: center;
	}

	.card-abbr {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--text-secondary, #666666);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.card-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.card-description {
		font-size: 0.75rem;
		color: var(--text-secondary, #666666);
		line-height: 1.4;
	}

	.selected-indicator {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background-color: var(--link-color, #5c7cfa);
		border-radius: 50%;
		color: white;
	}

	.validation-message {
		margin: 0;
		padding: 0.5rem 0.75rem;
		background-color: rgba(240, 62, 62, 0.1);
		border-left: 3px solid #f03e3e;
		border-radius: 4px;
		font-size: 0.875rem;
		color: #f03e3e;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.ability-grid {
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
			gap: 0.75rem;
		}

		.ability-card {
			padding: 1rem 0.75rem;
		}

		.card-icon {
			font-size: 1.5rem;
		}

		.card-description {
			display: none;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.ability-card {
			border-width: 3px;
		}

		.ability-card.selected {
			border-width: 4px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.ability-card {
			transition: none;
		}

		.ability-card:hover {
			transform: none;
		}

		.ability-card:active {
			transform: none;
		}
	}
</style>
