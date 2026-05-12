import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}))

function renderLoginPage() {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  )
}

describe('LoginPage', () => {
  it('renders the login form', () => {
    renderLoginPage()
    expect(screen.getByPlaceholderText('admin@cafe.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i })
    expect(submitButton).toBeInTheDocument()
  })

  it('shows test credentials hint', () => {
    renderLoginPage()
    const hintTexts = screen.getAllByText(/admin@cafe.com/)
    expect(hintTexts.length).toBeGreaterThanOrEqual(1)
    const admin123Texts = screen.getAllByText(/admin123/)
    expect(admin123Texts.length).toBeGreaterThanOrEqual(1)
  })

  it('has pre-filled email and password', () => {
    renderLoginPage()
    const emailInput = screen.getByPlaceholderText('admin@cafe.com') as HTMLInputElement
    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement
    expect(emailInput.value).toBe('admin@cafe.com')
    expect(passwordInput.value).toBe('admin123')
  })

  it('allows typing in email field', async () => {
    const user = userEvent.setup()
    renderLoginPage()
    const emailInput = screen.getByPlaceholderText('admin@cafe.com')
    await user.clear(emailInput)
    await user.type(emailInput, 'test@test.com')
    expect(emailInput).toHaveValue('test@test.com')
  })

  it('allows typing in password field', async () => {
    const user = userEvent.setup()
    renderLoginPage()
    const passwordInput = screen.getByPlaceholderText('••••••••')
    await user.clear(passwordInput)
    await user.type(passwordInput, 'newpass123')
    expect(passwordInput).toHaveValue('newpass123')
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    renderLoginPage()
    const passwordInput = screen.getByPlaceholderText('••••••••')
    expect(passwordInput).toHaveAttribute('type', 'password')

    const toggleBtn = passwordInput.parentElement?.querySelector('button')
    expect(toggleBtn).not.toBeNull()
    await user.click(toggleBtn!)
    expect(passwordInput).toHaveAttribute('type', 'text')

    await user.click(toggleBtn!)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('renders the logo and app name', () => {
    renderLoginPage()
    expect(screen.getByText('RestaurantOS')).toBeInTheDocument()
  })

  it('renders the login heading', () => {
    renderLoginPage()
    const heading = screen.getByRole('heading', { level: 2, name: 'تسجيل الدخول' })
    expect(heading).toBeInTheDocument()
  })

  it('submit button is enabled by default', () => {
    renderLoginPage()
    const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i })
    expect(submitButton).not.toBeDisabled()
  })
})
