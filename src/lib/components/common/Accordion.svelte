<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Accordion items */
		items: AccordionItem[];
		/** Allow multiple items to be open at once */
		multiple?: boolean;
		/** Initially open item indices */
		defaultOpen?: number[];
		/** Compact mode for tighter spacing */
		compact?: boolean;
	}

	interface AccordionItem {
		/** Unique identifier */
		id: string;
		/** Header text */
		title: string;
		/** Content snippet */
		content: Snippet;
		/** Optional icon snippet */
		icon?: Snippet;
		/** Whether this item is disabled */
		disabled?: boolean;
	}

	let { items, multiple = false, defaultOpen = [], compact = false }: Props = $props();

	// Track which items are open
	let openItems = $state<Set<string>>(new Set(defaultOpen.map((i) => items[i]?.id).filter(Boolean)));

	function toggleItem(id: string, disabled?: boolean) {
		if (disabled) return;

		if (openItems.has(id)) {
			// Close the item
			const newSet = new Set(openItems);
			newSet.delete(id);
			openItems = newSet;
		} else {
			// Open the item
			if (multiple) {
				openItems = new Set([...openItems, id]);
			} else {
				openItems = new Set([id]);
			}
		}
	}

	function handleKeyDown(event: KeyboardEvent, id: string, disabled?: boolean) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleItem(id, disabled);
		}
	}
</script>

<div class="accordion" class:compact>
	{#each items as item}
		{@const isOpen = openItems.has(item.id)}
		{@const itemId = `accordion-item-${item.id}`}
		{@const contentId = `accordion-content-${item.id}`}

		<div class="accordion-item" class:open={isOpen} class:disabled={item.disabled}>
			<button
				type="button"
				class="accordion-header"
				id={itemId}
				aria-expanded={isOpen}
				aria-controls={contentId}
				aria-disabled={item.disabled}
				onclick={() => toggleItem(item.id, item.disabled)}
				onkeydown={(e) => handleKeyDown(e, item.id, item.disabled)}
			>
				<div class="header-content">
					{#if item.icon}
						<div class="header-icon" aria-hidden="true">
							{@render item.icon()}
						</div>
					{/if}
					<span class="header-title">{item.title}</span>
				</div>
				<div class="header-indicator" aria-hidden="true">
					<svg
						class="chevron"
						width="20"
						height="20"
						viewBox="0 0 20 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M5 7.5L10 12.5L15 7.5"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>
			</button>

			<div
				class="accordion-content"
				id={contentId}
				role="region"
				aria-labelledby={itemId}
				hidden={!isOpen}
			>
				<div class="content-inner">
					{@render item.content()}
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	.accordion {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.accordion.compact {
		gap: 0.25rem;
	}

	.accordion-item {
		background-color: var(--surface-2, #f5f5f5);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		overflow: hidden;
		transition: all var(--transition-fast);
	}

	.accordion-item.open {
		background-color: var(--surface-1, #ffffff);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.accordion-item.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.accordion-header {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		background: none;
		border: none;
		font-family: inherit;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		cursor: pointer;
		text-align: left;
		transition: background-color var(--transition-fast);
	}

	.compact .accordion-header {
		padding: 0.75rem 1rem;
		font-size: 0.9375rem;
	}

	.accordion-header:hover:not([aria-disabled='true']) {
		background-color: rgba(0, 0, 0, 0.02);
	}

	.accordion-header:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: -2px;
	}

	.accordion-header[aria-disabled='true'] {
		cursor: not-allowed;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.header-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: var(--text-secondary, #666666);
	}

	.header-title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.header-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-left: 0.5rem;
	}

	.chevron {
		transition: transform var(--transition-base);
		color: var(--text-secondary, #666666);
	}

	.accordion-item.open .chevron {
		transform: rotate(180deg);
	}

	.accordion-content {
		overflow: hidden;
	}

	.accordion-content[hidden] {
		display: none;
	}

	.content-inner {
		padding: 0 1.25rem 1rem 1.25rem;
		color: var(--text-primary, #1a1a1a);
		line-height: 1.6;
		animation: slideDown var(--transition-base) ease-out;
	}

	.compact .content-inner {
		padding: 0 1rem 0.75rem 1rem;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Touch devices */
	@media (hover: none) and (pointer: coarse) {
		.accordion-header {
			padding: 1.25rem 1.5rem;
		}

		.compact .accordion-header {
			padding: 1rem 1.25rem;
		}

		.accordion-header:hover {
			background-color: transparent;
		}

		.accordion-header:active:not([aria-disabled='true']) {
			background-color: rgba(0, 0, 0, 0.04);
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.accordion-item {
			border-width: 2px;
		}

		.accordion-header:focus-visible {
			outline-width: 3px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.accordion-item,
		.accordion-header,
		.chevron {
			transition: none;
		}

		.content-inner {
			animation: none;
		}
	}
</style>
