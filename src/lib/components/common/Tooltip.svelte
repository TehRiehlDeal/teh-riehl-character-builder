<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		/** Tooltip content */
		content: string;
		/** Tooltip position */
		position?: 'top' | 'bottom' | 'left' | 'right';
		/** Delay before showing tooltip (ms) */
		delay?: number;
		/** Element that triggers the tooltip */
		children: Snippet;
	}

	let {
		content,
		position = 'top',
		delay = 200,
		children
	}: Props = $props();

	let isVisible = $state(false);
	let triggerElement: HTMLElement | null = $state(null);
	let tooltipElement: HTMLElement | null = $state(null);
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let tooltipId = `tooltip-${Math.random().toString(36).substring(2, 9)}`;

	function show() {
		if (timeoutId) clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			isVisible = true;
		}, delay);
	}

	function hide() {
		if (timeoutId) clearTimeout(timeoutId);
		isVisible = false;
	}

	function handleKeyDown(event: KeyboardEvent) {
		// Show tooltip on focus, hide on Escape
		if (event.key === 'Escape') {
			hide();
		}
	}

	onMount(() => {
		// Ensure proper ARIA relationship
		if (triggerElement) {
			triggerElement.setAttribute('aria-describedby', tooltipId);
		}

		return () => {
			if (timeoutId) clearTimeout(timeoutId);
		};
	});
</script>

<span
	class="tooltip-wrapper"
	bind:this={triggerElement}
	onmouseenter={show}
	onmouseleave={hide}
	onfocus={show}
	onblur={hide}
	onkeydown={handleKeyDown}
>
	{@render children()}

	{#if isVisible}
		<span
			bind:this={tooltipElement}
			id={tooltipId}
			role="tooltip"
			class="tooltip tooltip-{position}"
		>
			{content}
			<span class="tooltip-arrow" aria-hidden="true"></span>
		</span>
	{/if}
</span>

<style>
	.tooltip-wrapper {
		position: relative;
		display: inline-flex;
	}

	.tooltip {
		position: absolute;
		z-index: 1000;
		padding: 0.5rem 0.75rem;
		background-color: var(--text-primary, #1a1a1a);
		color: white;
		font-size: 0.875rem;
		line-height: 1.4;
		border-radius: 4px;
		white-space: nowrap;
		pointer-events: none;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		animation: tooltip-fade-in 150ms ease-out;
	}

	@keyframes tooltip-fade-in {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.tooltip-arrow {
		position: absolute;
		width: 0;
		height: 0;
		border-style: solid;
	}

	/* Top position */
	.tooltip-top {
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
	}

	.tooltip-top .tooltip-arrow {
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border-width: 6px 6px 0 6px;
		border-color: var(--text-primary, #1a1a1a) transparent transparent transparent;
	}

	/* Bottom position */
	.tooltip-bottom {
		top: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
	}

	.tooltip-bottom .tooltip-arrow {
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		border-width: 0 6px 6px 6px;
		border-color: transparent transparent var(--text-primary, #1a1a1a) transparent;
	}

	/* Left position */
	.tooltip-left {
		right: calc(100% + 8px);
		top: 50%;
		transform: translateY(-50%);
	}

	.tooltip-left .tooltip-arrow {
		left: 100%;
		top: 50%;
		transform: translateY(-50%);
		border-width: 6px 0 6px 6px;
		border-color: transparent transparent transparent var(--text-primary, #1a1a1a);
	}

	/* Right position */
	.tooltip-right {
		left: calc(100% + 8px);
		top: 50%;
		transform: translateY(-50%);
	}

	.tooltip-right .tooltip-arrow {
		right: 100%;
		top: 50%;
		transform: translateY(-50%);
		border-width: 6px 6px 6px 0;
		border-color: transparent var(--text-primary, #1a1a1a) transparent transparent;
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.tooltip {
			border: 2px solid white;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.tooltip {
			animation: none;
		}
	}
</style>
