<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		/** Whether the modal is open */
		open: boolean;
		/** Modal title */
		title?: string;
		/** Size of the modal */
		size?: 'sm' | 'md' | 'lg' | 'xl';
		/** Callback when modal closes */
		onClose?: () => void;
		/** Show close button */
		showCloseButton?: boolean;
		/** Close on backdrop click */
		closeOnBackdrop?: boolean;
		/** Close on escape key */
		closeOnEscape?: boolean;
		/** Modal content */
		children: Snippet;
		/** Optional footer content */
		footer?: Snippet;
	}

	let {
		open = $bindable(false),
		title,
		size = 'md',
		onClose,
		showCloseButton = true,
		closeOnBackdrop = true,
		closeOnEscape = true,
		children,
		footer
	}: Props = $props();

	let modalElement: HTMLElement | null = $state(null);
	let previousActiveElement: Element | null = null;
	let modalId = `modal-${Math.random().toString(36).substring(2, 9)}`;
	let titleId = `${modalId}-title`;

	function handleClose() {
		open = false;
		onClose?.();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (closeOnBackdrop && event.target === event.currentTarget) {
			handleClose();
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!open) return;

		// Close on Escape
		if (closeOnEscape && event.key === 'Escape') {
			event.preventDefault();
			handleClose();
			return;
		}

		// Focus trap with Tab
		if (event.key === 'Tab' && modalElement) {
			const focusableElements = modalElement.querySelectorAll<HTMLElement>(
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

	$effect(() => {
		if (open) {
			// Save currently focused element
			previousActiveElement = document.activeElement;

			// Prevent body scroll
			document.body.classList.add('focus-trap-active');

			// Focus the modal after a brief delay
			setTimeout(() => {
				const firstFocusable = modalElement?.querySelector<HTMLElement>(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
				);
				firstFocusable?.focus();
			}, 50);
		} else {
			// Restore body scroll
			document.body.classList.remove('focus-trap-active');

			// Restore focus to previous element
			if (previousActiveElement instanceof HTMLElement) {
				previousActiveElement.focus();
			}
			previousActiveElement = null;
		}
	});

	onMount(() => {
		return () => {
			// Cleanup on unmount
			document.body.classList.remove('focus-trap-active');
		};
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if open}
	<div
		class="modal-backdrop"
		onclick={handleBackdropClick}
		role="presentation"
	>
		<div
			bind:this={modalElement}
			class="modal modal-{size}"
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? titleId : undefined}
			id={modalId}
		>
			{#if title || showCloseButton}
				<div class="modal-header">
					{#if title}
						<h2 id={titleId} class="modal-title">{title}</h2>
					{/if}

					{#if showCloseButton}
						<button
							type="button"
							class="modal-close"
							onclick={handleClose}
							aria-label="Close modal"
						>
							<span aria-hidden="true">×</span>
						</button>
					{/if}
				</div>
			{/if}

			<div class="modal-body">
				{@render children()}
			</div>

			{#if footer}
				<div class="modal-footer">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 1000;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		overflow-y: auto;
		animation: backdrop-fade-in 200ms ease-out;
	}

	@keyframes backdrop-fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal {
		background-color: var(--surface-1, #ffffff);
		border-radius: 8px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		max-height: calc(100vh - 2rem);
		display: flex;
		flex-direction: column;
		animation: modal-slide-up 200ms ease-out;
		position: relative;
	}

	@keyframes modal-slide-up {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Sizes */
	.modal-sm {
		width: 100%;
		max-width: 400px;
	}

	.modal-md {
		width: 100%;
		max-width: 600px;
	}

	.modal-lg {
		width: 100%;
		max-width: 800px;
	}

	.modal-xl {
		width: 100%;
		max-width: 1200px;
	}

	/* Header */
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid var(--border-color, #e0e0e0);
		flex-shrink: 0;
	}

	.modal-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.modal-close {
		background: none;
		border: none;
		padding: 0.5rem;
		margin: -0.5rem -0.5rem -0.5rem 0;
		font-size: 2rem;
		line-height: 1;
		color: var(--text-secondary, #666666);
		cursor: pointer;
		transition: color var(--transition-fast);
		border-radius: 4px;
	}

	.modal-close:hover {
		color: var(--text-primary, #1a1a1a);
	}

	.modal-close:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	/* Body */
	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
		color: var(--text-primary, #1a1a1a);
	}

	/* Footer */
	.modal-footer {
		padding: 1.5rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		flex-shrink: 0;
	}

	/* Mobile adjustments */
	@media (max-width: 640px) {
		.modal-backdrop {
			padding: 0;
			align-items: flex-end;
		}

		.modal {
			max-height: 90vh;
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
			width: 100% !important;
			max-width: none !important;
		}

		@keyframes modal-slide-up {
			from {
				transform: translateY(100%);
			}
			to {
				transform: translateY(0);
			}
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.modal {
			border: 3px solid var(--text-primary, #000000);
		}

		.modal-header,
		.modal-footer {
			border-width: 2px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.modal-backdrop,
		.modal {
			animation: none;
		}
	}
</style>
