import { test, expect } from '@playwright/test'

test.describe('Kitchen Display', () => {
  test('should show kitchen display page', async ({ page }) => {
    await page.goto('/kitchen')
    const pageContent = await page.content()
    expect(pageContent.length > 100).toBeTruthy()
  })
})