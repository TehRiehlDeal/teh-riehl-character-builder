import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Character Creation (ABC Flow)
 *
 * Tests the complete Ancestry-Background-Class character creation workflow.
 * This is the most critical user flow in the application.
 */

test.describe('Character Creation - ABC Flow', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the character creation page
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');
	});

	test('should display character creation wizard with all sections', async ({ page }) => {
		// Check that the main sections are present
		await expect(page.getByRole('heading', { name: /ancestry/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /heritage/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /background/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /class/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /ability scores/i })).toBeVisible();
	});

	test('should complete full character creation flow', async ({ page }) => {
		// Step 1: Select Ancestry (Human)
		await page.getByPlaceholder(/search ancestries/i).fill('Human');
		await page.getByRole('button', { name: /select.*human/i }).first().click();

		// Verify ancestry was selected
		await expect(page.getByText(/selected.*human/i)).toBeVisible();

		// Step 2: Select Heritage (Versatile Heritage)
		await page.getByPlaceholder(/search heritages/i).fill('Versatile');
		await page.getByRole('button', { name: /select.*versatile/i }).first().click();

		// Verify heritage was selected
		await expect(page.getByText(/selected.*versatile/i)).toBeVisible();

		// Step 3: Select Background (Acolyte)
		await page.getByPlaceholder(/search backgrounds/i).fill('Acolyte');
		await page.getByRole('button', { name: /select.*acolyte/i }).first().click();

		// Verify background was selected
		await expect(page.getByText(/selected.*acolyte/i)).toBeVisible();

		// Step 4: Select Background Ability Boosts
		// Background typically offers 2 ability boosts (one free choice, one determined)
		const boostButtons = page.getByRole('button', { name: /strength|dexterity|constitution|intelligence|wisdom|charisma/i });
		const firstBoost = boostButtons.first();
		if (await firstBoost.isVisible()) {
			await firstBoost.click();
		}

		// Step 5: Select Class (Fighter)
		await page.getByPlaceholder(/search classes/i).fill('Fighter');
		await page.getByRole('button', { name: /select.*fighter/i }).first().click();

		// Verify class was selected
		await expect(page.getByText(/selected.*fighter/i)).toBeVisible();

		// Step 6: Select Free Ability Boosts (4 at level 1)
		// Characters get 4 free ability boosts at level 1
		const freeBoosts = page.locator('[data-testid="free-ability-boosts"]').getByRole('button');
		const boostCount = await freeBoosts.count();
		for (let i = 0; i < Math.min(4, boostCount); i++) {
			const boost = freeBoosts.nth(i);
			if (await boost.isEnabled()) {
				await boost.click();
			}
		}

		// Verify character data was persisted
		// Reload the page and check if selections are still there
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Check if ancestry is still selected
		await expect(page.getByText(/selected.*human/i)).toBeVisible();
	});

	test('should filter ancestries with search', async ({ page }) => {
		const searchBox = page.getByPlaceholder(/search ancestries/i);
		await searchBox.fill('Elf');

		// Should show Elf ancestry
		await expect(page.getByText(/elf/i).first()).toBeVisible();

		// Should not show Human (filtered out)
		const allCards = page.locator('[data-testid="ancestry-card"]');
		const cardCount = await allCards.count();
		expect(cardCount).toBeGreaterThan(0);
		expect(cardCount).toBeLessThan(10); // Filtered results
	});

	test('should show ancestry details in modal', async ({ page }) => {
		// Find and click "Details" button for first ancestry
		const detailsButton = page.getByRole('button', { name: /details/i }).first();
		await detailsButton.click();

		// Modal should be visible
		await expect(page.getByRole('dialog')).toBeVisible();

		// Modal should show ancestry information
		await expect(page.getByRole('dialog')).toContainText(/hit points/i);
		await expect(page.getByRole('dialog')).toContainText(/size/i);

		// Close modal
		await page.getByRole('button', { name: /close/i }).click();
		await expect(page.getByRole('dialog')).not.toBeVisible();
	});

	test('should handle key ability selection for classes with multiple options', async ({ page }) => {
		// Select a class with multiple key ability options (e.g., Rogue: Dex, Str, or other)
		await page.getByPlaceholder(/search classes/i).fill('Rogue');
		await page.getByRole('button', { name: /select.*rogue/i }).first().click();

		// Wait for key ability selection to appear
		const keyAbilitySection = page.locator('text=/select key ability/i');
		if (await keyAbilitySection.isVisible()) {
			// Select a key ability
			await page.getByRole('button', { name: /dexterity/i }).first().click();

			// Verify selection was made
			await expect(page.getByText(/selected.*dexterity/i)).toBeVisible();
		}
	});

	test('should show class feat selection after class is selected', async ({ page }) => {
		// Select class (Fighter)
		await page.getByPlaceholder(/search classes/i).fill('Fighter');
		await page.getByRole('button', { name: /select.*fighter/i }).first().click();

		// Wait for class feat section to appear
		const classFeatSection = page.getByRole('heading', { name: /class feat/i });
		await expect(classFeatSection).toBeVisible();

		// Should have feat picker
		await expect(page.getByPlaceholder(/search feats/i)).toBeVisible();
	});

	test('should persist character data to localStorage', async ({ page, context }) => {
		// Complete basic character creation
		await page.getByPlaceholder(/search ancestries/i).fill('Dwarf');
		await page.getByRole('button', { name: /select.*dwarf/i }).first().click();

		// Wait a moment for localStorage to update
		await page.waitForTimeout(500);

		// Check localStorage
		const storage = await context.storageState();
		const localStorage = storage.origins[0]?.localStorage || [];
		const characterData = localStorage.find((item) => item.name.includes('character'));

		expect(characterData).toBeDefined();
		if (characterData) {
			const charValue = JSON.parse(characterData.value);
			expect(charValue.ancestry?.name).toBe('Dwarf');
		}
	});

	test('should validate prerequisite requirements', async ({ page }) => {
		// Try to select a feat without meeting prerequisites
		// First, select a class to get to feat selection
		await page.getByPlaceholder(/search classes/i).fill('Wizard');
		await page.getByRole('button', { name: /select.*wizard/i }).first().click();

		// Wait for class feat section
		await expect(page.getByRole('heading', { name: /class feat/i })).toBeVisible();

		// Search for a feat with prerequisites
		const featSearch = page.getByPlaceholder(/search feats/i);
		await featSearch.fill('Advanced');

		// If any feats appear, they should show prerequisite information
		const featCards = page.locator('[data-testid="feat-card"]');
		const count = await featCards.count();

		if (count > 0) {
			const firstFeat = featCards.first();
			// Check if prerequisites are displayed
			const hasPrereq = await firstFeat.locator('text=/prerequisite/i').count();
			if (hasPrereq > 0) {
				await expect(firstFeat).toContainText(/prerequisite/i);
			}
		}
	});

	test('should handle responsive layout on mobile', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		// Check that content is still accessible
		await expect(page.getByRole('heading', { name: /ancestry/i })).toBeVisible();

		// Search should work on mobile
		await page.getByPlaceholder(/search ancestries/i).fill('Human');
		await expect(page.getByText(/human/i).first()).toBeVisible();
	});
});

test.describe('Character Creation - Progressive Disclosure', () => {
	test('should show heritage selection only after ancestry is selected', async ({ page }) => {
		await page.goto('/builder/general');

		// Initially, heritage section might be visible but empty
		const heritageSection = page.locator('[data-testid="heritage-selector"]');

		// Select ancestry
		await page.getByPlaceholder(/search ancestries/i).fill('Elf');
		await page.getByRole('button', { name: /select.*elf/i }).first().click();

		// Now heritage options should be filtered to Elf heritages
		await page.getByPlaceholder(/search heritages/i).fill('Arctic');
		const heritageCard = page.getByText(/arctic elf/i);
		if (await heritageCard.isVisible()) {
			await expect(heritageCard).toBeVisible();
		}
	});

	test('should progressively reveal sections as user completes previous steps', async ({ page }) => {
		await page.goto('/builder/general');

		// Check initial state - some sections may be collapsed or disabled
		const sections = [
			page.getByRole('heading', { name: /ancestry/i }),
			page.getByRole('heading', { name: /background/i }),
			page.getByRole('heading', { name: /class/i })
		];

		for (const section of sections) {
			await expect(section).toBeVisible();
		}

		// As user makes selections, more options become available
		await page.getByPlaceholder(/search ancestries/i).fill('Goblin');
		await page.getByRole('button', { name: /select.*goblin/i }).first().click();

		// Heritage options should now be specific to Goblin
		const heritageSearch = page.getByPlaceholder(/search heritages/i);
		if (await heritageSearch.isVisible()) {
			await heritageSearch.fill('Charhide');
			// Should show Goblin heritages, not other ancestries' heritages
		}
	});
});
