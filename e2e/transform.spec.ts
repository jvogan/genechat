import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('genechat'));
  await page.reload();
  await page.waitForSelector('[data-testid="conversation-item"]', { timeout: 10000 });
});

test('reverse complement a DNA sequence', async ({ page }) => {
  // Click the first seeded conversation that has DNA (GFP Analysis)
  const conversations = page.getByTestId('conversation-item');
  // The seeded data includes a GFP sequence - click the first conversation
  await conversations.first().click();

  // Wait for sequence blocks to appear
  await page.waitForSelector('[data-testid="sequence-block"]', { timeout: 5000 });

  // Click the first block to select it
  const firstBlock = page.getByTestId('sequence-block').first();
  await firstBlock.click();

  // Count initial blocks
  const initialCount = await page.getByTestId('sequence-block').count();

  // Open transform dropdown
  await page.getByTestId('transform-dropdown').first().click();

  // Click "Reverse Complement" in the dropdown
  await page.getByText('Reverse Complement').click();

  // Should now have one more block
  await expect(page.getByTestId('sequence-block')).toHaveCount(initialCount + 1, { timeout: 5000 });

  // The new block should have "RC of" in its name
  const lastBlockName = page.getByTestId('block-name').last();
  await expect(lastBlockName).toContainText('RC of');
});
