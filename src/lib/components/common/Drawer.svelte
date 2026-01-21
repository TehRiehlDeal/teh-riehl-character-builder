<script lang="ts">
	import type { Snippet } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		/** Whether the drawer is open */
		open?: boolean;
		/** Position of the drawer */
		position?: 'left' | 'right' | 'top' | 'bottom';
		/** Drawer content */
		children: Snippet;
		/** Callback when drawer is closed */
		onClose?: () => void;
		/** Whether to show backdrop */
		showBackdrop?: boolean;
		/** Whether clicking backdrop closes drawer */
		closeOnBackdropClick?: boolean;
		/** Whether ESC key closes drawer */
		closeOnEscape?: boolean;
		/** Optional title for accessibility */
		title?: string;
	}

	let {
		open = $bindable(false),
		position = 'left',
		children,
		onClose,
		showBackdrop = true,
		closeOnBackdropClick = true,
		closeOnEscape = true,
		title
	}: Props = $props();

	let drawerElement: HTMLElement | null = $state(null);
	let previousActiveElement: Element | null = null;

	// Touch gesture support
	let touchStartX = $state(0);
	let touchStartY = $state(0);
	let touchDeltaX = $state(0);
	let touchDeltaY = $state(0);
	let isDragging = $state(false);

	function handleClose() {
		open = false;
		onClose?.();
	}

	function handleBackdropClick() {
		if (closeOnBackdropClick) {
			handleClose();
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (closeOnEscape && event.key === 'Escape') {
			event.preventDefault();
			handleClose();
		}

		// Trap focus within drawer
		if (event.key === 'Tab' && drawerElement) {
			const focusableElements = drawerElement.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];

			if (event.shiftKey && document.activeElement === firstElement) {
				event.preventDefault();
				lastElement?.focus();
			} else if (!event.shiftKey && document.activeElement === lastElement) {
				event.preventDefault();
				firstElement?.focus();
			}
		}
	}

	// Touch gesture handlers
	function handleTouchStart(event: TouchEvent) {
		touchStartX = event.touches[0].clientX;
		touchStartY = event.touches[0].clientY;
		isDragging = true;
	}

	function handleTouchMove(event: TouchEvent) {
		if (!isDragging) return;

		const currentX = event.touches[0].clientX;
		const currentY = event.touches[0].clientY;
		touchDeltaX = currentX - touchStartX;
		touchDeltaY = currentY - touchStartY;

		// Apply transform based on position and delta
		if (drawerElement) {
			const threshold = 50;
			const shouldClose =
				(position === 'left' && touchDeltaX < -threshold) ||
				(position === 'right' && touchDeltaX > threshold) ||
				(position === 'top' && touchDeltaY < -threshold) ||
				(position === 'bottom' && touchDeltaY > threshold);

			if (shouldClose) {
				// Allow some visual feedback but don't go too far
				const maxDelta = 100;
				if (position === 'left' || position === 'right') {
					const clampedDelta = Math.max(-maxDelta, Math.min(0, touchDeltaX));
					drawerElement.style.transform =
						position === 'left' ? `translateX(${clampedDelta}px)` : `translateX(${-clampedDelta}px)`;
				} else {
					const clampedDelta = Math.max(-maxDelta, Math.min(0, touchDeltaY));
					drawerElement.style.transform =
						position === 'top' ? `translateY(${clampedDelta}px)` : `translateY(${-clampedDelta}px)`;
				}
			}
		}
	}

	function handleTouchEnd() {
		if (!isDragging) return;

		isDragging = false;

		// Determine if we should close based on swipe distance
		const threshold = 100;
		const shouldClose =
			(position === 'left' && touchDeltaX < -threshold) ||
			(position === 'right' && touchDeltaX > threshold) ||
			(position === 'top' && touchDeltaY < -threshold) ||
			(position === 'bottom' && touchDeltaY > threshold);

		if (drawerElement) {
			drawerElement.style.transform = '';
		}

		if (shouldClose) {
			handleClose();
		}

		touchDeltaX = 0;
		touchDeltaY = 0;
	}

	// Handle open/close effects
	$effect(() => {
		if (browser) {
			if (open) {
				previousActiveElement = document.activeElement;
				document.body.classList.add('drawer-open');

				// Focus first focusable element in drawer
				setTimeout(() => {
					const firstFocusable = drawerElement?.querySelector<HTMLElement>(
						'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
					);
					firstFocusable?.focus();
				}, 100);
			} else {
				document.body.classList.remove('drawer-open');

				// Restore focus to previous element
				if (previousActiveElement instanceof HTMLElement) {
					previousActiveElement.focus();
				}
			}
		}
	});
</script>

{#if open}
	<!-- Backdrop -->
	{#if showBackdrop}
		<div class="drawer-backdrop" onclick={handleBackdropClick} aria-hidden="true"></div>
	{/if}

	<!-- Drawer -->
	<div
		bind:this={drawerElement}
		class="drawer"
		class:left={position === 'left'}
		class:right={position === 'right'}
		class:top={position === 'top'}
		class:bottom={position === 'bottom'}
		role="dialog"
		aria-modal="true"
		aria-label={title || 'Drawer'}
		tabindex="-1"
		onkeydown={handleKeyDown}
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
	>
		<div class="drawer-content">
			{@render children()}
		</div>
	</div>
{/if}

<style>
	:global(body.drawer-open) {
		overflow: hidden;
	}

	.drawer-backdrop {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 999;
		animation: fadeIn var(--transition-base) ease-out;
	}

	.drawer {
		position: fixed;
		background-color: var(--surface-1, #ffffff);
		z-index: 1000;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
		overflow-y: auto;
		overflow-x: hidden;
		overscroll-behavior: contain;
	}

	/* Position variants */
	.drawer.left {
		top: 0;
		bottom: 0;
		left: 0;
		width: min(85vw, 400px);
		animation: slideInLeft var(--transition-base) ease-out;
	}

	.drawer.right {
		top: 0;
		bottom: 0;
		right: 0;
		width: min(85vw, 400px);
		animation: slideInRight var(--transition-base) ease-out;
	}

	.drawer.top {
		top: 0;
		left: 0;
		right: 0;
		height: min(85vh, 600px);
		animation: slideInTop var(--transition-base) ease-out;
	}

	.drawer.bottom {
		bottom: 0;
		left: 0;
		right: 0;
		height: min(85vh, 600px);
		animation: slideInBottom var(--transition-base) ease-out;
	}

	.drawer-content {
		min-height: 100%;
		padding: 1.5rem;
	}

	/* Animations */
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideInLeft {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(0);
		}
	}

	@keyframes slideInRight {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	@keyframes slideInTop {
		from {
			transform: translateY(-100%);
		}
		to {
			transform: translateY(0);
		}
	}

	@keyframes slideInBottom {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		.drawer.left,
		.drawer.right {
			width: min(90vw, 400px);
		}

		.drawer.top,
		.drawer.bottom {
			height: min(90vh, 600px);
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.drawer {
			border: 2px solid var(--border-color, #000000);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.drawer-backdrop,
		.drawer {
			animation: none;
		}

		.drawer {
			transition: none;
		}
	}
</style>
