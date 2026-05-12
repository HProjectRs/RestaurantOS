import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@cafe.com')
    await page.getByLabel(/password/i).fill('admin123')
    await page.getByRole('button', { name: /sign in/i }).click()
    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin/)
    // Should show user name
    await expect(page.getByText(/admin/i)).toBeVisible()
  })

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@cafe.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(/invalid|error/i)).toBeVisible()
  })

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@cafe.com')
    await page.getByLabel(/password/i).fill('admin123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/admin/)
    
    // Click logout
    await page.getByRole('button', { name: /logout|sign out/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})
