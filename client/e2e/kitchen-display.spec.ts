import { test, expect } from '@playwright/test'

test.describe('Kitchen Display', () => {
  test('should show active orders', async ({ page }) => {
    await page.goto('/kitchen')
    await expect(page.getByText(/orders|tickets/i)).toBeVisible()
  })

  test('should update order status when button clicked', async ({ page }) => {
    await page.goto('/kitchen')
    // Find the first "preparing" button and click it
    const prepareBtn = page.getByRole('button', { name: /prepare|start/i }).first()
    if (await prepareBtn.isVisible()) {
      await prepareBtn.click()
      // Status should change to preparing
      await expect(page.getByText(/preparing/i)).toBeVisible()
    }
  })
})
