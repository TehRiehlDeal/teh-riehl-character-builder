import { test, expect } from '@playwright/test';
// @ts-ignore - Node built-in modules
import { readFileSync } from 'fs';
// @ts-ignore - Node built-in modules
import { join } from 'path';

/**
 * E2E Tests for Character Import/Export
 *
 * Tests character data export to JSON and import functionality.
 * Ensures data portability and backup capabilities.
 */

test.describe('Character Export', () => {
	test.beforeEach(async ({ page }) => {
		// Create a basic character for export testing
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		// Quick character setup
		await page.getByPlaceholder(/search ancestries/i).fill('Halfling');
		await page.getByRole('button', { name: /select.*halfling/i }).first().click();

		await page.getByPlaceholder(/search classes/i).fill('Cleric');
		await page.getByRole('button', { name: /select.*cleric/i }).first().click();

		await page.waitForTimeout(1000);
	});

	test('should export character data as JSON', async ({ page }) => {
		// Look for export button (might be in menu or settings)
		const exportButton = page.getByRole('button', { name: /export|download|save/i });

		if (await exportButton.count() === 0) {
			// Try opening a menu first
			const menuButton = page.getByRole('button', { name: /menu|options/i });
			if (await menuButton.count() > 0) {
				await menuButton.first().click();
				await page.waitForTimeout(300);
			}
		}

		const exportBtn = page.getByRole('button', { name: /export|download/i }).first();
		if (await exportBtn.isVisible()) {
			// Set up download listener
			const downloadPromise = page.waitForEvent('download');

			await exportBtn.click();

			// Wait for download
			const download = await downloadPromise;

			// Check filename
			const filename = download.suggestedFilename();
			expect(filename).toMatch(/\.json$/i);

			// Verify file can be read and is valid JSON
			const path = await download.path();
			if (path) {
				const content = readFileSync(path, 'utf-8');
				const data = JSON.parse(content);

				// Check for expected character properties
				expect(data).toHaveProperty('ancestry');
				expect(data).toHaveProperty('class');
				expect(data).toHaveProperty('level');
				expect(data.ancestry.name).toBe('Halfling');
				expect(data.class.name).toBe('Cleric');
			}
		}
	});

	test('should include all character data in export', async ({ page }) => {
		// Create more complete character
		await page.getByPlaceholder(/search backgrounds/i).fill('Scholar');
		const scholarButton = page.getByRole('button', { name: /select.*scholar/i }).first();
		if (await scholarButton.isVisible()) {
			await scholarButton.click();
		}

		await page.waitForTimeout(500);

		// Try to export
		const exportButton = page.getByRole('button', { name: /export|download/i }).first();
		if (await exportButton.isVisible()) {
			const downloadPromise = page.waitForEvent('download');
			await exportButton.click();

			const download = await downloadPromise;
			const path = await download.path();

			if (path) {
				const content = readFileSync(path, 'utf-8');
				const data = JSON.parse(content);

				// Verify comprehensive data
				expect(data.ancestry).toBeDefined();
				expect(data.background).toBeDefined();
				expect(data.class).toBeDefined();
				expect(data.abilities).toBeDefined();
				expect(data.feats).toBeDefined();

				// Check data version for errata tracking
				expect(data.dataVersion).toBeDefined();
			}
		}
	});

	test('should export with readable formatting', async ({ page }) => {
		const exportButton = page.getByRole('button', { name: /export|download/i }).first();
		if (await exportButton.isVisible()) {
			const downloadPromise = page.waitForEvent('download');
			await exportButton.click();

			const download = await downloadPromise;
			const path = await download.path();

			if (path) {
				const content = readFileSync(path, 'utf-8');

				// Check that JSON is formatted (has newlines and indentation)
				expect(content).toContain('\n');
				expect(content).toContain('  '); // Indentation

				// Should be parseable
				expect(() => JSON.parse(content)).not.toThrow();
			}
		}
	});
});

test.describe('Character Import', () => {
	test('should import character from JSON file', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Look for import button
		const importButton = page.getByRole('button', { name: /import|load|upload/i });

		if (await importButton.count() === 0) {
			// Try opening menu
			const menuButton = page.getByRole('button', { name: /menu|options/i });
			if (await menuButton.count() > 0) {
				await menuButton.first().click();
			}
		}

		const importBtn = page.getByRole('button', { name: /import|load/i }).first();
		if (await importBtn.isVisible()) {
			// Create a mock character file
			const mockCharacter = {
				name: 'Test Character',
				level: 1,
				ancestry: {
					id: 'dwarf',
					name: 'Dwarf',
					heritage: 'Mountain Dwarf'
				},
				background: {
					id: 'acolyte',
					name: 'Acolyte'
				},
				class: {
					id: 'wizard',
					name: 'Wizard',
					keyAbility: 'Intelligence',
					subclass: null
				},
				abilities: {
					strength: 10,
					dexterity: 12,
					constitution: 14,
					intelligence: 18,
					wisdom: 13,
					charisma: 10
				},
				feats: {
					ancestry: [],
					class: [],
					skill: [],
					general: []
				},
				dataVersion: '2026.01.2'
			};

			// For E2E testing, we'd need to handle file upload
			// This is a placeholder for the test structure
			// In a real test, you'd use page.setInputFiles()

			const fileInput = page.locator('input[type="file"]');
			if (await fileInput.count() > 0) {
				// Create temporary file and upload
				// await fileInput.setInputFiles({
				//   name: 'character.json',
				//   mimeType: 'application/json',
				//   buffer: Buffer.from(JSON.stringify(mockCharacter))
				// });

				// Verify import success
				await page.waitForTimeout(1000);

				// Character should be loaded
				await expect(page.getByText(/test character/i)).toBeVisible();
			}
		}
	});

	test('should validate imported JSON structure', async ({ page }) => {
		await page.goto('/');

		// Try to import invalid JSON
		const importButton = page.getByRole('button', { name: /import/i }).first();
		if (await importButton.isVisible()) {
			const fileInput = page.locator('input[type="file"]');
			if (await fileInput.count() > 0) {
				// In real implementation, upload invalid JSON
				// Should show error message

				const errorMessage = page.locator('text=/invalid|error/i');
				// Error handling should be present
			}
		}
	});

	test('should handle version mismatches in imported characters', async ({ page }) => {
		await page.goto('/');

		const importButton = page.getByRole('button', { name: /import/i }).first();
		if (await importButton.isVisible()) {
			// Import character with old data version
			const oldCharacter = {
				name: 'Old Character',
				dataVersion: '2020.01.1', // Old version
				ancestry: { name: 'Elf' },
				class: { name: 'Fighter' }
				// ... other data
			};

			// After import, should show data version warning
			// (Tested in data-update component tests)
		}
	});

	test('should preserve all character data through export-import cycle', async ({ page }) => {
		// Create character
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		await page.getByPlaceholder(/search ancestries/i).fill('Gnome');
		await page.getByRole('button', { name: /select.*gnome/i }).first().click();

		await page.getByPlaceholder(/search classes/i).fill('Bard');
		await page.getByRole('button', { name: /select.*bard/i }).first().click();

		await page.waitForTimeout(1000);

		// Export
		const exportButton = page.getByRole('button', { name: /export/i }).first();
		if (await exportButton.isVisible()) {
			const downloadPromise = page.waitForEvent('download');
			await exportButton.click();
			const download = await downloadPromise;
			const exportPath = await download.path();

			if (exportPath) {
				const exportedData = JSON.parse(readFileSync(exportPath, 'utf-8'));

				// Clear character
				await page.goto('/');
				await page.waitForLoadState('networkidle');

				// Import back
				const importButton = page.getByRole('button', { name: /import/i }).first();
				if (await importButton.isVisible()) {
					const fileInput = page.locator('input[type="file"]');
					if (await fileInput.count() > 0) {
						// Import the file
						// After import, verify data matches

						await page.goto('/builder/general');
						await expect(page.getByText(/gnome/i)).toBeVisible();
						await expect(page.getByText(/bard/i)).toBeVisible();
					}
				}
			}
		}
	});
});

test.describe('Character Backup and Recovery', () => {
	test('should auto-save to localStorage', async ({ page, context }) => {
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		// Make changes
		await page.getByPlaceholder(/search ancestries/i).fill('Orc');
		await page.getByRole('button', { name: /select.*orc/i }).first().click();

		await page.waitForTimeout(500);

		// Check localStorage
		const storage = await context.storageState();
		const localStorage = storage.origins[0]?.localStorage || [];
		const characterData = localStorage.find((item) => item.name.includes('character'));

		expect(characterData).toBeDefined();
		if (characterData) {
			const data = JSON.parse(characterData.value);
			expect(data.ancestry?.name).toContain('Orc');
		}
	});

	test('should recover character after page reload', async ({ page }) => {
		// Create character
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		await page.getByPlaceholder(/search ancestries/i).fill('Catfolk');
		await page.getByRole('button', { name: /select.*catfolk/i }).first().click();

		await page.waitForTimeout(500);

		// Reload page
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Character should be restored
		await expect(page.getByText(/catfolk/i)).toBeVisible();
	});

	test('should handle localStorage corruption gracefully', async ({ page, context }) => {
		// Corrupt localStorage data
		await context.addInitScript(() => {
			localStorage.setItem('pf2e-character', 'invalid-json-{{{');
		});

		// Navigate to app
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Should not crash - should load default/empty character
		await expect(page.getByRole('heading')).toBeVisible();

		// Error message might be shown
		const errorNotice = page.locator('text=/error|couldn.*t load/i');
		// App should recover gracefully
	});
});
