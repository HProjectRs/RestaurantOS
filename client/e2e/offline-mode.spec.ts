import { test, expect } from '@playwright/test'

test.describe('Offline Mode', () => {
  test('should handle offline state', async ({ page }) => {
    await page.goto('/')
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)
    await page.context().setOffline(false)
  })
})