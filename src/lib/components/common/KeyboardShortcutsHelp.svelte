<script lang="ts">
	import Modal from './Modal.svelte';
	import { keyboardShortcuts, formatKeys } from '$lib/utils/keyboardShortcuts';

	interface Props {
		/** Whether the modal is open */
		open?: boolean;
		/** Callback when modal is closed */
		onClose?: () => void;
	}

	let { open = $bindable(false), onClose }: Props = $props();

	// Get all shortcuts grouped by category
	const shortcuts = $derived.by(() => {
		const all = keyboardShortcuts.getAll();
		const categories = keyboardShortcuts.getCategories();

		return categories.map((category) => ({
			category,
			shortcuts: all.filter((s) => s.category === category)
		}));
	});

	function handleClose() {
		open = false;
		onClose?.();
	}
</script>

<Modal bind:open={open} title="Keyboard Shortcuts" size="lg" onClose={handleClose}>
	<div class="shortcuts-help">
		<p class="help-intro">
			Use these keyboard shortcuts to navigate and interact with the character builder more
			efficiently. All shortcuts are designed to avoid conflicts with screen readers.
		</p>

		<div class="shortcuts-container">
			{#each shortcuts as { category, shortcuts: categoryShortcuts }}
				<div class="shortcuts-category">
					<h3 class="category-title">{category}</h3>
					<dl class="shortcuts-list">
						{#each categoryShortcuts as shortcut}
							<div class="shortcut-item">
								<dt class="shortcut-name">{shortcut.name}</dt>
								<dd class="shortcut-keys">
									<kbd class="key-combo">{formatKeys(shortcut.keys)}</kbd>
								</dd>
								<dd class="shortcut-description">{shortcut.description}</dd>
							</div>
						{/each}
					</dl>
				</div>
			{/each}
		</div>

		{#if shortcuts.length === 0}
			<div class="no-shortcuts">
				<p>No keyboard shortcuts are currently registered.</p>
			</div>
		{/if}

		<div class="help-footer">
			<p class="footer-note">
				<strong>Note:</strong> Some shortcuts may not work when focus is in a text input field.
			</p>
		</div>
	</div>
</Modal>

<style>
	.shortcuts-help {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.help-intro {
		margin: 0;
		color: var(--text-secondary, #666666);
		line-height: 1.6;
	}

	.shortcuts-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.shortcuts-category {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.category-title {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		padding-bottom: 0.5rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.shortcuts-list {
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.shortcut-item {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-rows: auto auto;
		gap: 0.25rem 1rem;
		padding: 0.75rem;
		border-radius: 6px;
		background-color: var(--surface-2, #f5f5f5);
		transition: background-color var(--transition-fast);
	}

	.shortcut-item:hover {
		background-color: var(--surface-3, #e0e0e0);
	}

	.shortcut-name {
		grid-column: 1;
		grid-row: 1;
		margin: 0;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		font-size: 0.9375rem;
	}

	.shortcut-keys {
		grid-column: 2;
		grid-row: 1 / 3;
		margin: 0;
		display: flex;
		align-items: center;
	}

	.shortcut-description {
		grid-column: 1;
		grid-row: 2;
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		line-height: 1.4;
	}

	.key-combo {
		display: inline-block;
		padding: 0.375rem 0.75rem;
		background-color: var(--surface-1, #ffffff);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Consolas', monospace;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		box-shadow: 0 2px 0 var(--border-color, #e0e0e0);
		white-space: nowrap;
	}

	.no-shortcuts {
		padding: 3rem;
		text-align: center;
		color: var(--text-secondary, #666666);
	}

	.help-footer {
		padding-top: 1rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}

	.footer-note {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		line-height: 1.5;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.shortcut-item {
			grid-template-columns: 1fr;
			grid-template-rows: auto auto auto;
			gap: 0.5rem;
		}

		.shortcut-keys {
			grid-column: 1;
			grid-row: 3;
			justify-content: flex-start;
		}

		.shortcut-description {
			grid-row: 2;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.category-title {
			border-bottom-width: 3px;
		}

		.key-combo {
			border-width: 3px;
		}
	}
</style>
