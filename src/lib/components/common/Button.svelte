<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		/** Button variant */
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
		/** Button size */
		size?: 'sm' | 'md' | 'lg';
		/** Full width button */
		fullWidth?: boolean;
		/** Loading state */
		loading?: boolean;
		/** Icon before text */
		iconBefore?: Snippet;
		/** Icon after text */
		iconAfter?: Snippet;
		/** Button content */
		children?: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		fullWidth = false,
		loading = false,
		disabled = false,
		type = 'button',
		class: className = '',
		iconBefore,
		iconAfter,
		children,
		...restProps
	}: Props = $props();

	const isDisabled = $derived(disabled || loading);
</script>

<button
	type={type}
	disabled={isDisabled}
	class="btn btn-{variant} btn-{size} {className}"
	class:btn-full={fullWidth}
	class:btn-loading={loading}
	aria-busy={loading}
	{...restProps}
>
	{#if loading}
		<span class="btn-spinner" aria-hidden="true"></span>
	{/if}

	{#if iconBefore && !loading}
		<span class="btn-icon btn-icon-before" aria-hidden="true">
			{@render iconBefore()}
		</span>
	{/if}

	{#if children}
		<span class="btn-text">
			{@render children()}
		</span>
	{/if}

	{#if iconAfter}
		<span class="btn-icon btn-icon-after" aria-hidden="true">
			{@render iconAfter()}
		</span>
	{/if}
</button>

<style>
	.btn {
		/* Base styles */
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-family: inherit;
		font-weight: 600;
		text-align: center;
		text-decoration: none;
		white-space: nowrap;
		cursor: pointer;
		user-select: none;
		border: 2px solid transparent;
		border-radius: 6px;
		transition: all var(--transition-fast);
		position: relative;
	}

	.btn:focus-visible {
		outline: 2px solid var(--focus-color);
		outline-offset: 2px;
	}

	.btn:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Sizes */
	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
		line-height: 1.25;
	}

	.btn-md {
		padding: 0.5rem 1rem;
		font-size: 1rem;
		line-height: 1.5;
	}

	.btn-lg {
		padding: 0.75rem 1.5rem;
		font-size: 1.125rem;
		line-height: 1.5;
	}

	/* Full width */
	.btn-full {
		width: 100%;
	}

	/* Variants */
	.btn-primary {
		background-color: var(--link-color, #5c7cfa);
		color: white;
		border-color: var(--link-color, #5c7cfa);
	}

	.btn-primary:hover:not(:disabled) {
		background-color: var(--link-hover-color, #4263eb);
		border-color: var(--link-hover-color, #4263eb);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(92, 124, 250, 0.3);
	}

	.btn-primary:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: 0 2px 4px rgba(92, 124, 250, 0.2);
	}

	.btn-secondary {
		background-color: var(--surface-2, #f5f5f5);
		color: var(--text-primary, #1a1a1a);
		border-color: var(--border-color, #e0e0e0);
	}

	.btn-secondary:hover:not(:disabled) {
		background-color: var(--surface-3, #e0e0e0);
		border-color: var(--text-secondary, #666666);
	}

	.btn-secondary:active:not(:disabled) {
		background-color: var(--border-color, #e0e0e0);
	}

	.btn-danger {
		background-color: #fa5252;
		color: white;
		border-color: #fa5252;
	}

	.btn-danger:hover:not(:disabled) {
		background-color: #f03e3e;
		border-color: #f03e3e;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(250, 82, 82, 0.3);
	}

	.btn-danger:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: 0 2px 4px rgba(250, 82, 82, 0.2);
	}

	.btn-ghost {
		background-color: transparent;
		color: var(--text-primary, #1a1a1a);
		border-color: transparent;
	}

	.btn-ghost:hover:not(:disabled) {
		background-color: var(--surface-2, #f5f5f5);
	}

	.btn-ghost:active:not(:disabled) {
		background-color: var(--surface-3, #e0e0e0);
	}

	.btn-link {
		background-color: transparent;
		color: var(--link-color, #5c7cfa);
		border-color: transparent;
		padding: 0;
		min-height: auto;
	}

	.btn-link:hover:not(:disabled) {
		color: var(--link-hover-color, #4263eb);
		text-decoration: underline;
	}

	/* Loading state */
	.btn-loading {
		color: transparent;
		pointer-events: none;
	}

	.btn-spinner {
		position: absolute;
		width: 1em;
		height: 1em;
		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	.btn-primary .btn-spinner,
	.btn-danger .btn-spinner {
		border-color: white;
		border-right-color: transparent;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Icons */
	.btn-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.btn-text {
		display: inline-block;
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.btn {
			border-width: 3px;
		}

		.btn-primary,
		.btn-danger {
			border-color: currentColor;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.btn {
			transition: none;
		}

		.btn:hover:not(:disabled) {
			transform: none;
		}

		.btn-spinner {
			animation: none;
		}
	}
</style>
