import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('genechat'));
  await page.reload();
  // Wait for seed data to load - sidebar should have conversation items
  await page.waitForSelector('[data-testid="conversation-item"]', { timeout: 10000 });
});

test('paste a FASTA sequence and see it as a block', async ({ page }) => {
  // Count existing blocks in the auto-selected conversation
  await page.waitForSelector('[data-testid="sequence-block"]', { timeout: 5000 });
  const initialCount = await page.getByTestId('sequence-block').count();

  // Type a FASTA string into the input
  const input = page.getByTestId('sequence-input');
  await input.fill('>TestSeq\nATGCGATCGATCG');

  // Submit
  await page.getByTestId('submit-sequence').click();

  // Should have one more block than before
  await expect(page.getByTestId('sequence-block')).toHaveCount(initialCount + 1, { timeout: 5000 });

  // The last (newest) block should have the name "TestSeq"
  const lastBlockName = page.getByTestId('block-name').last();
  await expect(lastBlockName).toHaveText('TestSeq');
});

test('paste raw sequence without FASTA header', async ({ page }) => {
  await page.waitForSelector('[data-testid="sequence-block"]', { timeout: 5000 });
  const initialCount = await page.getByTestId('sequence-block').count();

  const input = page.getByTestId('sequence-input');
  await input.fill('ATGCGATCGATCG');
  await page.getByTestId('submit-sequence').click();

  // Should have one more block
  await expect(page.getByTestId('sequence-block')).toHaveCount(initialCount + 1, { timeout: 5000 });
});
