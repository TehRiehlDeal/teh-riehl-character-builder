<script lang="ts">
	import type { Spell } from '$lib/data/types/app';
	import Button from '../common/Button.svelte';

	/**
	 * SpellList Component
	 *
	 * Displays a list of spells with filtering and search capabilities.
	 */

	/** Strip HTML tags and Foundry syntax from a string for plain text display */
	function stripHtml(html: string): string {
		let text = html;

		// Convert @Damage[formula[types]] to readable text
		text = text.replace(/@Damage\[([^\]]+(?:\[[^\]]*\])?)\]/g, (match, content) => {
			const nestedMatch = content.match(/^(.+?)\[([^\]]*)\]$/);
			if (nestedMatch) {
				const formula = nestedMatch[1]
					.replace(/@item\.level/g, 'spell rank')
					.replace(/@actor\.level/g, 'level')
					.replace(/ceil\([^)]+\)/g, 'scaling')
					.replace(/floor\([^)]+\)/g, 'scaling');
				const types = nestedMatch[2];
				return `${formula} ${types} damage`;
			}
			return content;
		});

		// Strip other @ references
		text = text.replace(/@\w+\[[^\]]*\]/g, '');

		// Strip HTML tags and entities
		return text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
	}

	interface Props {
		/** Array of spells to display */
		spells: Spell[];

		/** Currently selected spell ID */
		selectedSpellId?: string | null;

		/** Callback when a spell is selected for details */
		// eslint-disable-next-line no-unused-vars
		onViewDetails?: (spell: Spell) => void;

		/** Callback when a spell is cast */
		// eslint-disable-next-line no-unused-vars
		onCastSpell?: (spell: Spell) => void;

		/** Whether to show cast buttons */
		showCastButtons?: boolean;

		/** Title for the list */
		title?: string;

		/** Filter spells to this tradition only */
		traditionFilter?: string | null;

		/** IDs of known/prepared spells (to show badge) */
		knownSpellIds?: string[];

		/** Label for the "known" badge */
		knownBadgeLabel?: string;

		/** Callback when a spell is added */
		// eslint-disable-next-line no-unused-vars
		onAddSpell?: (spell: Spell) => void;

		/** Whether to show add buttons */
		showAddButtons?: boolean;

		/** Label for the add button */
		addButtonLabel?: string;

		/** Label for the add button when already added */
		addedButtonLabel?: string;

		/** Max spell level available (to filter by) */
		maxSpellLevel?: number;

		/** Whether to show the school/trait filter */
		showSchoolFilter?: boolean;
	}

	let {
		spells,
		selectedSpellId = null,
		onViewDetails,
		onCastSpell,
		showCastButtons = false,
		title = 'Spells',
		traditionFilter = null,
		knownSpellIds = [],
		knownBadgeLabel = 'In Spellbook',
		onAddSpell,
		showAddButtons = false,
		addButtonLabel = 'Add to Spellbook',
		addedButtonLabel = 'In Spellbook',
		maxSpellLevel = 10,
		showSchoolFilter = false
	}: Props = $props();

	let searchQuery = $state('');
	let filterLevel = $state<number | 'all'>('all');
	let filterSchool = $state<string>('all');

	// Get unique spell schools
	const schools = $derived.by(() => {
		const uniqueSchools = new Set(spells.map((s) => s.traits).flat());
		return ['all', ...Array.from(uniqueSchools).sort()];
	});

	// Create a set of known spell IDs for quick lookup
	const knownSpellIdSet = $derived(new Set(knownSpellIds));

	// Filter spells
	const filteredSpells = $derived.by(() => {
		return spells.filter((spell) => {
			// Search filter
			if (searchQuery && !spell.name.toLowerCase().includes(searchQuery.toLowerCase())) {
				return false;
			}

			// Level filter
			if (filterLevel !== 'all' && spell.level !== filterLevel) {
				return false;
			}

			// School/trait filter
			if (filterSchool !== 'all' && !spell.traits?.includes(filterSchool)) {
				return false;
			}

			// Tradition filter (if provided)
			if (traditionFilter && !spell.traditions?.includes(traditionFilter)) {
				return false;
			}

			// Max spell level filter
			if (spell.level > maxSpellLevel) {
				return false;
			}

			return true;
		});
	});

	// Group spells by level
	const spellsByLevel = $derived.by(() => {
		const grouped = new Map<number, Spell[]>();

		for (const spell of filteredSpells) {
			if (!grouped.has(spell.level)) {
				grouped.set(spell.level, []);
			}
			grouped.get(spell.level)!.push(spell);
		}

		// Sort within each level by name
		for (const spellList of grouped.values()) {
			spellList.sort((a, b) => a.name.localeCompare(b.name));
		}

		return grouped;
	});

	// Get sorted levels
	const levels = $derived(Array.from(spellsByLevel.keys()).sort((a, b) => a - b));

	function clearFilters() {
		searchQuery = '';
		filterLevel = 'all';
		filterSchool = 'all';
	}
</script>

<div class="spell-list">
	<div class="list-header">
		<h3 class="list-title">{title}</h3>
		<span class="spell-count">{filteredSpells.length} spells</span>
	</div>

	<!-- Filters -->
	<div class="filters">
		<input
			type="search"
			bind:value={searchQuery}
			placeholder="Search spells..."
			class="search-input"
			aria-label="Search spells"
		/>

		<select bind:value={filterLevel} class="filter-select" aria-label="Filter by level">
			<option value="all">All Levels</option>
			{#each Array(11) as _, i}
				<option value={i}>{i === 0 ? 'Cantrips' : `Level ${i}`}</option>
			{/each}
		</select>

		{#if showSchoolFilter}
			<select bind:value={filterSchool} class="filter-select" aria-label="Filter by school">
				<option value="all">All Schools</option>
				{#each schools.filter((s) => s !== 'all') as school}
					<option value={school}>{school}</option>
				{/each}
			</select>
		{/if}

		<Button variant="ghost" size="sm" onclick={clearFilters}>Clear</Button>
	</div>

	<!-- Spell Groups by Level -->
	<div class="spell-groups">
		{#if levels.length === 0}
			<div class="empty-state">
				<p>No spells found matching your criteria.</p>
			</div>
		{:else}
			{#each levels as level}
				{@const levelSpells = spellsByLevel.get(level) ?? []}
				<div class="level-group">
					<h4 class="level-header">
						{level === 0 ? 'Cantrips' : `Level ${level}`}
						<span class="level-count">({levelSpells.length})</span>
					</h4>

					<div class="spell-cards">
						{#each levelSpells as spell}
							{@const isSelected = spell.id === selectedSpellId}
							{@const isKnown = knownSpellIdSet.has(spell.id)}
							{@const plainText = stripHtml(spell.description)}
							<div class="spell-card" class:selected={isSelected} class:known={isKnown}>
								<div class="spell-info">
									<div class="spell-header-row">
										<div class="spell-name-row">
											<h5 class="spell-name">{spell.name}</h5>
											{#if isKnown}
												<span class="known-badge">{knownBadgeLabel}</span>
											{/if}
										</div>
										{#if spell.traits && spell.traits.length > 0}
											<div class="spell-traits">
												{#each spell.traits.slice(0, 2) as trait}
													<span class="trait-badge">{trait}</span>
												{/each}
											</div>
										{/if}
									</div>

									<div class="spell-meta">
										<span class="meta-item">
											<strong>Cast:</strong>
											{spell.castingTime}
										</span>
										<span class="meta-item">
											<strong>Range:</strong>
											{spell.range}
										</span>
										{#if spell.duration}
											<span class="meta-item">
												<strong>Duration:</strong>
												{spell.duration}
											</span>
										{/if}
									</div>

									<p class="spell-description">
									{plainText.substring(0, 120)}{plainText.length > 120 ? '...' : ''}
								</p>
								</div>

								<div class="spell-actions">
									<Button variant="secondary" size="sm" onclick={() => onViewDetails?.(spell)}>
										Details
									</Button>
									{#if showAddButtons && onAddSpell}
										<Button
											variant="primary"
											size="sm"
											onclick={() => onAddSpell?.(spell)}
											disabled={isKnown}
										>
											{isKnown ? addedButtonLabel : addButtonLabel}
										</Button>
									{/if}
									{#if showCastButtons}
										<Button variant="primary" size="sm" onclick={() => onCastSpell?.(spell)}>
											Cast
										</Button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.spell-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.list-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.list-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.spell-count {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
		background-color: var(--surface-2, #f5f5f5);
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
	}

	.filters {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.search-input {
		flex: 1;
		min-width: 200px;
		padding: 0.625rem 1rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-size: 0.9375rem;
		font-family: inherit;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--focus-color, #5c7cfa);
	}

	.filter-select {
		padding: 0.625rem 1rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-size: 0.9375rem;
		font-family: inherit;
		background-color: white;
		min-width: 140px;
	}

	.filter-select:focus {
		outline: none;
		border-color: var(--focus-color, #5c7cfa);
	}

	.spell-groups {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.level-group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.level-header {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		padding-bottom: 0.5rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.level-count {
		font-size: 0.875rem;
		font-weight: 400;
		color: var(--text-secondary, #666666);
	}

	.spell-cards {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.spell-card {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		transition: all 0.2s;
	}

	.spell-card:hover {
		border-color: var(--link-color, #5c7cfa);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.spell-card.selected {
		background-color: rgba(92, 124, 250, 0.1);
		border-color: var(--link-color, #5c7cfa);
	}

	.spell-card.known {
		background-color: rgba(64, 192, 87, 0.05);
	}

	.spell-name-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.known-badge {
		padding: 0.125rem 0.5rem;
		background-color: #40c057;
		color: white;
		border-radius: 4px;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.spell-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.spell-header-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.spell-name {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.spell-traits {
		display: flex;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.trait-badge {
		padding: 0.25rem 0.5rem;
		background-color: var(--surface-3, #e0e0e0);
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary, #666666);
		text-transform: capitalize;
	}

	.spell-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		font-size: 0.8125rem;
		color: var(--text-secondary, #666666);
	}

	.meta-item {
		display: flex;
		gap: 0.25rem;
	}

	.spell-description {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--text-primary, #1a1a1a);
	}

	.spell-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: flex-end;
	}

	.empty-state {
		padding: 3rem;
		text-align: center;
		color: var(--text-secondary, #666666);
	}

	/* Mobile */
	@media (max-width: 768px) {
		.spell-card {
			flex-direction: column;
		}

		.spell-actions {
			flex-direction: row;
			width: 100%;
		}

		.filters {
			flex-direction: column;
		}

		.search-input,
		.filter-select {
			width: 100%;
			min-width: 0;
		}
	}
</style>
