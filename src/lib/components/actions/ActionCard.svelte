<script lang="ts">
	import type { Action } from '$lib/data/types/app';
	import type { ActionAvailability } from '$lib/validation/actionValidation';
	import { getActionSkills } from '$lib/data/mappings/actionSkillMappings';
	import { getStatusLabel, getStatusColorClass } from '$lib/validation/actionValidation';

	interface Props {
		action: Action;
		availability: ActionAvailability;
		onclick?: () => void;
	}

	let { action, availability, onclick }: Props = $props();

	// Get action icon based on action type and count
	function getActionIcon(actionType: string, actions?: number): string {
		if (actionType === 'reaction') return '↩️';
		if (actionType === 'free') return '⚡';
		if (actionType === 'passive') return '—';

		if (actions === 1) return '◆';
		if (actions === 2) return '◆◆';
		if (actions === 3) return '◆◆◆';

		return '';
	}

	// Get skills for this action
	const skills = $derived(getActionSkills(action.name));

	// Extract short description (first 150 chars)
	const shortDescription = $derived.by(() => {
		// Strip HTML tags
		const text = action.description.replace(/<[^>]*>/g, '');
		if (text.length <= 150) return text;
		return text.slice(0, 150) + '...';
	});

	// Capitalize skill names for display
	function capitalizeSkill(skill: string): string {
		return skill
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
</script>

<button
	class="action-card"
	onclick={onclick}
	aria-label={`View details for ${action.name}`}
	type="button"
>
	<!-- Header with title and skill badges -->
	<div class="card-header">
		<div class="title-section">
			<span class="action-icon" aria-label={action.actionType}>
				{getActionIcon(action.actionType, action.actions)}
			</span>
			<h3 class="action-name">{action.name}</h3>
		</div>
		{#if skills.length > 0}
			<div class="skill-badges">
				{#each skills as skill}
					<span class="badge skill-badge">{capitalizeSkill(skill)}</span>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Meta badges (category, rarity) -->
	{#if action.category || (action.rarity && action.rarity !== 'common')}
		<div class="meta-badges">
			{#if action.category}
				<span class="badge category-badge">{action.category}</span>
			{/if}
			{#if action.rarity && action.rarity !== 'common'}
				<span class="badge rarity-badge rarity-{action.rarity}">{action.rarity}</span>
			{/if}
		</div>
	{/if}

	<!-- Description -->
	<p class="action-description">{shortDescription}</p>

	<!-- Footer with availability status -->
	<div class="card-footer">
		<div class="status-container">
			<span class="status-badge {getStatusColorClass(availability.status)}">
				{getStatusLabel(availability.status)}
			</span>
			{#if !availability.available && availability.reasons.length > 0}
				<span class="status-reason" title={availability.reasons.join(', ')}>
					{availability.reasons[0]}
				</span>
			{/if}
		</div>
	</div>
</button>

<style>
	.action-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		width: 100%;
		background-color: var(--surface-1, #ffffff);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		cursor: pointer;
		transition: all var(--transition-fast, 0.15s ease);
		text-align: left;
		font-family: inherit;
	}

	.action-card:hover {
		border-color: var(--link-color, #5c7cfa);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.action-card:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	/* Header */
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.title-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}

	.action-icon {
		font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
		font-weight: bold;
		font-size: 1.25rem;
		color: var(--link-color, #5c7cfa);
		flex-shrink: 0;
	}

	.action-name {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		line-height: 1.3;
		flex: 1;
	}

	.skill-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		justify-content: flex-end;
		flex-shrink: 0;
	}

	/* Meta badges */
	.meta-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	/* Badges */
	.badge {
		display: inline-block;
		padding: 0.125rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 4px;
		text-transform: capitalize;
	}

	.skill-badge {
		background-color: rgba(55, 178, 77, 0.1);
		color: #2f9e44;
		border: 1px solid rgba(55, 178, 77, 0.3);
	}

	.category-badge {
		background-color: rgba(92, 124, 250, 0.1);
		color: #5c7cfa;
		border: 1px solid rgba(92, 124, 250, 0.3);
	}

	.rarity-badge {
		border: 1px solid currentColor;
	}

	.rarity-badge.rarity-uncommon {
		background-color: rgba(250, 176, 5, 0.1);
		color: #c77700;
	}

	.rarity-badge.rarity-rare {
		background-color: rgba(240, 62, 62, 0.1);
		color: #e03131;
	}

	.rarity-badge.rarity-unique {
		background-color: rgba(174, 62, 201, 0.1);
		color: #ae3ec9;
	}

	/* Description */
	.action-description {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--text-secondary, #666666);
		flex: 1;
	}

	/* Footer */
	.card-footer {
		display: flex;
		justify-content: flex-end;
		margin-top: auto;
	}

	.status-container {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.25rem;
	}

	.status-badge {
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.status-available {
		background-color: rgba(55, 178, 77, 0.1);
		color: #2f9e44;
		border: 1px solid rgba(55, 178, 77, 0.3);
	}

	.status-requirements {
		background-color: rgba(250, 176, 5, 0.1);
		color: #c77700;
		border: 1px solid rgba(250, 176, 5, 0.3);
	}

	.status-unavailable {
		background-color: rgba(240, 62, 62, 0.1);
		color: #e03131;
		border: 1px solid rgba(240, 62, 62, 0.3);
	}

	.status-reason {
		font-size: 0.6875rem;
		color: var(--text-secondary, #666666);
		font-style: italic;
		text-align: right;
		max-width: 250px;
	}

	@media (prefers-reduced-motion: reduce) {
		.action-card {
			transition: none;
		}

		.action-card:hover {
			transform: none;
		}
	}
</style>
