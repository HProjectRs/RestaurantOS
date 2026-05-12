import { test, expect } from '@playwright/test'

test.describe('Order Flow', () => {
  test('should browse menu and add items to cart', async ({ page }) => {
    await page.goto('/menu')
    // Wait for menu items to load
    await expect(page.getByText(/espresso/i)).toBeVisible({ timeout: 10000 })
    // Click on an item to add to cart
    await page.getByText(/espresso/i).click()
    // Add to cart
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    // Cart should show item
    await expect(page.getByText(/cart/i)).toBeVisible()
  })

  test('should complete order flow from menu to checkout', async ({ page }) => {
    // Browse menu
    await page.goto('/menu')
    await expect(page.getByText(/espresso/i)).toBeVisible({ timeout: 10000 })
    
    // Add item to cart
    await page.getByText(/espresso/i).click()
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    
    // Go to cart
    await page.getByRole('link', { name: /cart|checkout/i }).click()
    
    // Fill customer info
    await page.getByLabel(/name/i).fill('Test Customer')
    await page.getByLabel(/phone/i).fill('+966500000000')
    
    // Place order
    await page.getByRole('button', { name: /place order|submit/i }).click()
    
    // Should show confirmation
    await expect(page.getByText(/order confirmed|success/i)).toBeVisible({ timeout: 10000 })
  })

  test('should show order in kitchen display after placement', async ({ page }) => {
    // Place an order first
    await page.goto('/menu')
    await expect(page.getByText(/espresso/i)).toBeVisible({ timeout: 10000 })
    await page.getByText(/espresso/i).click()
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.getByRole('link', { name: /cart|checkout/i }).click()
    await page.getByLabel(/name/i).fill('Kitchen Test')
    await page.getByLabel(/phone/i).fill('+966500000001')
    await page.getByRole('button', { name: /place order|submit/i }).click()
    
    // Open kitchen display
    await page.goto('/kitchen')
    await expect(page.getByText(/kitchen test/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/espresso/i)).toBeVisible()
  })
})
