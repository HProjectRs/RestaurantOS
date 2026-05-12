import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../sentry', () => ({
  default: { showReportDialog: vi.fn() },
  showReportDialog: vi.fn(),
}))

import ErrorFallback from '../components/ErrorFallback'

const mockError = new Error('Test error message')
const mockReset = vi.fn()

describe('ErrorFallback', () => {
  it('renders error title', () => {
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockReset} />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockReset} />)
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('renders try again button', () => {
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockReset} />)
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('renders report button', () => {
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockReset} />)
    expect(screen.getByRole('button', { name: /report this issue/i })).toBeInTheDocument()
  })

  it('calls resetErrorBoundary on try again click', async () => {
    const user = userEvent.setup()
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockReset} />)
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(mockReset).toHaveBeenCalled()
  })
})
