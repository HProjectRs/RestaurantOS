import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('admin@cafe.com')
    await page.locator('input[type="password"]').fill('admin123')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })
  })

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('admin@cafe.com')
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('[class*="toast"], .toast, [role="alert"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('should logout successfully', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('admin@cafe.com')
    await page.locator('input[type="password"]').fill('admin123')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })

    await page.locator('button[type="submit"], button:has-text("خروج"), button:has-text("logout"), button:has-text("sign out")').click({ timeout: 5000 }).catch(() => {})
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})