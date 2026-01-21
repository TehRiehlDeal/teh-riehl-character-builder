<script lang="ts">
	import type { Class } from '$lib/data/types/app';
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';
	import RichDescription from './RichDescription.svelte';

	interface Props {
		/** Whether the modal is open */
		open?: boolean;
		/** The class to display */
		classData: Class | null;
		/** Callback when modal is closed */
		onClose?: () => void;
	}

	let { open = $bindable(false), classData, onClose }: Props = $props();

	function handleClose() {
		open = false;
		onClose?.();
	}

	// Format proficiency rank for display
	function formatProficiency(rank: number): string {
		const rankMap: Record<number, string> = {
			0: 'Untrained',
			1: 'Trained',
			2: 'Expert',
			3: 'Master',
			4: 'Legendary'
		};
		return rankMap[rank] || 'Untrained';
	}

	// Get proficiency class for styling
	function getProficiencyClass(rank: number): string {
		const classMap: Record<number, string> = {
			0: 'untrained',
			1: 'trained',
			2: 'expert',
			3: 'master',
			4: 'legendary'
		};
		return classMap[rank] || 'untrained';
	}
</script>

{#if classData}
	<Modal bind:open={open} title={classData.name} size="lg" onClose={handleClose}>
		<div class="class-detail">
			<!-- Header Info -->
			<div class="class-header">
				<div class="class-meta">
					<span class="meta-badge hp-badge">{classData.hp} HP</span>
					{#if classData.rarity && classData.rarity !== 'common'}
						<span class="meta-badge rarity-badge rarity-{classData.rarity}">{classData.rarity}</span>
					{/if}
				</div>
			</div>

			<!-- Key Ability -->
			<div class="detail-section">
				<h4>Key Ability</h4>
				<p class="key-ability">
					{classData.keyAbility.map((a) => a.toUpperCase()).join(' or ')}
				</p>
			</div>

			<!-- Description -->
			<div class="detail-section">
				<h4>Description</h4>
				<RichDescription content={classData.description} class="class-description-content" />
			</div>

			<!-- Proficiencies -->
			<div class="detail-section">
				<h4>Initial Proficiencies</h4>

				<div class="proficiency-grid">
					<!-- Saving Throws -->
					<div class="proficiency-group">
						<h5>Saving Throws</h5>
						<div class="proficiency-list">
							<div class="proficiency-item">
								<span>Fortitude</span>
								<span class="prof-badge {getProficiencyClass(classData.proficiencies.fortitude)}">
									{formatProficiency(classData.proficiencies.fortitude)}
								</span>
							</div>
							<div class="proficiency-item">
								<span>Reflex</span>
								<span class="prof-badge {getProficiencyClass(classData.proficiencies.reflex)}">
									{formatProficiency(classData.proficiencies.reflex)}
								</span>
							</div>
							<div class="proficiency-item">
								<span>Will</span>
								<span class="prof-badge {getProficiencyClass(classData.proficiencies.will)}">
									{formatProficiency(classData.proficiencies.will)}
								</span>
							</div>
						</div>
					</div>

					<!-- Perception -->
					<div class="proficiency-group">
						<h5>Perception</h5>
						<div class="proficiency-list">
							<div class="proficiency-item">
								<span>Perception</span>
								<span class="prof-badge {getProficiencyClass(classData.proficiencies.perception)}">
									{formatProficiency(classData.proficiencies.perception)}
								</span>
							</div>
						</div>
					</div>

					<!-- Class DC -->
					<div class="proficiency-group">
						<h5>Class DC</h5>
						<div class="proficiency-list">
							<div class="proficiency-item">
								<span>Class DC</span>
								<span class="prof-badge {getProficiencyClass(classData.proficiencies.classDC)}">
									{formatProficiency(classData.proficiencies.classDC)}
								</span>
							</div>
						</div>
					</div>

					<!-- Attacks -->
					<div class="proficiency-group">
						<h5>Attacks</h5>
						<div class="proficiency-list">
							<div class="proficiency-item">
								<span>Simple Weapons</span>
								<span class="prof-badge {getProficiencyClass(classData.proficiencies.attacks.simple)}">
									{formatProficiency(classData.proficiencies.attacks.simple)}
								</span>
							</div>
							<div class="proficiency-item">
								<span>Martial Weapons</span>
								<span
									class="prof-badge {getProficiencyClass(classData.proficiencies.attacks.martial)}"
								>
									{formatProficiency(classData.proficiencies.attacks.martial)}
								</span>
							</div>
							<div class="proficiency-item">
								<span>Advanced Weapons</span>
								<span
									class="prof-badge {getProficiencyClass(classData.proficiencies.attacks.advanced)}"
								>
									{formatProficiency(classData.proficiencies.attacks.advanced)}
								</span>
							</div>
							<div class="proficiency-item">
								<span>Unarmed Attacks</span>
								<span class="prof-badge {getProficiencyClass(classData.proficiencies.attacks.unarmed)}">
									{formatProficiency(classData.proficiencies.attacks.unarmed)}
								</span>
							</div>
						</div>
					</div>

					<!-- Defenses -->
					<div class="proficiency-group">
						<h5>Defenses</h5>
						<div class="proficiency-list">
							<div class="proficiency-item">
								<span>Unarmored Defense</span>
								<span
									class="prof-badge {getProficiencyClass(classData.proficiencies.defenses.unarmored)}"
								>
									{formatProficiency(classData.proficiencies.defenses.unarmored)}
								</span>
							</div>
							<div class="proficiency-item">
								<span>Light Armor</span>
								<span class="prof-badge {getProficiencyClass(classData.proficiencies.defenses.light)}">
									{formatProficiency(classData.proficiencies.defenses.light)}
								</span>
							</div>
							<div class="proficiency-item">
								<span>Medium Armor</span>
								<span class="prof-badge {getProficiencyClass(classData.proficiencies.defenses.medium)}">
									{formatProficiency(classData.proficiencies.defenses.medium)}
								</span>
							</div>
							<div class="proficiency-item">
								<span>Heavy Armor</span>
								<span class="prof-badge {getProficiencyClass(classData.proficiencies.defenses.heavy)}">
									{formatProficiency(classData.proficiencies.defenses.heavy)}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Skills -->
			<div class="detail-section">
				<h4>Skills</h4>
				<p class="skills-text">
					{#if classData.skills.trained.length > 0}
						<strong>Trained in:</strong>
						{classData.skills.trained.join(', ')}
						<br />
					{/if}
					<strong>Additional:</strong>
					{classData.skills.additional} skill{classData.skills.additional !== 1 ? 's' : ''}
				</p>
			</div>

			<!-- Traits -->
			{#if classData.traits && classData.traits.length > 0}
				<div class="detail-section">
					<h4>Traits</h4>
					<div class="trait-list">
						{#each classData.traits as trait}
							<span class="trait-badge">{trait}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Source -->
			{#if classData.source}
				<div class="detail-section source-section">
					<p class="source-text">
						<strong>Source:</strong>
						{classData.source.title}
						{#if classData.source.remaster}
							<span class="remaster-badge" title="Remastered content">Remaster</span>
						{/if}
					</p>
				</div>
			{/if}
		</div>

		{#snippet footer()}
			<Button variant="secondary" onclick={handleClose}>Close</Button>
		{/snippet}
	</Modal>
{/if}

<style>
	.class-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.class-header {
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.class-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.meta-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		border-radius: 4px;
		text-transform: capitalize;
	}

	.hp-badge {
		background-color: rgba(240, 62, 62, 0.1);
		color: #e03131;
		border: 1px solid rgba(240, 62, 62, 0.3);
	}

	.rarity-badge {
		border: 1px solid currentColor;
	}

	.rarity-badge.rarity-uncommon {
		background-color: rgba(250, 176, 5, 0.1);
		color: #c77700;
	}

	.rarity-badge.rarity-rare {
		background-color: rgba(240, 62, 62, 0.1);
		color: #e03131;
	}

	.rarity-badge.rarity-unique {
		background-color: rgba(174, 62, 201, 0.1);
		color: #ae3ec9;
	}

	.detail-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.detail-section h4 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
		border-bottom: 1px solid var(--border-color, #e0e0e0);
		padding-bottom: 0.25rem;
	}

	.key-ability {
		margin: 0;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.proficiency-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.proficiency-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.proficiency-group h5 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary, #666);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.proficiency-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.proficiency-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
	}

	.prof-badge {
		display: inline-block;
		padding: 0.125rem 0.5rem;
		border-radius: 3px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.prof-badge.untrained {
		background-color: rgba(160, 160, 160, 0.1);
		color: #666;
		border: 1px solid rgba(160, 160, 160, 0.3);
	}

	.prof-badge.trained {
		background-color: rgba(55, 178, 77, 0.1);
		color: #2f9e44;
		border: 1px solid rgba(55, 178, 77, 0.3);
	}

	.prof-badge.expert {
		background-color: rgba(92, 124, 250, 0.1);
		color: #5c7cfa;
		border: 1px solid rgba(92, 124, 250, 0.3);
	}

	.prof-badge.master {
		background-color: rgba(174, 62, 201, 0.1);
		color: #ae3ec9;
		border: 1px solid rgba(174, 62, 201, 0.3);
	}

	.prof-badge.legendary {
		background-color: rgba(250, 176, 5, 0.1);
		color: #c77700;
		border: 1px solid rgba(250, 176, 5, 0.3);
	}

	.skills-text {
		margin: 0;
		color: var(--text-primary, #1a1a1a);
		line-height: 1.6;
	}

	.trait-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.trait-badge {
		display: inline-block;
		padding: 0.25rem 0.625rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 4px;
		font-size: 0.875rem;
		color: var(--text-secondary, #666);
		text-transform: lowercase;
	}

	.source-section {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
	}

	.source-text {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary, #666);
	}

	.remaster-badge {
		display: inline-block;
		margin-left: 0.5rem;
		padding: 0.125rem 0.5rem;
		background-color: rgba(55, 178, 77, 0.1);
		color: #2f9e44;
		border: 1px solid rgba(55, 178, 77, 0.3);
		border-radius: 3px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	/* Ensure nested RichDescription styles work */
	.class-detail :global(.class-description-content) {
		color: var(--text-primary, #1a1a1a);
	}
</style>
