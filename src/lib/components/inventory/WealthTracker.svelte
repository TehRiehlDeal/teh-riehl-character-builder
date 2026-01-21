<script lang="ts">
	interface Props {
		/** Platinum pieces */
		pp: number;
		/** Gold pieces */
		gp: number;
		/** Silver pieces */
		sp: number;
		/** Copper pieces */
		cp: number;
		/** Callback when wealth is updated */
		// eslint-disable-next-line no-unused-vars
		onUpdateWealth?: (pp: number, gp: number, sp: number, cp: number) => void;
	}

	let { pp, gp, sp, cp, onUpdateWealth }: Props = $props();

	let editing = $state(false);
	let editablePp = $state(pp);
	let editableGp = $state(gp);
	let editableSp = $state(sp);
	let editableCp = $state(cp);

	// Sync editable values when props change
	$effect(() => {
		if (!editing) {
			editablePp = pp;
			editableGp = gp;
			editableSp = sp;
			editableCp = cp;
		}
	});

	// Total wealth in gold pieces (for display)
	const totalInGold = $derived(
		pp * 10 + gp + sp * 0.1 + cp * 0.01
	);

	function startEditing() {
		editablePp = pp;
		editableGp = gp;
		editableSp = sp;
		editableCp = cp;
		editing = true;
	}

	function cancelEditing() {
		editablePp = pp;
		editableGp = gp;
		editableSp = sp;
		editableCp = cp;
		editing = false;
	}

	function saveEditing() {
		// Ensure non-negative values
		const newPp = Math.max(0, editablePp);
		const newGp = Math.max(0, editableGp);
		const newSp = Math.max(0, editableSp);
		const newCp = Math.max(0, editableCp);

		onUpdateWealth?.(newPp, newGp, newSp, newCp);
		editing = false;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			saveEditing();
		} else if (event.key === 'Escape') {
			cancelEditing();
		}
	}
</script>

<div class="wealth-tracker">
	<div class="tracker-header">
		<div class="header-content">
			<h3 class="tracker-title">Wealth</h3>
			<div class="total-wealth">
				<span class="total-label">Total:</span>
				<span class="total-value">{totalInGold.toFixed(2)} gp</span>
			</div>
		</div>
		{#if !editing}
			<button
				type="button"
				class="btn-edit"
				onclick={startEditing}
				aria-label="Edit wealth"
				title="Edit wealth"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		{/if}
	</div>

	{#if editing}
		<div class="wealth-edit">
			<div class="edit-grid">
				<div class="currency-field">
					<label for="pp-edit" class="currency-label">Platinum (pp)</label>
					<input
						id="pp-edit"
						type="number"
						class="currency-input"
						bind:value={editablePp}
						min="0"
						onkeydown={handleKeyDown}
					/>
				</div>
				<div class="currency-field">
					<label for="gp-edit" class="currency-label">Gold (gp)</label>
					<input
						id="gp-edit"
						type="number"
						class="currency-input"
						bind:value={editableGp}
						min="0"
						onkeydown={handleKeyDown}
					/>
				</div>
				<div class="currency-field">
					<label for="sp-edit" class="currency-label">Silver (sp)</label>
					<input
						id="sp-edit"
						type="number"
						class="currency-input"
						bind:value={editableSp}
						min="0"
						onkeydown={handleKeyDown}
					/>
				</div>
				<div class="currency-field">
					<label for="cp-edit" class="currency-label">Copper (cp)</label>
					<input
						id="cp-edit"
						type="number"
						class="currency-input"
						bind:value={editableCp}
						min="0"
						onkeydown={handleKeyDown}
					/>
				</div>
			</div>

			<div class="edit-actions">
				<button type="button" class="btn-cancel" onclick={cancelEditing}>
					Cancel
				</button>
				<button type="button" class="btn-save" onclick={saveEditing}>
					Save
				</button>
			</div>
		</div>
	{:else}
		<div class="wealth-display">
			<div class="currency-grid">
				<div class="currency-item">
					<span class="currency-icon">💎</span>
					<div class="currency-info">
						<span class="currency-amount">{pp}</span>
						<span class="currency-name">Platinum</span>
					</div>
				</div>
				<div class="currency-item">
					<span class="currency-icon">🪙</span>
					<div class="currency-info">
						<span class="currency-amount">{gp}</span>
						<span class="currency-name">Gold</span>
					</div>
				</div>
				<div class="currency-item">
					<span class="currency-icon">⚪</span>
					<div class="currency-info">
						<span class="currency-amount">{sp}</span>
						<span class="currency-name">Silver</span>
					</div>
				</div>
				<div class="currency-item">
					<span class="currency-icon">🟤</span>
					<div class="currency-info">
						<span class="currency-amount">{cp}</span>
						<span class="currency-name">Copper</span>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.wealth-tracker {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.tracker-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.header-content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.tracker-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.total-wealth {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background-color: rgba(92, 124, 250, 0.1);
		border-radius: 6px;
	}

	.total-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary, #666666);
	}

	.total-value {
		font-size: 1rem;
		font-weight: 700;
		color: var(--link-color, #5c7cfa);
	}

	.btn-edit {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		padding: 0.5rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		color: var(--text-primary, #1a1a1a);
		cursor: pointer;
		transition: all var(--transition-fast);
		flex-shrink: 0;
	}

	.btn-edit:hover {
		background-color: var(--link-color, #5c7cfa);
		border-color: var(--link-color, #5c7cfa);
		color: white;
	}

	.btn-edit:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	/* Display Mode */
	.wealth-display {
		padding: 1rem;
		background-color: var(--surface-1, #ffffff);
		border-radius: 8px;
		border: 2px solid var(--border-color, #e0e0e0);
	}

	.currency-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1.5rem;
	}

	.currency-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.currency-icon {
		font-size: 1.5rem;
		line-height: 1;
	}

	.currency-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.currency-amount {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
		line-height: 1.2;
	}

	.currency-name {
		font-size: 0.75rem;
		color: var(--text-secondary, #666666);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Edit Mode */
	.wealth-edit {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background-color: var(--surface-1, #ffffff);
		border-radius: 8px;
		border: 2px solid var(--link-color, #5c7cfa);
	}

	.edit-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 1rem;
	}

	.currency-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.currency-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.currency-input {
		padding: 0.5rem 0.75rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-size: 1rem;
		font-family: inherit;
		background-color: var(--surface-2, #f5f5f5);
		color: var(--text-primary, #1a1a1a);
		transition: border-color var(--transition-fast);
	}

	.currency-input:focus {
		outline: none;
		border-color: var(--link-color, #5c7cfa);
		background-color: var(--surface-1, #ffffff);
	}

	.edit-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.btn-cancel,
	.btn-save {
		padding: 0.625rem 1.25rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-family: inherit;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-cancel {
		background-color: var(--surface-2, #f5f5f5);
		color: var(--text-primary, #1a1a1a);
	}

	.btn-cancel:hover {
		background-color: var(--surface-3, #e0e0e0);
	}

	.btn-save {
		background-color: var(--link-color, #5c7cfa);
		color: white;
		border-color: var(--link-color, #5c7cfa);
	}

	.btn-save:hover {
		background-color: #4c6ef5;
		border-color: #4c6ef5;
	}

	.btn-cancel:focus-visible,
	.btn-save:focus-visible {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.currency-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.edit-grid {
			grid-template-columns: 1fr;
		}

		.header-content {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
