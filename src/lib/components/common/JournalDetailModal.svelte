<script lang="ts">
	import type { JournalPage } from '$lib/data/types/app';
	import Modal from './Modal.svelte';
	import RichDescription from './RichDescription.svelte';

	interface Props {
		/** Whether the modal is open */
		open: boolean;
		/** The journal page to display */
		page: JournalPage | null;
	}

	let { open = $bindable(), page }: Props = $props();
</script>

{#if page}
	<Modal bind:open title={page.name} size="lg">
		<div class="journal-page">
			<div class="journal-content">
				<RichDescription content={page.content} />
			</div>
		</div>
	</Modal>
{/if}

<style>
	.journal-page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.journal-content {
		color: var(--text-primary, #1a1a1a);
		line-height: 1.7;
	}

	/* Style the journal content for better readability */
	.journal-content :global(h2) {
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		border-bottom: 2px solid var(--border-color, #e0e0e0);
		padding-bottom: 0.5rem;
	}

	.journal-content :global(h3) {
		margin-top: 1.25rem;
		margin-bottom: 0.5rem;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.journal-content :global(h2:first-child),
	.journal-content :global(h3:first-child) {
		margin-top: 0;
	}

	.journal-content :global(ul) {
		margin: 0.75rem 0;
		padding-left: 1.75rem;
	}

	.journal-content :global(li) {
		margin-bottom: 0.5rem;
		line-height: 1.6;
	}

	.journal-content :global(p) {
		margin: 0.75rem 0;
	}

	.journal-content :global(p:first-child) {
		margin-top: 0;
	}

	.journal-content :global(p:last-child) {
		margin-bottom: 0;
	}

	.journal-content :global(hr) {
		margin: 1.5rem 0;
		border: none;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}

	.journal-content :global(em) {
		color: var(--text-secondary, #666666);
	}
</style>
