<script lang="ts">
	import type { Heritage } from '$lib/data/types/app';
	import Button from '../common/Button.svelte';
	import RichDescription from '../common/RichDescription.svelte';
	import {
		formatSenseType,
		formatSkillName,
		formatProficiencyRank,
		formatSpeedType,
		extractItemNameFromUUID
	} from '$lib/data/processors/heritageRuleProcessor';

	interface Props {
		/** Available heritages for the selected ancestry */
		heritages: Heritage[];
		/** Currently selected heritage */
		selectedHeritage?: Heritage | null;
		/** Callback when heritage is selected */
		// eslint-disable-next-line no-unused-vars
		onSelect?: (heritage: Heritage) => void;
	}

	let { heritages, selectedHeritage = null, onSelect }: Props = $props();

	function handleSelect(heritage: Heritage) {
		onSelect?.(heritage);
	}

	// Check if heritage has any meaningful benefits to display
	function hasBenefits(heritage: Heritage): boolean {
		const b = heritage.benefits;
		return (
			b.senses.length > 0 ||
			b.grantedItems.length > 0 ||
			b.skillProficiencies.length > 0 ||
			b.speeds.length > 0 ||
			b.strikes.length > 0 ||
			b.modifiers.length > 0 ||
			b.choices.length > 0
		);
	}
</script>

<div class="heritage-selector">
	<div class="selector-header">
		<h3 class="selector-title">Choose Your Heritage</h3>
		<p class="selector-description">
			Your heritage represents your ancestry's lineage and grants you special abilities or traits.
		</p>
	</div>

	<!-- Heritage List Container - Scrollable -->
	<div class="grid-container">
		<div class="heritage-list">
			{#each heritages as heritage}
				{@const isSelected = selectedHeritage?.name === heritage.name}

				<div class="heritage-card" class:selected={isSelected}>
					<div class="card-header">
						<h4 class="heritage-name">{heritage.name}</h4>
						{#if heritage.rarity && heritage.rarity !== 'common'}
							<span class="rarity-badge">{heritage.rarity}</span>
						{/if}
					</div>

					{#if heritage.description}
						<RichDescription content={heritage.description} class="heritage-description" />
					{/if}

					{#if hasBenefits(heritage)}
						<div class="heritage-benefits">
							<!-- Senses -->
							{#if heritage.benefits.senses.length > 0}
								<div class="benefit-group">
									<strong class="benefit-label">Senses:</strong>
									<span class="benefit-value">
										{heritage.benefits.senses
											.map((s) =>
												s.range ? `${formatSenseType(s.type)} ${s.range} ft.` : formatSenseType(s.type)
											)
											.join(', ')}
									</span>
								</div>
							{/if}

							<!-- Granted Items (Feats/Features) -->
							{#if heritage.benefits.grantedItems.length > 0}
								<div class="benefit-group">
									<strong class="benefit-label">Grants:</strong>
									<span class="benefit-value">
										{heritage.benefits.grantedItems
											.map((item) => item.label || extractItemNameFromUUID(item.uuid))
											.join(', ')}
									</span>
								</div>
							{/if}

							<!-- Skill Proficiencies -->
							{#if heritage.benefits.skillProficiencies.length > 0}
								<div class="benefit-group">
									<strong class="benefit-label">Skills:</strong>
									<span class="benefit-value">
										{heritage.benefits.skillProficiencies
											.map(
												(skill) =>
													`${formatSkillName(skill.skill)} (${formatProficiencyRank(skill.rank)})`
											)
											.join(', ')}
									</span>
								</div>
							{/if}

							<!-- Speeds -->
							{#if heritage.benefits.speeds.length > 0}
								<div class="benefit-group">
									<strong class="benefit-label">Speed:</strong>
									<span class="benefit-value">
										{heritage.benefits.speeds
											.map((speed) => `${formatSpeedType(speed.type)} ${speed.value} ft.`)
											.join(', ')}
									</span>
								</div>
							{/if}

							<!-- Strikes -->
							{#if heritage.benefits.strikes.length > 0}
								<div class="benefit-group">
									<strong class="benefit-label">Attacks:</strong>
									<span class="benefit-value">
										{heritage.benefits.strikes
											.map(
												(strike) =>
													`${strike.label} (${strike.damage.dice}${strike.damage.die} ${strike.damage.type})`
											)
											.join(', ')}
									</span>
								</div>
							{/if}

							<!-- Modifiers (conditional) -->
							{#if heritage.benefits.modifiers.length > 0}
								{@const unconditionalModifiers = heritage.benefits.modifiers.filter(
									(m) => !m.predicate || m.predicate.length === 0
								)}
								{#if unconditionalModifiers.length > 0}
									<div class="benefit-group">
										<strong class="benefit-label">Bonuses:</strong>
										<span class="benefit-value">
											{unconditionalModifiers
												.map((mod) => {
													const value = typeof mod.value === 'number' ? mod.value : mod.value;
													const sign = typeof value === 'number' && value > 0 ? '+' : '';
													return `${sign}${value} to ${mod.selector}`;
												})
												.join(', ')}
										</span>
									</div>
								{/if}
							{/if}

							<!-- Choices -->
							{#if heritage.benefits.choices.length > 0}
								{#each heritage.benefits.choices as choice}
									<div class="benefit-group">
										{#if choice.config === 'skills'}
											<strong class="benefit-label">Skill Training:</strong>
											<span class="benefit-value">
												Choose one skill to become trained (expert at 5th level)
											</span>
										{:else}
											<strong class="benefit-label">Choice:</strong>
											<span class="benefit-value">
												Choose from {choice.choices.length} options
											</span>
										{/if}
									</div>
								{/each}
							{/if}
						</div>
					{/if}

					{#if heritage.traits && heritage.traits.length > 0}
						<div class="heritage-traits">
							{#each heritage.traits as trait}
								<span class="trait-badge">{trait}</span>
							{/each}
						</div>
					{/if}

					<div class="card-actions">
						<Button
							variant={isSelected ? 'secondary' : 'primary'}
							size="sm"
							disabled={isSelected}
							onclick={() => handleSelect(heritage)}
						>
							{isSelected ? 'Selected' : 'Select'}
						</Button>
					</div>
				</div>
			{/each}
		</div>
	</div>

	{#if heritages.length === 0}
		<div class="empty-state">
			<p>No heritages available. Please select an ancestry first.</p>
		</div>
	{/if}
</div>

<style>
	.heritage-selector {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.selector-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.selector-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.selector-description {
		margin: 0;
		color: var(--text-secondary, #666666);
		line-height: 1.6;
	}

	/* Grid Container - Scrollable */
	.grid-container {
		max-height: 700px; /* Approximately 2 rows of cards */
		overflow-y: auto;
		overflow-x: hidden;
		padding-right: 0.5rem; /* Space for scrollbar */
		margin-right: -0.5rem;
	}

	/* Heritage List */
	.heritage-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.heritage-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.25rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		transition: all var(--transition-fast);
	}

	.heritage-card:hover {
		border-color: var(--link-color, #5c7cfa);
	}

	.heritage-card.selected {
		background-color: rgba(92, 124, 250, 0.1);
		border-color: var(--link-color, #5c7cfa);
		border-width: 3px;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.heritage-name {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.rarity-badge {
		padding: 0.25rem 0.5rem;
		background-color: var(--surface-3, #e0e0e0);
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary, #666666);
		text-transform: uppercase;
		flex-shrink: 0;
	}

	.heritage-traits {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.trait-badge {
		padding: 0.25rem 0.5rem;
		background-color: var(--surface-1, #ffffff);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
	}

	.heritage-benefits {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: rgba(92, 124, 250, 0.05);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.benefit-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		line-height: 1.5;
	}

	.benefit-label {
		color: var(--text-primary, #1a1a1a);
		font-weight: 600;
		flex-shrink: 0;
	}

	.benefit-value {
		color: var(--text-secondary, #666666);
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.empty-state {
		padding: 3rem;
		text-align: center;
		color: var(--text-secondary, #666666);
		background-color: var(--surface-2, #f5f5f5);
		border: 2px dashed var(--border-color, #e0e0e0);
		border-radius: 8px;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.selector-title {
			font-size: 1.25rem;
		}

		.heritage-card {
			padding: 1rem;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.heritage-card {
			border-width: 3px;
		}

		.heritage-card.selected {
			border-width: 4px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.heritage-card {
			transition: none;
		}
	}
</style>
