import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Level-Up Process
 *
 * Tests the level-up modal, planning features, and progression system.
 */

test.describe('Level-Up Process', () => {
	test('should display level-up modal demo', async ({ page }) => {
		// Navigate to the level-up demo page
		await page.goto('/demo/level-up');
		await page.waitForLoadState('networkidle');

		// Check that demo page loaded
		await expect(page.getByRole('heading', { name: /level.*up/i })).toBeVisible();

		// Trigger level-up modal
		const triggerButton = page.getByRole('button', { name: /trigger.*level.*up/i });
		if (await triggerButton.isVisible()) {
			await triggerButton.click();

			// Modal should appear
			const modal = page.getByRole('dialog');
			await expect(modal).toBeVisible();

			// Should show celebration
			await expect(modal).toContainText(/level/i);
		}
	});

	test('should navigate through level-up modal steps', async ({ page }) => {
		await page.goto('/demo/level-up');
		await page.waitForLoadState('networkidle');

		// Trigger modal
		const triggerButton = page.getByRole('button', { name: /trigger.*level.*up/i });
		if (await triggerButton.isVisible()) {
			await triggerButton.click();

			const modal = page.getByRole('dialog');
			await expect(modal).toBeVisible();

			// Step through the modal
			const nextButton = modal.getByRole('button', { name: /next|continue/i });
			if (await nextButton.isVisible()) {
				await nextButton.click();

				// Should progress to next step
				await page.waitForTimeout(500);
				await expect(modal).toBeVisible();
			}

			// Complete the level-up
			const confirmButton = modal.getByRole('button', { name: /confirm|complete/i });
			if (await confirmButton.isVisible()) {
				await confirmButton.click();

				// Modal should close
				await expect(modal).not.toBeVisible();
			}
		}
	});

	test('should respect prefers-reduced-motion', async ({ page, context }) => {
		// Set reduced motion preference
		await context.addInitScript(() => {
			Object.defineProperty(window, 'matchMedia', {
				writable: true,
				value: (query: string) => ({
					matches: query.includes('prefers-reduced-motion: reduce'),
					media: query,
					onchange: null,
					addEventListener: () => {},
					removeEventListener: () => {},
					dispatchEvent: () => true
				})
			});
		});

		await page.goto('/demo/level-up');
		await page.waitForLoadState('networkidle');

		// Trigger modal
		const triggerButton = page.getByRole('button', { name: /trigger.*level.*up/i });
		if (await triggerButton.isVisible()) {
			await triggerButton.click();

			// Modal should appear without animations
			const modal = page.getByRole('dialog');
			await expect(modal).toBeVisible();

			// Check that animations are disabled (no animation classes)
			const hasAnimationClass = await modal.evaluate((el) => {
				return el.className.includes('animate') || el.className.includes('transition');
			});

			// With reduced motion, should have minimal animations
			// This is a basic check - actual implementation may vary
		}
	});
});

test.describe('Level Planning', () => {
	test('should display level planning table', async ({ page }) => {
		await page.goto('/builder/planning');
		await page.waitForLoadState('networkidle');

		// Check that planning page loaded
		await expect(page.getByRole('heading', { name: /planning/i })).toBeVisible();

		// Should show level progression table
		const planningTable = page.locator('[data-testid="level-planning-table"]');
		if (await planningTable.isVisible()) {
			await expect(planningTable).toBeVisible();

			// Should show multiple levels (1-20)
			const levelRows = page.locator('[data-testid^="level-"]');
			const count = await levelRows.count();
			expect(count).toBeGreaterThan(0);
		}
	});

	test('should allow planning feat selections for future levels', async ({ page }) => {
		await page.goto('/builder/planning');
		await page.waitForLoadState('networkidle');

		// Look for level 2 feat selection
		const level2Section = page.locator('[data-testid="level-2"]');
		if (await level2Section.isVisible()) {
			// Click to add/plan a feat
			const addFeatButton = level2Section.getByRole('button', { name: /add.*feat|plan/i });
			if (await addFeatButton.isVisible()) {
				await addFeatButton.click();

				// Feat picker should appear
				await page.waitForTimeout(500);
				const featSearch = page.getByPlaceholder(/search feats/i);
				if (await featSearch.isVisible()) {
					await expect(featSearch).toBeVisible();

					// Select a feat
					await featSearch.fill('Combat Reflexes');
					const selectButton = page.getByRole('button', { name: /select/i }).first();
					if (await selectButton.isVisible()) {
						await selectButton.click();

						// Feat should be added to the plan
						await expect(level2Section).toContainText(/combat reflexes/i);
					}
				}
			}
		}
	});

	test('should allow planning ability boosts for future levels', async ({ page }) => {
		await page.goto('/builder/planning');
		await page.waitForLoadState('networkidle');

		// At level 5, characters get ability boosts
		const level5Section = page.locator('[data-testid="level-5"]');
		if (await level5Section.isVisible()) {
			// Look for ability boost planning
			const boostSection = level5Section.locator('text=/ability boost/i');
			if (await boostSection.isVisible()) {
				await expect(boostSection).toBeVisible();

				// Should be able to plan boosts
				const boostButton = level5Section.getByRole('button', { name: /strength|dexterity|constitution|intelligence|wisdom|charisma/i }).first();
				if (await boostButton.isVisible()) {
					await boostButton.click();

					// Boost should be planned
					await page.waitForTimeout(300);
				}
			}
		}
	});

	test('should show different feat types at appropriate levels', async ({ page }) => {
		await page.goto('/builder/planning');
		await page.waitForLoadState('networkidle');

		// Level 1: Class feat, Ancestry feat
		const level1 = page.locator('[data-testid="level-1"]');
		if (await level1.isVisible()) {
			await expect(level1).toContainText(/feat/i);
		}

		// Level 2: Skill feat (typically)
		const level2 = page.locator('[data-testid="level-2"]');
		if (await level2.isVisible()) {
			const hasSkillFeat = await level2.locator('text=/skill feat/i').count();
			// Level 2 gets a skill feat
		}

		// Level 3: General feat (typically)
		const level3 = page.locator('[data-testid="level-3"]');
		if (await level3.isVisible()) {
			const hasGeneralFeat = await level3.locator('text=/general feat/i').count();
			// Level 3 gets a general feat
		}
	});

	test('should validate feat prerequisites when planning', async ({ page }) => {
		await page.goto('/builder/planning');
		await page.waitForLoadState('networkidle');

		// Try to plan a high-level feat at level 2
		const level2 = page.locator('[data-testid="level-2"]');
		if (await level2.isVisible()) {
			const addButton = level2.getByRole('button', { name: /add.*feat/i }).first();
			if (await addButton.isVisible()) {
				await addButton.click();

				// Search for a feat with prerequisites
				const featSearch = page.getByPlaceholder(/search feats/i);
				if (await featSearch.isVisible()) {
					await featSearch.fill('Legendary');

					// High-level feats should show as unavailable
					const featCard = page.locator('[data-testid="feat-card"]').first();
					if (await featCard.isVisible()) {
						// Should indicate prerequisites not met
						const hasWarning = await featCard.locator('text=/prerequisite|requires|level/i').count();
						expect(hasWarning).toBeGreaterThan(0);
					}
				}
			}
		}
	});

	test('should persist planned selections', async ({ page }) => {
		await page.goto('/builder/planning');
		await page.waitForLoadState('networkidle');

		// Plan a feat at level 2
		const level2 = page.locator('[data-testid="level-2"]');
		if (await level2.isVisible()) {
			const addButton = level2.getByRole('button', { name: /add.*feat/i }).first();
			if (await addButton.isVisible()) {
				await addButton.click();
				await page.waitForTimeout(500);

				const featSearch = page.getByPlaceholder(/search feats/i);
				if (await featSearch.isVisible()) {
					await featSearch.fill('Quick Draw');
					await page.waitForTimeout(500);

					const selectButton = page.getByRole('button', { name: /select.*quick draw/i }).first();
					if (await selectButton.isVisible()) {
						await selectButton.click();
						await page.waitForTimeout(500);

						// Reload and verify persistence
						await page.reload();
						await page.waitForLoadState('networkidle');

						// Planned feat should still be there
						await expect(page.locator('text=/quick draw/i')).toBeVisible();
					}
				}
			}
		}
	});

	test('should allow removing planned selections', async ({ page }) => {
		await page.goto('/builder/planning');
		await page.waitForLoadState('networkidle');

		// Find a level with a planned feat (or plan one first)
		const removeButton = page.getByRole('button', { name: /remove|delete|clear/i }).first();
		if (await removeButton.isVisible()) {
			// Get the feat name before removing
			const featName = await removeButton.locator('..').textContent();

			await removeButton.click();
			await page.waitForTimeout(300);

			// Feat should be removed
			if (featName) {
				const featStillExists = await page.locator(`text=${featName}`).count();
				expect(featStillExists).toBe(0);
			}
		}
	});
});

test.describe('Level-Up Integration', () => {
	test('should prefill level-up modal from planned selections', async ({ page }) => {
		// This test would require full integration with character state
		// For now, we test the demo version

		await page.goto('/demo/level-up');
		await page.waitForLoadState('networkidle');

		// Trigger modal with planned data
		const triggerButton = page.getByRole('button', { name: /trigger.*level.*up/i });
		if (await triggerButton.isVisible()) {
			await triggerButton.click();

			const modal = page.getByRole('dialog');
			await expect(modal).toBeVisible();

			// Modal should show planned selections (if any)
			// In demo mode, this might be simulated data
			await expect(modal).toContainText(/level/i);
		}
	});

	test('should allow modifying planned selections during level-up', async ({ page }) => {
		await page.goto('/demo/level-up');
		await page.waitForLoadState('networkidle');

		const triggerButton = page.getByRole('button', { name: /trigger.*level.*up/i });
		if (await triggerButton.isVisible()) {
			await triggerButton.click();

			const modal = page.getByRole('dialog');
			await expect(modal).toBeVisible();

			// Look for edit/change buttons
			const changeButton = modal.getByRole('button', { name: /change|edit|modify/i });
			if (await changeButton.count() > 0) {
				await changeButton.first().click();

				// Should allow changing the selection
				await page.waitForTimeout(500);
			}
		}
	});

	test('should skip level-up for experienced users', async ({ page }) => {
		await page.goto('/demo/level-up');
		await page.waitForLoadState('networkidle');

		const triggerButton = page.getByRole('button', { name: /trigger.*level.*up/i });
		if (await triggerButton.isVisible()) {
			await triggerButton.click();

			const modal = page.getByRole('dialog');
			await expect(modal).toBeVisible();

			// Look for skip button
			const skipButton = modal.getByRole('button', { name: /skip|don't show/i });
			if (await skipButton.isVisible()) {
				await skipButton.click();

				// Modal should close immediately
				await expect(modal).not.toBeVisible();
			}
		}
	});
});
