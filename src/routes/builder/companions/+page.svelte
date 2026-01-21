<script lang="ts">
	import { character } from '$lib/stores/character';
	import FamiliarSheet from '$lib/components/companions/FamiliarSheet.svelte';
	import AnimalCompanionSheet from '$lib/components/companions/AnimalCompanionSheet.svelte';
	import type { FamiliarAbility } from '$lib/components/companions/FamiliarSheet.svelte';
	import type {
		CompanionType
	} from '$lib/components/companions/AnimalCompanionSheet.svelte';

	// Get character level from store
	const characterLevel = $derived($character?.level ?? 1);

	// Get companion state from store
	const hasFamiliar = $derived($character?.companions?.familiar?.hasFamiliar ?? false);
	const familiarName = $derived($character?.companions?.familiar?.name ?? 'Familiar');
	const familiarType = $derived($character?.companions?.familiar?.type ?? '');
	const familiarAbilityIds = $derived($character?.companions?.familiar?.abilities ?? []);

	const hasAnimalCompanion = $derived(
		$character?.companions?.animalCompanion?.hasCompanion ?? false
	);
	const companionName = $derived($character?.companions?.animalCompanion?.name ?? 'Companion');
	const companionTypeId = $derived($character?.companions?.animalCompanion?.typeId ?? 'bear');
	const companionSpecialization = $derived(
		$character?.companions?.animalCompanion?.specialization ?? null
	);

	// Local editable state
	let editableFamiliarName = $state(familiarName);
	let editableFamiliarType = $state(familiarType);
	let editableCompanionName = $state(companionName);
	let editableCompanionTypeId = $state(companionTypeId);
	let editableCompanionSpecialization = $state<'nimble' | 'savage' | null>(
		companionSpecialization
	);

	// Sync local state with character store
	$effect(() => {
		editableFamiliarName = familiarName;
		editableFamiliarType = familiarType;
	});

	$effect(() => {
		editableCompanionName = companionName;
		editableCompanionTypeId = companionTypeId;
		editableCompanionSpecialization = companionSpecialization;
	});

	// Available companion types
	const companionTypes: CompanionType[] = [
		{
			id: 'bear',
			name: 'Bear',
			size: 'Small',
			speed: 35,
			attack: 'jaws',
			attackDamage: '1d8',
			attackType: 'piercing',
			support:
				'Your bear mauls your enemies when you create an opening. Until the start of your next turn, each time you hit a creature, your bear can make a Strike against that creature as a reaction.',
			advanced:
				'The bear makes a Strike against an adjacent creature. If it hits, the creature is knocked prone.'
		},
		{
			id: 'bird',
			name: 'Bird',
			size: 'Small',
			speed: 10,
			attack: 'jaws',
			attackDamage: '1d6',
			attackType: 'piercing',
			specialAbility: 'Fly Speed 60 feet',
			support:
				"Your bird pecks at your foes' eyes when you create an opening. Until the start of your next turn, your Strikes that deal damage to a creature grant your bird a reaction. Your bird can use this reaction to attempt to Strike that creature, with a –5 penalty.",
			advanced: 'The bird Flies up to its fly Speed and makes a Strike at the end of that movement.'
		},
		{
			id: 'cat',
			name: 'Cat',
			size: 'Small',
			speed: 40,
			attack: 'jaws',
			attackDamage: '1d6',
			attackType: 'piercing',
			support:
				'Your cat throws your enemies off-balance when you create an opening. Until the start of your next turn, your Strikes that deal damage to a creature grant your cat a reaction. Your cat can use the reaction to Stride and must end that Stride adjacent to the triggering creature.',
			advanced:
				'The cat pounces on an adjacent foe, making a Strike with a +2 circumstance bonus. If the cat hits, the target is flat-footed until the end of your next turn.'
		},
		{
			id: 'horse',
			name: 'Horse',
			size: 'Medium',
			speed: 40,
			attack: 'hoof',
			attackDamage: '1d8',
			attackType: 'bludgeoning',
			specialAbility: 'Mount: You can ride your horse (DC 5 to Command)',
			support:
				'Your horse adds momentum to your charge. Until the start of your next turn, if you moved at least 10 feet, your Strikes deal +2 damage.',
			advanced: 'The horse Strides up to its Speed and makes a Strike at any point during that movement.'
		},
		{
			id: 'snake',
			name: 'Snake',
			size: 'Small',
			speed: 30,
			attack: 'jaws',
			attackDamage: '1d8',
			attackType: 'piercing',
			specialAbility: 'Climb Speed 30 feet, Swim Speed 30 feet',
			support:
				'Your snake holds your enemies with its coils, interfering with reactions. Until the start of your next turn, any creature you hit becomes flat-footed.',
			advanced:
				'The snake makes a Strike. If it hits, the target takes persistent poison damage equal to half your level (minimum 1).'
		}
	];

	// Get selected companion type
	const selectedCompanionType = $derived(
		companionTypes.find((t) => t.id === editableCompanionTypeId) || companionTypes[0]
	);

	// Convert familiar ability IDs to full ability objects for FamiliarSheet
	const selectedFamiliarAbilities = $derived<FamiliarAbility[]>([]);

	// Handlers
	function handleToggleFamiliar() {
		character.setFamiliar(!hasFamiliar);
	}

	function handleToggleAnimalCompanion() {
		character.setAnimalCompanion(!hasAnimalCompanion);
	}

	function handleFamiliarAbilitiesChange(abilities: FamiliarAbility[]) {
		// Extract just the IDs
		const abilityIds = abilities.map((a) => a.id);
		character.updateFamiliar(editableFamiliarName, editableFamiliarType, abilityIds);
	}

	function handleFamiliarNameChange() {
		character.updateFamiliar(editableFamiliarName, editableFamiliarType, familiarAbilityIds);
	}

	function handleFamiliarTypeChange() {
		character.updateFamiliar(editableFamiliarName, editableFamiliarType, familiarAbilityIds);
	}

	function handleCompanionNameChange() {
		character.updateAnimalCompanion(
			editableCompanionName,
			editableCompanionTypeId,
			editableCompanionSpecialization
		);
	}

	function handleCompanionTypeChange() {
		character.updateAnimalCompanion(
			editableCompanionName,
			editableCompanionTypeId,
			editableCompanionSpecialization
		);
	}

	function handleSpecializationChange() {
		character.updateAnimalCompanion(
			editableCompanionName,
			editableCompanionTypeId,
			editableCompanionSpecialization
		);
	}
</script>

<svelte:head>
	<title>Companions - Character Builder</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<h1 class="page-title">Companions</h1>
		<p class="page-description">
			Manage your familiar, animal companion, and other allies.
		</p>
	</header>

	<div class="content-sections">
		<!-- Familiar Section -->
		<section class="content-section" aria-labelledby="familiar-section">
			<div class="section-header">
				<h2 id="familiar-section" class="section-title">Familiar</h2>
				<button class="toggle-btn" onclick={handleToggleFamiliar}>
					{hasFamiliar ? 'Remove Familiar' : 'Add Familiar'}
				</button>
			</div>

			<div class="section-body">
				{#if hasFamiliar}
					<div class="companion-controls">
						<div class="control-group">
							<label for="familiar-name">Name:</label>
							<input
								id="familiar-name"
								type="text"
								bind:value={editableFamiliarName}
								onblur={handleFamiliarNameChange}
								class="name-input"
								placeholder="Enter familiar name"
							/>
						</div>

						<div class="control-group">
							<label for="familiar-type">Type:</label>
							<input
								id="familiar-type"
								type="text"
								bind:value={editableFamiliarType}
								onblur={handleFamiliarTypeChange}
								class="type-input"
								placeholder="e.g., Raven, Cat, Owl"
							/>
						</div>
					</div>

					<FamiliarSheet
						masterLevel={characterLevel}
						name={editableFamiliarName}
						familiarType={editableFamiliarType}
						selectedAbilities={selectedFamiliarAbilities}
						onAbilitiesChange={handleFamiliarAbilitiesChange}
					/>
				{:else}
					<div class="empty-state">
						<p>You don't have a familiar.</p>
						<p class="empty-hint">
							Familiars are magical creatures that aid spellcasters. They require the Familiar
							feat or a class feature that grants one.
						</p>
					</div>
				{/if}
			</div>
		</section>

		<!-- Animal Companion Section -->
		<section class="content-section" aria-labelledby="companion-section">
			<div class="section-header">
				<h2 id="companion-section" class="section-title">Animal Companion</h2>
				<button class="toggle-btn" onclick={handleToggleAnimalCompanion}>
					{hasAnimalCompanion ? 'Remove Companion' : 'Add Companion'}
				</button>
			</div>

			<div class="section-body">
				{#if hasAnimalCompanion}
					<div class="companion-controls">
						<div class="control-group">
							<label for="companion-name">Name:</label>
							<input
								id="companion-name"
								type="text"
								bind:value={editableCompanionName}
								onblur={handleCompanionNameChange}
								class="name-input"
								placeholder="Enter companion name"
							/>
						</div>

						<div class="control-group">
							<label for="companion-type">Type:</label>
							<select
								id="companion-type"
								bind:value={editableCompanionTypeId}
								onchange={handleCompanionTypeChange}
								class="type-select"
							>
								{#each companionTypes as type}
									<option value={type.id}>{type.name}</option>
								{/each}
							</select>
						</div>

						{#if characterLevel >= 7}
							<div class="control-group">
								<label for="specialization">Specialization:</label>
								<select
									id="specialization"
									bind:value={editableCompanionSpecialization}
									onchange={handleSpecializationChange}
									class="spec-select"
								>
									<option value={null}>Choose...</option>
									<option value="nimble">Nimble (+Speed, +Reflex)</option>
									<option value="savage">Savage (+Attack, +Fortitude)</option>
								</select>
							</div>
						{/if}
					</div>

					<AnimalCompanionSheet
						masterLevel={characterLevel}
						name={editableCompanionName}
						companionType={selectedCompanionType}
						specialization={editableCompanionSpecialization}
					/>
				{:else}
					<div class="empty-state">
						<p>You don't have an animal companion.</p>
						<p class="empty-hint">
							Animal companions are loyal allies that fight alongside you. They require the Animal
							Companion feat or a class feature that grants one.
						</p>
					</div>
				{/if}
			</div>
		</section>
	</div>
</div>

<style>
	.page-content {
		max-width: 1000px;
		margin: 0 auto;
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

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--border-color, #e0e0e0);
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
		color: var(--text-primary, #1a1a1a);
	}

	.toggle-btn {
		padding: 0.5rem 1rem;
		background-color: var(--link-color, #5c7cfa);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.toggle-btn:hover {
		background-color: #4c6cfa;
	}

	.section-body {
		color: var(--text-secondary, #666666);
	}

	.companion-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background-color: var(--surface-1, #ffffff);
		border-radius: 8px;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
		min-width: 200px;
	}

	.control-group label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary, #1a1a1a);
	}

	.name-input,
	.type-input,
	.type-select,
	.spec-select {
		padding: 0.625rem;
		border: 2px solid var(--border-color, #e0e0e0);
		border-radius: 6px;
		font-size: 0.9375rem;
		font-family: inherit;
	}

	.name-input:focus,
	.type-input:focus,
	.type-select:focus,
	.spec-select:focus {
		outline: none;
		border-color: var(--focus-color, #5c7cfa);
	}

	.empty-state {
		padding: 3rem;
		text-align: center;
		color: var(--text-secondary, #666666);
	}

	.empty-state p {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
	}

	.empty-hint {
		font-size: 0.875rem;
		font-style: italic;
		color: var(--text-secondary, #999999);
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

		.section-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.toggle-btn {
			width: 100%;
		}

		.companion-controls {
			flex-direction: column;
		}

		.control-group {
			min-width: 0;
		}
	}
</style>
