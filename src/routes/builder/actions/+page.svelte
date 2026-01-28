<script lang="ts">
	import { getBuilderDataContext } from '$lib/contexts/builderDataContext.svelte';
	import { character } from '$lib/stores/character';
	import ActionList from '$lib/components/actions/ActionList.svelte';
	import ActionDetailModal from '$lib/components/common/ActionDetailModal.svelte';
	import { isCoreAction } from '$lib/data/mappings/actionSkillMappings';
	import type { Action } from '$lib/data/types/app';

	// Get data from context
	const builderData = getBuilderDataContext();

	// Filter to only basic and skill actions (74 total)
	const filteredActions = $derived.by(() => {
		return builderData.actions.filter((action) => {
			// Include only actions in our curated list (26 basic + 48 skill actions)
			return isCoreAction(action.name);
		});
	});

	// Modal state
	let selectedAction = $state<Action | null>(null);
	let modalOpen = $state(false);

	function handleActionClick(action: Action) {
		selectedAction = action;
		modalOpen = true;
	}

	function handleModalClose() {
		modalOpen = false;
		selectedAction = null;
	}
</script>

<svelte:head>
	<title>Actions - PF2e Character Builder</title>
</svelte:head>

<div class="actions-page">
	<header class="page-header">
		<h1>Actions</h1>
		<p class="page-description">
			View all basic actions and skill actions available in Pathfinder 2nd Edition. Actions marked
			as "Available" can be used by your character based on skill proficiencies and requirements.
		</p>
	</header>

	{#if builderData.loading}
		<div class="loading-state">
			<p>Loading actions...</p>
		</div>
	{:else if filteredActions.length === 0}
		<div class="error-state">
			<p>No actions found. Please ensure game data is loaded correctly.</p>
		</div>
	{:else}
		<ActionList
			actions={filteredActions}
			character={$character}
			onActionClick={handleActionClick}
		/>
	{/if}
</div>

<!-- Action Detail Modal -->
<ActionDetailModal bind:open={modalOpen} action={selectedAction} onClose={handleModalClose} />

<style>
	.actions-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.page-description {
		margin: 0;
		font-size: 1rem;
		line-height: 1.6;
		color: var(--text-secondary, #666666);
	}

	.loading-state,
	.error-state {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 400px;
		padding: 2rem;
		text-align: center;
	}

	.loading-state p,
	.error-state p {
		margin: 0;
		font-size: 1.125rem;
		color: var(--text-secondary, #666666);
	}

	.error-state p {
		color: var(--error-color, #e03131);
	}

	@media (max-width: 768px) {
		.page-header h1 {
			font-size: 1.75rem;
		}

		.page-description {
			font-size: 0.9375rem;
		}
	}
</style>
