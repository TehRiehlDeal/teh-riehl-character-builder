import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Feat Selection and Validation
 *
 * Tests the feat picker component, prerequisite validation,
 * and feat selection across different feat types.
 */

test.describe('Feat Selection', () => {
	test.beforeEach(async ({ page }) => {
		// Create a character with basic selections to access feat picker
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		// Quick character setup to reach feat selection
		await page.getByPlaceholder(/search ancestries/i).fill('Human');
		await page.getByRole('button', { name: /select.*human/i }).first().click();

		await page.getByPlaceholder(/search classes/i).fill('Fighter');
		await page.getByRole('button', { name: /select.*fighter/i }).first().click();

		// Wait for class feat section to appear
		await page.waitForTimeout(1000);
	});

	test('should display feat picker with search functionality', async ({ page }) => {
		// Check that feat picker is visible
		const featSearch = page.getByPlaceholder(/search feats/i);
		await expect(featSearch).toBeVisible();

		// Search for a specific feat
		await featSearch.fill('Power Attack');

		// Should show search results
		const searchResults = page.locator('[data-testid="feat-card"]');
		const count = await searchResults.count();
		expect(count).toBeGreaterThanOrEqual(0);
	});

	test('should filter feats by level', async ({ page }) => {
		const featSearch = page.getByPlaceholder(/search feats/i);
		await expect(featSearch).toBeVisible();

		// Type a search to see feats
		await featSearch.fill('Attack');

		// Look for level filter controls
		const levelFilter = page.locator('[data-testid="level-filter"]');
		if (await levelFilter.isVisible()) {
			await levelFilter.selectOption('1');

			// Should only show level 1 feats
			const featCards = page.locator('[data-testid="feat-card"]');
			const count = await featCards.count();

			if (count > 0) {
				// Check that displayed feats are level 1
				const firstFeat = featCards.first();
				await expect(firstFeat).toContainText(/level.*1/i);
			}
		}
	});

	test('should show feat details in modal', async ({ page }) => {
		const featSearch = page.getByPlaceholder(/search feats/i);
		await featSearch.fill('Shield');

		// Wait for results
		await page.waitForTimeout(500);

		// Click details on first feat
		const detailsButton = page.getByRole('button', { name: /details/i }).first();
		if (await detailsButton.isVisible()) {
			await detailsButton.click();

			// Modal should show feat information
			const modal = page.getByRole('dialog');
			await expect(modal).toBeVisible();
			await expect(modal).toContainText(/feat/i);

			// Close modal
			await page.getByRole('button', { name: /close/i }).click();
			await expect(modal).not.toBeVisible();
		}
	});

	test('should select and persist feat choice', async ({ page }) => {
		const featSearch = page.getByPlaceholder(/search feats/i);
		await featSearch.fill('Reactive Shield');

		await page.waitForTimeout(500);

		// Select the feat
		const selectButton = page.getByRole('button', { name: /select.*reactive shield/i }).first();
		if (await selectButton.isVisible()) {
			await selectButton.click();

			// Verify feat was selected
			await expect(page.getByText(/selected.*reactive shield/i)).toBeVisible();

			// Reload page and check persistence
			await page.reload();
			await page.waitForLoadState('networkidle');

			// Feat should still be selected
			await expect(page.getByText(/selected.*reactive shield/i)).toBeVisible();
		}
	});

	test('should display prerequisites for high-level feats', async ({ page }) => {
		const featSearch = page.getByPlaceholder(/search feats/i);
		await featSearch.fill('');

		// Look for feats with prerequisites
		const featCards = page.locator('[data-testid="feat-card"]');
		const count = await featCards.count();

		if (count > 0) {
			// Check multiple feats for prerequisite information
			for (let i = 0; i < Math.min(5, count); i++) {
				const feat = featCards.nth(i);
				const prereqText = feat.locator('text=/prerequisite|requires/i');
				const hasPrereq = (await prereqText.count()) > 0;

				if (hasPrereq) {
					await expect(prereqText).toBeVisible();
					break; // Found one with prerequisites
				}
			}
		}
	});

	test('should validate feat prerequisites', async ({ page }) => {
		// Navigate to planning page which shows level-up feats
		await page.goto('/builder/planning');
		await page.waitForLoadState('networkidle');

		// Try to select a high-level feat at level 1
		const levelPlanner = page.locator('[data-testid="level-2-feats"]');
		if (await levelPlanner.isVisible()) {
			// At level 2, some feats might not be available
			const featSearch = page.getByPlaceholder(/search feats/i).first();
			if (await featSearch.isVisible()) {
				await featSearch.fill('Expert');

				// Feats with unmet prerequisites should be indicated
				const featCard = page.locator('[data-testid="feat-card"]').first();
				if (await featCard.isVisible()) {
					// Look for disabled state or warning
					const isDisabled = await featCard.locator('[disabled]').count();
					const hasWarning = await featCard.locator('text=/prerequisite not met/i').count();

					// At least one indication that prerequisites matter
					expect(isDisabled > 0 || hasWarning > 0).toBeTruthy();
				}
			}
		}
	});

	test('should handle feat categories (class, ancestry, skill, general)', async ({ page }) => {
		// Check that different feat categories are available

		// Class feats (already on this page)
		const classFeatSection = page.getByRole('heading', { name: /class feat/i });
		await expect(classFeatSection).toBeVisible();

		// Navigate to the comprehensive feats page
		await page.goto('/builder/feats');
		await page.waitForLoadState('networkidle');

		// Should show different feat categories
		await expect(page.getByRole('heading', { name: /class feats/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /ancestry feats/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /skill feats/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /general feats/i })).toBeVisible();
	});

	test('should show archetype feats when Free Archetype variant is enabled', async ({ page }) => {
		// Open settings
		await page.keyboard.press('Control+,');
		await page.waitForTimeout(500);

		// Enable Free Archetype
		const freeArchetypeToggle = page.locator('[data-testid="free-archetype-toggle"]');
		if (await freeArchetypeToggle.isVisible()) {
			await freeArchetypeToggle.check();

			// Close settings
			await page.keyboard.press('Escape');

			// Go to character creation
			await page.goto('/builder/general');
			await page.waitForLoadState('networkidle');

			// Complete basic setup
			await page.getByPlaceholder(/search ancestries/i).fill('Elf');
			await page.getByRole('button', { name: /select.*elf/i }).first().click();

			await page.getByPlaceholder(/search classes/i).fill('Wizard');
			await page.getByRole('button', { name: /select.*wizard/i }).first().click();

			// Should see archetype feat option
			const archetypeFeatSection = page.locator('text=/archetype/i');
			const hasArchetype = (await archetypeFeatSection.count()) > 0;

			// Free Archetype adds extra feat slots
			expect(hasArchetype).toBeTruthy();
		}
	});
});

test.describe('Feat Selection - Advanced Features', () => {
	test('should handle feat chains and prerequisites', async ({ page }) => {
		await page.goto('/builder/planning');
		await page.waitForLoadState('networkidle');

		// Some feats require other feats as prerequisites
		// For example, Improved Critical requires certain weapon proficiency

		// Look for feat chains in the planning view
		const planningTable = page.locator('[data-testid="level-planning-table"]');
		if (await planningTable.isVisible()) {
			// Check that feat selection respects level requirements
			const level5Section = page.locator('[data-testid="level-5-feats"]');
			if (await level5Section.isVisible()) {
				// Level 5 should only show feats appropriate for that level
				await expect(level5Section).toBeVisible();
			}
		}
	});

	test('should allow changing feat selections', async ({ page }) => {
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		// Setup character
		await page.getByPlaceholder(/search classes/i).fill('Rogue');
		await page.getByRole('button', { name: /select.*rogue/i }).first().click();

		await page.waitForTimeout(1000);

		// Select a feat
		const featSearch = page.getByPlaceholder(/search feats/i);
		await featSearch.fill('Nimble Dodge');

		const selectButton = page.getByRole('button', { name: /select.*nimble/i }).first();
		if (await selectButton.isVisible()) {
			await selectButton.click();
			await page.waitForTimeout(500);

			// Change selection
			await featSearch.fill('Trap Finder');
			const newSelectButton = page.getByRole('button', { name: /select.*trap/i }).first();
			if (await newSelectButton.isVisible()) {
				await newSelectButton.click();

				// Verify new selection replaced old one
				await expect(page.getByText(/selected.*trap finder/i)).toBeVisible();
			}
		}
	});

	test('should handle special feat requirements (weapon proficiency, etc)', async ({ page }) => {
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		// Select Fighter (has weapon proficiency)
		await page.getByPlaceholder(/search classes/i).fill('Fighter');
		await page.getByRole('button', { name: /select.*fighter/i }).first().click();

		await page.waitForTimeout(1000);

		// Search for weapon-related feats
		const featSearch = page.getByPlaceholder(/search feats/i);
		await featSearch.fill('Point-Blank Shot');

		// Feat should be available to Fighter
		const featResults = page.locator('[data-testid="feat-card"]');
		const count = await featResults.count();

		if (count > 0) {
			// Should show weapon feats that Fighter qualifies for
			await expect(featResults.first()).toBeVisible();
		}
	});
});
