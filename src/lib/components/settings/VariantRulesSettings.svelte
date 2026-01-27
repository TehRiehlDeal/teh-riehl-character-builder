<script lang="ts">
	import { settings, type VariantRules } from '$lib/stores/settings';
	import Button from '../common/Button.svelte';

	// Variant rule descriptions (exclude sub-options like freeArchetypeNoRestriction)
	const variantRuleInfo: Record<Exclude<keyof VariantRules, 'freeArchetypeNoRestriction'>, { name: string; description: string; impact: string }> = {
		freeArchetype: {
			name: 'Free Archetype',
			description: 'Gain an additional class feat at every even level that must be used for archetype feats.',
			impact: 'Significantly increases character versatility and multiclassing options without sacrificing core class progression.'
		},
		automaticBonusProgression: {
			name: 'Automatic Bonus Progression',
			description: 'Characters gain inherent bonuses as they level, reducing dependency on magic items.',
			impact: 'Changes equipment dynamics and makes characters less reliant on finding specific magic items.'
		},
		gradualAbilityBoosts: {
			name: 'Gradual Ability Boosts',
			description: 'Gain ability boosts more frequently (every 4 levels) with only 2 boosts at a time instead of 4 every 5 levels.',
			impact: 'Provides more frequent character growth and smoother ability score progression.'
		},
		proficiencyWithoutLevel: {
			name: 'Proficiency Without Level',
			description: 'Proficiency bonuses do not include your level, making low-level challenges remain relevant.',
			impact: 'Dramatically changes game balance, making early encounters more dangerous at higher levels.'
		},
		stamina: {
			name: 'Stamina',
			description: 'Replaces traditional HP with Stamina (recoverable) and Hit Points (harder to recover).',
			impact: 'Changes healing dynamics and makes resource management more important in combat.'
		},
		voluntaryFlaws: {
			name: 'Voluntary Flaws',
			description: 'Allow taking ability flaws during character creation to gain additional ability boosts.',
			impact: 'Enables more optimized builds but requires careful planning to avoid crippling weaknesses.'
		},
		dualClass: {
			name: 'Dual-Class',
			description: 'Characters gain features from two classes simultaneously.',
			impact: 'Significantly increases character power and complexity. Recommended for experienced players only.'
		}
	};

	let currentSettings = $state($settings);

	settings.subscribe((value) => {
		currentSettings = value;
	});

	function toggleRule(rule: keyof VariantRules) {
		settings.toggleVariantRule(rule);
	}

	function resetToDefaults() {
		if (confirm('Reset all variant rules to defaults? This cannot be undone.')) {
			// Reset only variant rules, keep other settings
			settings.update((s) => ({
				...s,
				variantRules: {
					freeArchetype: false,
					freeArchetypeNoRestriction: false,
					automaticBonusProgression: false,
					gradualAbilityBoosts: false,
					proficiencyWithoutLevel: false,
					stamina: false,
					voluntaryFlaws: true, // This is default ON
					dualClass: false
				}
			}));
		}
	}

	const anyRulesActive = $derived.by(() => {
		return Object.values(currentSettings.variantRules).some((value) => value === true);
	});
</script>

<div class="variant-rules-settings">
	<div class="settings-header">
		<h2 class="settings-title">Variant Rules</h2>
		<p class="settings-description">
			Variant rules modify core game mechanics to provide different play experiences. These settings
			affect character creation and progression.
		</p>
	</div>

	{#if anyRulesActive}
		<div class="active-rules-notice">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
					fill="currentColor"
				/>
			</svg>
			<span>Variant rules are active. Changes may affect your character build.</span>
		</div>
	{/if}

	<div class="rules-grid">
		{#each Object.entries(variantRuleInfo) as [ruleKey, info]}
			{@const rule = ruleKey as keyof VariantRules}
			{@const isActive = currentSettings.variantRules[rule]}

			<div class="rule-card" class:active={isActive}>
				<div class="rule-header">
					<label class="rule-toggle">
						<input
							type="checkbox"
							checked={isActive}
							onchange={() => toggleRule(rule)}
							class="toggle-input"
						/>
						<span class="toggle-slider"></span>
					</label>
					<h3 class="rule-name">{info.name}</h3>
				</div>

				<p class="rule-description">{info.description}</p>

				<div class="rule-impact">
					<strong>Impact:</strong> {info.impact}
				</div>

				<!-- Free Archetype sub-options -->
				{#if rule === 'freeArchetype' && isActive}
					<div class="sub-option">
						<label class="sub-option-label">
							<input
								type="checkbox"
								checked={currentSettings.variantRules.freeArchetypeNoRestriction}
								onchange={() => settings.update(s => ({
									...s,
									variantRules: {
										...s.variantRules,
										freeArchetypeNoRestriction: !s.variantRules.freeArchetypeNoRestriction
									}
								}))}
								class="sub-option-checkbox"
							/>
							<span class="sub-option-text">
								<strong>GM Override:</strong> Allow multiple dedications without the 2-feat restriction
							</span>
						</label>
						<p class="sub-option-description">
							By default, you must take 2 archetype feats before selecting a second dedication. This override removes that restriction.
						</p>
					</div>
				{/if}

				{#if isActive}
					<div class="active-indicator">
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M13.3333 4L6 11.3333L2.66667 8"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						<span>Active</span>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<div class="settings-actions">
		<Button variant="secondary" onclick={resetToDefaults}>
			Reset to Defaults
		</Button>
	</div>

	<div class="settings-note">
		<strong>Note:</strong> Changing variant rules will affect character creation and may invalidate existing
		character builds. It's recommended to set these before creating a character.
	</div>
</div>

<style>
	.variant-rules-settings {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.settings-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.settings-title {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary, #1a1a1a);
	}

	.settings-description {
		margin: 0;
		color: var(--text-secondary, #666666);
		line-height: 1.6;
	}

	.active-rules-notice {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background-color: rgba(92, 124, 250, 0.1);
		border-left: 3px solid var(--link-color, #5c7cfa);
		border-radius: 4px;
		color: var(--link-color, #5c7cfa);
		font-weight: 500;
	}

	.active-rules-notice svg {
		flex-shrink: 0;
	}

	.rules-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.rule-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		background-color: var(--surface-2, #f5f5f5);
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 10px;
		transition: all var(--transition-fast);
	}

	.rule-card.active {
		background-color: rgba(92, 124, 250, 0.05);
		border-color: var(--link-color, #5c7cfa);
	}

	.rule-card:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.rule-header {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.rule-toggle {
		position: relative;
		display: inline-block;
		width: 48px;
		height: 28px;
		flex-shrink: 0;
		cursor: pointer;
	}

	.toggle-input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #ccc;
		transition: 0.3s;
		border-radius: 28px;
	}

	.toggle-slider:before {
		position: absolute;
		content: "";
		height: 20px;
		width: 20px;
		left: 4px;
		bottom: 4px;
		background-color: white;
		transition: 0.3s;
		border-radius: 50%;
	}

	.toggle-input:checked + .toggle-slider {
		background-color: var(--link-color, #5c7cfa);
	}

	.toggle-input:checked + .toggle-slider:before {
		transform: translateX(20px);
	}

	.toggle-input:focus-visible + .toggle-slider {
		outline: 2px solid var(--focus-color, #5c7cfa);
		outline-offset: 2px;
	}

	.rule-name {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.rule-description {
		margin: 0;
		color: var(--text-primary, #1a1a1a);
		line-height: 1.6;
		font-size: 0.9375rem;
	}

	.rule-impact {
		padding: 0.75rem;
		background-color: var(--surface-1, #ffffff);
		border-radius: 6px;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		line-height: 1.5;
	}

	.rule-impact strong {
		color: var(--text-primary, #1a1a1a);
	}

	.sub-option {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: var(--surface-1, #ffffff);
		border-radius: 6px;
		border-left: 3px solid var(--link-color, #5c7cfa);
	}

	.sub-option-label {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		cursor: pointer;
	}

	.sub-option-checkbox {
		margin-top: 0.25rem;
		width: 18px;
		height: 18px;
		cursor: pointer;
		flex-shrink: 0;
	}

	.sub-option-text {
		font-size: 0.9375rem;
		color: var(--text-primary, #1a1a1a);
		line-height: 1.5;
	}

	.sub-option-text strong {
		color: var(--link-color, #5c7cfa);
	}

	.sub-option-description {
		margin: 0;
		margin-left: 2rem;
		font-size: 0.875rem;
		color: var(--text-secondary, #666666);
		line-height: 1.5;
	}

	.active-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background-color: rgba(55, 178, 77, 0.1);
		border-radius: 6px;
		color: #37b24d;
		font-size: 0.875rem;
		font-weight: 600;
		align-self: flex-start;
	}

	.settings-actions {
		display: flex;
		justify-content: flex-end;
		padding-top: 1rem;
		border-top: 2px solid var(--border-color, #e0e0e0);
	}

	.settings-note {
		padding: 1rem;
		background-color: rgba(250, 176, 5, 0.1);
		border-left: 3px solid #fab005;
		border-radius: 4px;
		font-size: 0.875rem;
		color: var(--text-primary, #1a1a1a);
		line-height: 1.6;
	}

	.settings-note strong {
		color: #c77700;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.rules-grid {
			grid-template-columns: 1fr;
		}

		.settings-title {
			font-size: 1.5rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.rule-card,
		.toggle-slider,
		.toggle-slider:before {
			transition: none;
		}
	}
</style>
