<script lang="ts">
	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';

	let offlineReady = $state(false);
	let needRefresh = $state(false);
	let updateServiceWorker: (() => Promise<void>) | undefined = $state(undefined);
	let isOnline = $state(true);

	onMount(() => {
		if (pwaInfo) {
			import('virtual:pwa-register').then(({ registerSW }) => {
				updateServiceWorker = registerSW({
					immediate: true,
					onOfflineReady() {
						offlineReady = true;
					},
					onNeedRefresh() {
						needRefresh = true;
					},
					onRegisteredSW(swScriptUrl) {
						console.log('Service Worker registered:', swScriptUrl);
					}
				});
			});
		}

		// Monitor online/offline status
		const handleOnline = () => (isOnline = true);
		const handleOffline = () => (isOnline = false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		isOnline = navigator.onLine;

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});

	function close() {
		offlineReady = false;
		needRefresh = false;
	}
</script>

{#if !isOnline}
	<div
		class="pwa-offline-indicator"
		role="status"
		aria-live="polite"
		aria-label="You are currently offline"
	>
		<span class="offline-icon">⚠</span>
		<span>Offline</span>
	</div>
{/if}

{#if offlineReady || needRefresh}
	<div class="pwa-toast" role="alert" aria-live="assertive">
		<div class="message">
			{#if offlineReady}
				<span>App ready to work offline</span>
			{:else}
				<span>New content available, click reload to update</span>
			{/if}
		</div>
		<div class="actions">
			{#if needRefresh}
				<button onclick={() => updateServiceWorker?.()} aria-label="Reload to update">
					Reload
				</button>
			{/if}
			<button onclick={close} aria-label="Close notification">Close</button>
		</div>
	</div>
{/if}

<style>
	.pwa-offline-indicator {
		position: fixed;
		top: 1rem;
		right: 1rem;
		background-color: #fbbf24;
		color: #78350f;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		box-shadow:
			0 4px 6px -1px rgb(0 0 0 / 0.1),
			0 2px 4px -2px rgb(0 0 0 / 0.1);
		z-index: 9999;
	}

	.offline-icon {
		font-size: 1rem;
	}

	.pwa-toast {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		background-color: white;
		color: #1f2937;
		padding: 1rem;
		border-radius: 0.5rem;
		box-shadow:
			0 10px 15px -3px rgb(0 0 0 / 0.1),
			0 4px 6px -4px rgb(0 0 0 / 0.1);
		max-width: 24rem;
		z-index: 9999;
		border: 1px solid #e5e7eb;
	}

	.message {
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	button {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		border: 1px solid transparent;
		cursor: pointer;
		transition: all 0.2s;
	}

	button:first-child {
		background-color: #5c16c5;
		color: white;
		border-color: #5c16c5;
	}

	button:first-child:hover {
		background-color: #4c0db0;
	}

	button:last-child {
		background-color: transparent;
		color: #6b7280;
		border-color: #d1d5db;
	}

	button:last-child:hover {
		background-color: #f3f4f6;
	}

	button:focus-visible {
		outline: 2px solid #5c16c5;
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		button {
			transition: none;
		}
	}
</style>
