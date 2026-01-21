<script lang="ts" generics="T">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props<T> {
		/** Array of items to render */
		items: T[];
		/** Height of each item in pixels */
		itemHeight: number;
		/** Height of the visible area in pixels */
		height?: number;
		/** Number of items to render outside visible area (overscan) */
		overscan?: number;
		/** Render function for each item */
		renderItem: Snippet<[T, number]>;
		/** Optional unique key extractor */
		// eslint-disable-next-line no-unused-vars
		getKey?: (item: T, index: number) => string | number;
		/** Optional empty state */
		emptyState?: Snippet;
	}

	let {
		items,
		itemHeight,
		height = 400,
		overscan = 3,
		renderItem,
		getKey,
		emptyState
	}: Props<T> = $props();

	let scrollTop = $state(0);
	let containerElement: HTMLElement | null = $state(null);

	// Calculate visible range
	const totalHeight = $derived(items.length * itemHeight);
	const visibleStart = $derived(Math.max(0, Math.floor(scrollTop / itemHeight) - overscan));
	const visibleEnd = $derived(
		Math.min(items.length, Math.ceil((scrollTop + height) / itemHeight) + overscan)
	);
	const visibleItems = $derived(items.slice(visibleStart, visibleEnd));
	const offsetY = $derived(visibleStart * itemHeight);

	function handleScroll(event: Event) {
		const target = event.target as HTMLElement;
		scrollTop = target.scrollTop;
	}

	function scrollToIndex(index: number) {
		if (!containerElement) return;

		const targetScrollTop = index * itemHeight;
		containerElement.scrollTop = targetScrollTop;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!containerElement) return;

		const target = event.target as HTMLElement;
		const currentIndex = parseInt(target.dataset.index || '0', 10);

		let nextIndex: number | null = null;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				nextIndex = Math.min(currentIndex + 1, items.length - 1);
				break;

			case 'ArrowUp':
				event.preventDefault();
				nextIndex = Math.max(currentIndex - 1, 0);
				break;

			case 'Home':
				event.preventDefault();
				nextIndex = 0;
				break;

			case 'End':
				event.preventDefault();
				nextIndex = items.length - 1;
				break;

			case 'PageDown':
				event.preventDefault();
				nextIndex = Math.min(currentIndex + Math.floor(height / itemHeight), items.length - 1);
				break;

			case 'PageUp':
				event.preventDefault();
				nextIndex = Math.max(currentIndex - Math.floor(height / itemHeight), 0);
				break;
		}

		if (nextIndex !== null && nextIndex !== currentIndex) {
			scrollToIndex(nextIndex);

			// Focus the next item after scroll
			setTimeout(() => {
				const nextElement = containerElement?.querySelector<HTMLElement>(
					`[data-index="${nextIndex}"]`
				);
				nextElement?.focus();
			}, 10);
		}
	}

	// Expose scrollToIndex for external use
	export function scrollTo(index: number) {
		scrollToIndex(index);
	}

	onMount(() => {
		return () => {
			// Cleanup if needed
		};
	});
</script>

<div
	bind:this={containerElement}
	class="virtual-list"
	style="height: {height}px;"
	onscroll={handleScroll}
	role="list"
>
	<div class="virtual-list-spacer" style="height: {totalHeight}px;">
		<div class="virtual-list-items" style="transform: translateY({offsetY}px);">
			{#if visibleItems.length === 0 && emptyState}
				<div class="virtual-list-empty">
					{@render emptyState()}
				</div>
			{:else}
				{#each visibleItems as item, i (getKey ? getKey(item, visibleStart + i) : visibleStart + i)}
					{@const actualIndex = visibleStart + i}
					<div
						class="virtual-list-item"
						style="height: {itemHeight}px;"
						role="listitem"
						tabindex="0"
						data-index={actualIndex}
						onkeydown={handleKeyDown}
					>
						{@render renderItem(item, actualIndex)}
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>

<style>
	.virtual-list {
		overflow-y: auto;
		overflow-x: hidden;
		position: relative;
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 4px;
		background-color: var(--surface-1, #ffffff);
	}

	.virtual-list-spacer {
		position: relative;
		width: 100%;
	}

	.virtual-list-items {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		will-change: transform;
	}

	.virtual-list-item {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--border-color, #e0e0e0);
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.virtual-list-item:hover {
		background-color: var(--surface-2, #f5f5f5);
	}

	.virtual-list-item:focus {
		outline: none;
		background-color: var(--surface-2, #f5f5f5);
		box-shadow: inset 3px 0 0 var(--link-color, #5c7cfa);
	}

	.virtual-list-item:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: -2px;
	}

	.virtual-list-item:last-child {
		border-bottom: none;
	}

	.virtual-list-empty {
		padding: 2rem;
		text-align: center;
		color: var(--text-secondary, #666666);
	}

	/* Scrollbar styling */
	.virtual-list::-webkit-scrollbar {
		width: 12px;
	}

	.virtual-list::-webkit-scrollbar-track {
		background: var(--surface-2, #f5f5f5);
	}

	.virtual-list::-webkit-scrollbar-thumb {
		background: var(--surface-3, #e0e0e0);
		border-radius: 6px;
	}

	.virtual-list::-webkit-scrollbar-thumb:hover {
		background: var(--border-color, #e0e0e0);
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.virtual-list {
			border-width: 2px;
		}

		.virtual-list-item {
			border-bottom-width: 2px;
		}

		.virtual-list-item:focus {
			box-shadow: inset 4px 0 0 var(--link-color, #000000);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.virtual-list-item {
			transition: none;
		}

		.virtual-list-items {
			will-change: auto;
		}
	}
</style>
