import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('genechat'));
  await page.reload();
  await page.waitForSelector('[data-testid="conversation-item"]', { timeout: 10000 });
});

test('import a multi-record FASTA file', async ({ page }) => {
  // Wait for seeded blocks to appear
  await page.waitForSelector('[data-testid="sequence-block"]', { timeout: 5000 });
  const initialCount = await page.getByTestId('sequence-block').count();

  // Create a temp FASTA file
  const fastaContent = '>Seq1\nATGCGATCGATCGATCG\n>Seq2\nMVSKGEELFTGVVPIL\n';
  const tempDir = path.join(__dirname, '..', 'test-results');
  fs.mkdirSync(tempDir, { recursive: true });
  const tempFile = path.join(tempDir, 'test-import.fasta');
  fs.writeFileSync(tempFile, fastaContent);

  // Upload via hidden file input
  const fileInput = page.getByTestId('file-upload');
  await fileInput.setInputFiles(tempFile);

  // Should have 2 more blocks than before
  await expect(page.getByTestId('sequence-block')).toHaveCount(initialCount + 2, { timeout: 5000 });

  // Should see import notification
  const notification = page.getByTestId('notification');
  await expect(notification).toBeVisible({ timeout: 3000 });
  await expect(notification).toContainText('Imported 2');

  // Clean up
  fs.unlinkSync(tempFile);
});
