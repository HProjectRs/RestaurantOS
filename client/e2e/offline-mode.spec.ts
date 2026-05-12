import { test, expect } from '@playwright/test'

test.describe('Offline Mode', () => {
  test('should show offline indicator when network disconnected', async ({ page }) => {
    await page.goto('/')
    
    // Simulate offline
    await page.context().setOffline(true)
    
    // Should show offline indicator
    await expect(page.getByText(/offline|no connection/i)).toBeVisible({ timeout: 5000 })
    
    // Go back online
    await page.context().setOffline(false)
  })

  test('should queue order when offline and sync when back online', async ({ page }) => {
    // Load the menu first (while online)
    await page.goto('/menu')
    await expect(page.getByText(/espresso/i)).toBeVisible({ timeout: 10000 })
    
    // Go offline
    await page.context().setOffline(true)
    
    // Add item to cart while offline
    await page.getByText(/espresso/i).click()
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    
    // Should show queued indicator
    await expect(page.getByText(/queued|pending/i)).toBeVisible({ timeout: 5000 })
    
    // Go back online - should sync
    await page.context().setOffline(false)
  })
})
