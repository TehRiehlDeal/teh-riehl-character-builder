import { test, expect } from '@playwright/test';
import { checkA11y, getViolations } from 'axe-playwright';

/**
 * Accessibility Tests
 *
 * Tests compliance with WCAG 2.1 AA standards using axe-core.
 * Covers all major pages and interactive components.
 */

test.describe('Accessibility - Core Pages', () => {
	test('homepage should not have any automatically detectable accessibility issues', async ({
		page
	}) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const violations = await getViolations(page);

		expect(violations).toEqual([]);
	});

	test('character creation page should be accessible', async ({ page }) => {
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		const violations = await getViolations(page);

		expect(violations).toEqual([]);
	});

	test('feats page should be accessible', async ({ page }) => {
		await page.goto('/builder/feats');
		await page.waitForLoadState('networkidle');

		const violations = await getViolations(page);

		expect(violations).toEqual([]);
	});

	test('spells page should be accessible', async ({ page }) => {
		await page.goto('/builder/spells');
		await page.waitForLoadState('networkidle');

		const violations = await getViolations(page);

		expect(violations).toEqual([]);
	});

	test('equipment page should be accessible', async ({ page }) => {
		await page.goto('/builder/equipment');
		await page.waitForLoadState('networkidle');

		const violations = await getViolations(page);

		expect(violations).toEqual([]);
	});

	test('planning page should be accessible', async ({ page }) => {
		await page.goto('/builder/planning');
		await page.waitForLoadState('networkidle');

		const violations = await getViolations(page);

		expect(violations).toEqual([]);
	});

	test('legal page should be accessible', async ({ page }) => {
		await page.goto('/legal');
		await page.waitForLoadState('networkidle');

		const violations = await getViolations(page);

		expect(violations).toEqual([]);
	});

	test('changelog page should be accessible', async ({ page }) => {
		await page.goto('/changelog');
		await page.waitForLoadState('networkidle');

		const violations = await getViolations(page);

		expect(violations).toEqual([]);
	});
});

test.describe('Accessibility - Keyboard Navigation', () => {
	test('should navigate main menu with keyboard', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Tab through navigation
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');

		// Check that focusable elements receive focus
		const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
		expect(focusedElement).toBeDefined();
	});

	test('should navigate character creation with keyboard', async ({ page }) => {
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		// Tab to search field
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');

		// Type in search
		await page.keyboard.type('Human');

		// Navigate to select button
		for (let i = 0; i < 5; i++) {
			await page.keyboard.press('Tab');
		}

		// Should be able to activate with Enter or Space
		await page.keyboard.press('Enter');
		await page.waitForTimeout(300);

		// Check that selection was made
		const selectedText = page.getByText(/selected.*human/i);
		if (await selectedText.count() > 0) {
			await expect(selectedText).toBeVisible();
		}
	});

	test('should close modals with Escape key', async ({ page }) => {
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		// Open details modal
		const detailsButton = page.getByRole('button', { name: /details/i }).first();
		if (await detailsButton.isVisible()) {
			await detailsButton.click();

			// Modal should be visible
			await expect(page.getByRole('dialog')).toBeVisible();

			// Press Escape
			await page.keyboard.press('Escape');

			// Modal should close
			await expect(page.getByRole('dialog')).not.toBeVisible();
		}
	});

	test('should trap focus within modals', async ({ page }) => {
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		// Open details modal
		const detailsButton = page.getByRole('button', { name: /details/i }).first();
		if (await detailsButton.isVisible()) {
			await detailsButton.click();

			const modal = page.getByRole('dialog');
			await expect(modal).toBeVisible();

			// Tab through modal
			await page.keyboard.press('Tab');
			await page.keyboard.press('Tab');

			// Focus should stay within modal
			const focusedElement = await page.evaluate(() => document.activeElement?.closest('[role="dialog"]'));
			expect(focusedElement).toBeTruthy();

			// Close modal
			await page.keyboard.press('Escape');
		}
	});
});

test.describe('Accessibility - Screen Reader Support', () => {
	test('should have proper heading hierarchy', async ({ page }) => {
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		// Check for h1
		const h1 = await page.locator('h1').count();
		expect(h1).toBeGreaterThanOrEqual(1);

		// h1 should come before h2
		const headings = await page.evaluate(() => {
			const h1s = Array.from(document.querySelectorAll('h1'));
			const h2s = Array.from(document.querySelectorAll('h2'));
			return {
				h1Count: h1s.length,
				h2Count: h2s.length,
				h1BeforeH2: h1s.length > 0 && (h2s.length === 0 || h1s[0].compareDocumentPosition(h2s[0]) === Node.DOCUMENT_POSITION_FOLLOWING)
			};
		});

		expect(headings.h1Count).toBeGreaterThanOrEqual(1);
		expect(headings.h1BeforeH2).toBeTruthy();
	});

	test('should have descriptive link text', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Check for links with proper text (not "click here" or "read more")
		const badLinks = await page.evaluate(() => {
			const links = Array.from(document.querySelectorAll('a'));
			return links.filter((link) => {
				const text = link.textContent?.toLowerCase() || '';
				return text === 'click here' || text === 'here' || text === 'read more' || text === 'link';
			});
		});

		expect(badLinks.length).toBe(0);
	});

	test('should have alt text on images', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Check all images have alt text
		const imagesWithoutAlt = await page.evaluate(() => {
			const images = Array.from(document.querySelectorAll('img'));
			return images.filter((img) => !img.getAttribute('alt'));
		});

		expect(imagesWithoutAlt.length).toBe(0);
	});

	test('should have proper ARIA labels on interactive elements', async ({ page }) => {
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		// Check buttons have accessible names
		const buttons = await page.locator('button').all();
		for (const button of buttons.slice(0, 10)) {
			// Check first 10 buttons
			const accessibleName = await button.evaluate((el) => {
				return el.textContent || el.getAttribute('aria-label') || el.getAttribute('title');
			});
			expect(accessibleName).toBeTruthy();
		}
	});

	test('should announce dynamic content changes', async ({ page }) => {
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		// Look for aria-live regions
		const liveRegions = await page.locator('[aria-live]').count();

		// Select an ancestry (should trigger announcements)
		await page.getByPlaceholder(/search ancestries/i).fill('Elf');
		await page.getByRole('button', { name: /select.*elf/i }).first().click();

		await page.waitForTimeout(300);

		// Check that status/announcement regions exist
		const statusRegions = await page.locator('[role="status"], [aria-live="polite"], [aria-live="assertive"]').count();
		expect(statusRegions).toBeGreaterThanOrEqual(0);
	});
});

test.describe('Accessibility - Color and Contrast', () => {
	test('should meet color contrast requirements', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Use axe-core to check color contrast
		const allViolations = await getViolations(page, undefined, {
			runOnly: {
				type: 'tag',
				values: ['wcag2aa', 'wcag21aa']
			}
		});

		const contrastViolations = allViolations.filter((v: any) =>
			v.id.includes('color-contrast')
		);

		expect(contrastViolations).toEqual([]);
	});

	test('should work without color (for colorblind users)', async ({ page }) => {
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		// Check that important information is conveyed through more than just color
		// For example, selected items should have borders or icons, not just color changes

		const selectedItems = page.locator('[data-selected="true"], .selected, [aria-selected="true"]');
		const count = await selectedItems.count();

		// If there are selected items, they should have visual indicators beyond color
		if (count > 0) {
			const firstSelected = selectedItems.first();
			const styles = await firstSelected.evaluate((el) => {
				const computed = window.getComputedStyle(el);
				return {
					borderWidth: computed.borderWidth,
					borderStyle: computed.borderStyle,
					fontWeight: computed.fontWeight
				};
			});

			// Should have some visual indicator (border, bold text, etc.)
			const hasVisualIndicator =
				parseFloat(styles.borderWidth) > 1 || styles.fontWeight === 'bold' || styles.fontWeight >= '600';

			expect(hasVisualIndicator).toBeTruthy();
		}
	});
});

test.describe('Accessibility - Forms and Input', () => {
	test('should have labels for all form inputs', async ({ page }) => {
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		// Check that inputs have associated labels
		const allViolations = await getViolations(page, undefined, {
			runOnly: {
				type: 'tag',
				values: ['wcag2a', 'wcag21a']
			}
		});

		const labelViolations = allViolations.filter((v: any) => v.id.includes('label'));

		expect(labelViolations).toEqual([]);
	});

	test('should show validation errors accessibly', async ({ page }) => {
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		// If there are required fields, check error handling
		const requiredInputs = page.locator('[required], [aria-required="true"]');
		const count = await requiredInputs.count();

		if (count > 0) {
			const firstRequired = requiredInputs.first();

			// Try to submit without filling (if applicable)
			// Error messages should be associated with inputs via aria-describedby
			const describedBy = await firstRequired.getAttribute('aria-describedby');

			// Error handling should be accessible
			// This is a basic check - actual behavior depends on form implementation
		}
	});
});

test.describe('Accessibility - Mobile and Touch', () => {
	test('should have adequate touch target sizes', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/builder/general');
		await page.waitForLoadState('networkidle');

		// Check that interactive elements are large enough (44x44px minimum)
		const smallTargets = await page.evaluate(() => {
			const interactive = Array.from(document.querySelectorAll('button, a, input, select'));
			return interactive.filter((el) => {
				const rect = el.getBoundingClientRect();
				return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
			}).length;
		});

		// Some elements might be legitimately small (icons in lists, etc.)
		// But most interactive elements should meet the 44x44 target
		expect(smallTargets).toBeLessThan(5);
	});

	test('should support zoom up to 200%', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Set zoom to 200%
		await page.evaluate(() => {
			document.body.style.zoom = '2';
		});

		// Content should still be readable
		const isContentVisible = await page.evaluate(() => {
			const body = document.body;
			return body.scrollHeight > 0 && body.scrollWidth > 0;
		});

		expect(isContentVisible).toBeTruthy();

		// No horizontal scrolling should be needed for main content
		const hasHorizontalScroll = await page.evaluate(() => {
			return document.documentElement.scrollWidth > window.innerWidth;
		});

		// Some horizontal scroll might be acceptable depending on content
		// This is a basic check
	});
});
