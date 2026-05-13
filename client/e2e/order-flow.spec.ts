import { test, expect } from '@playwright/test'

test.describe('Order Flow', () => {
  test('should load menu page', async ({ page }) => {
    await page.goto('/menu')
    const pageContent = await page.content()
    expect(pageContent.length > 100).toBeTruthy()
  })
})