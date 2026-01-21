<script lang="ts">
	import DataChangeNotice from '$lib/components/features/DataChangeNotice.svelte';
	import { createCharacter, type Character } from '$lib/engine/models/Character';
	import Button from '$lib/components/common/Button.svelte';

	// Create a test character with an old data version
	let testCharacter = $state<Character>(
		createCharacter({
			id: 'test-character-1',
			name: 'Test Character',
			dataVersion: 'data-v2026.01.1' // Old version
		})
	);

	let showNotice = $state(true);
	let updateLog = $state<string[]>([]);

	function handleUpdateVersion(newVersion: string) {
		updateLog = [
			...updateLog,
			`Character updated from ${testCharacter.dataVersion} to ${newVersion}`
		];
		testCharacter.dataVersion = newVersion;
		testCharacter.updatedAt = new Date();
	}

	function handleDismiss() {
		updateLog = [
			...updateLog,
			`User dismissed update notice for ${testCharacter.dataVersion} -> current version`
		];
	}

	function resetCharacter() {
		testCharacter = createCharacter({
			id: 'test-character-1',
			name: 'Test Character',
			dataVersion: 'data-v2026.01.1'
		});
		showNotice = true;
		updateLog = [...updateLog, 'Character reset to old version'];
	}
</script>

<svelte:head>
	<title>Data Update Demo - Character Builder</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<h1 class="page-title">Data Update Notification Demo</h1>
		<p class="page-description">Test the data update notification system.</p>
	</header>

	<div class="content-sections">
		<!-- Current State -->
		<section class="content-section">
			<h2 class="section-title">Current Character State</h2>
			<div class="character-info">
				<div class="info-item">
					<span class="info-label">Character Name:</span>
					<span class="info-value">{testCharacter.name}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Data Version:</span>
					<span class="info-value version-badge">{testCharacter.dataVersion}</span>
				</div>
				<div class="info-item">
					<span class="info-label">Last Updated:</span>
					<span class="info-value">{testCharacter.updatedAt.toLocaleString()}</span>
				</div>
			</div>
		</section>

		<!-- Controls -->
		<section class="content-section">
			<h2 class="section-title">Demo Controls</h2>
			<div class="controls">
				<Button variant="primary" onclick={resetCharacter}>
					Reset Character to Old Version
				</Button>
				<Button variant="secondary" onclick={() => (showNotice = true)}>
					Show Notice Again
				</Button>
			</div>
		</section>

		<!-- Update Log -->
		<section class="content-section">
			<h2 class="section-title">Update Log</h2>
			<div class="log-container">
				{#if updateLog.length === 0}
					<p class="empty-log">No updates yet. Interact with the notification to see logs.</p>
				{:else}
					<div class="log-entries">
						{#each updateLog as entry, index}
							<div class="log-entry">
								<span class="log-index">{index + 1}.</span>
								<span class="log-text">{entry}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</section>

		<!-- Instructions -->
		<section class="content-section info-box">
			<h3>How to Test</h3>
			<ol>
				<li>
					The test character is created with <code>data-v2026.01.1</code>, which is older than
					the current version
				</li>
				<li>
					A notification banner should appear at the top of the page (purple gradient)
				</li>
				<li>Click "View Changes" to open the detailed modal</li>
				<li>Review the version comparison and changelog</li>
				<li>Try both "Accept Update" and "Keep Current Version" options</li>
				<li>Use "Reset Character" to test the flow again</li>
				<li>Check the update log to see what actions were taken</li>
			</ol>

			<h3 class="features-title">Features Demonstrated:</h3>
			<ul>
				<li>🔔 Persistent banner notification for outdated characters</li>
				<li>📊 Visual version comparison (old vs. new)</li>
				<li>📝 Detailed changelog between versions</li>
				<li>ℹ️ Impact explanation and recommendations</li>
				<li>✅ Accept update (updates character.dataVersion)</li>
				<li>❌ Dismiss/Keep current (stores user acknowledgment)</li>
				<li>📱 Mobile-responsive layout</li>
			</ul>

			<p class="note">
				<strong>Note:</strong> In the full application, this component would be integrated into
				the main character sheet layout and automatically detect when a character's data version
				is outdated. The dismissal state would be persisted to localStorage or the character's
				metadata.
			</p>
		</section>
	</div>
</div>

<!-- Data Change Notice Component -->
<DataChangeNotice
	character={testCharacter}
	bind:show={showNotice}
	onUpdateVersion={handleUpdateVersion}
	onDismiss={handleDismiss}
/>

<style>
	.page-content {
		max-width: 1000px;
		margin: 0 auto;
		padding-top: 80px; /* Space for banner */
	}

	.page-header {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.page-title {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		color: var(--text-primary, #1a1a1a);
	}

	.page-description {
		font-size: 1.125rem;
		margin: 0;
		color: var(--text-secondary, #666666);
	}

	.content-sections {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.content-section {
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		color: var(--text-primary, #1a1a1a);
	}

	.character-info {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background-color: var(--surface-1, #ffffff);
		border-radius: 8px;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border-color, #e0e0e0);
	}

	.info-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.info-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary, #666666);
	}

	.info-value {
		font-size: 1rem;
		font-weight: 500;
		color: var(--text-primary, #1a1a1a);
	}

	.version-badge {
		padding: 0.375rem 0.75rem;
		background-color: #ffc107;
		color: #856404;
		border-radius: 6px;
		font-family: 'Courier New', monospace;
		font-weight: 700;
	}

	.controls {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.log-container {
		padding: 1rem;
		background-color: var(--surface-1, #ffffff);
		border-radius: 8px;
		min-height: 100px;
	}

	.empty-log {
		margin: 0;
		text-align: center;
		color: var(--text-secondary, #666666);
		font-style: italic;
	}

	.log-entries {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.log-entry {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem;
		background-color: var(--surface-2, #f5f5f5);
		border-radius: 6px;
		border-left: 4px solid var(--link-color, #5c7cfa);
	}

	.log-index {
		font-weight: 700;
		color: var(--link-color, #5c7cfa);
		flex-shrink: 0;
	}

	.log-text {
		color: var(--text-primary, #1a1a1a);
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	.info-box {
		background-color: #e3f2fd;
		border: 2px solid #2196f3;
	}

	.info-box h3 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1565c0;
	}

	.features-title {
		margin-top: 1.5rem;
	}

	.info-box ol,
	.info-box ul {
		margin: 0 0 1rem 0;
		padding-left: 1.5rem;
	}

	.info-box li {
		margin-bottom: 0.5rem;
		font-size: 0.9375rem;
		line-height: 1.5;
		color: #1a1a1a;
	}

	.info-box code {
		padding: 0.125rem 0.375rem;
		background-color: rgba(33, 150, 243, 0.1);
		border-radius: 3px;
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
		color: #1565c0;
	}

	.note {
		margin: 0;
		padding: 1rem;
		background-color: rgba(33, 150, 243, 0.1);
		border-left: 4px solid #2196f3;
		border-radius: 4px;
		font-size: 0.875rem;
		line-height: 1.5;
		color: #1a1a1a;
	}

	.note strong {
		color: #1565c0;
	}

	/* Mobile */
	@media (max-width: 768px) {
		.page-title {
			font-size: 1.75rem;
		}

		.page-description {
			font-size: 1rem;
		}

		.section-title {
			font-size: 1.25rem;
		}

		.content-section {
			padding: 1.25rem;
		}

		.controls {
			flex-direction: column;
		}

		.info-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}
</style>
