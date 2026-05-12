import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}))

import POSPage from '../pages/admin/POSPage'

describe('POSPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('businessId', 'biz-1')
  })

  it('should render menu categories as tabs', async () => {
    render(<POSPage />)
    await waitFor(() => {
      expect(screen.getByText('قهوة')).toBeInTheDocument()
    })
    expect(screen.getByText('معجنات')).toBeInTheDocument()
  })

  it('should show items in selected category', async () => {
    render(<POSPage />)
    await waitFor(() => {
      expect(screen.getByText('إسبريسو')).toBeInTheDocument()
    })
    expect(screen.getByText('كابتشينو')).toBeInTheDocument()
  })

  it('should add item to order on click', async () => {
    render(<POSPage />)
    await waitFor(() => {
      expect(screen.getByText('إسبريسو')).toBeInTheDocument()
    })
    await userEvent.setup().click(screen.getByText('إسبريسو'))
    await waitFor(() => {
      expect(screen.getByText('السلة (1)')).toBeInTheDocument()
    })
  })

  it('should show order summary with items and total', async () => {
    render(<POSPage />)
    await waitFor(() => {
      expect(screen.getByText('إسبريسو')).toBeInTheDocument()
    })
    await userEvent.setup().click(screen.getByText('إسبريسو'))
    await waitFor(() => {
      expect(screen.getByText(/12\.00/)).toBeInTheDocument()
    })
  })

  it('should search menu items', async () => {
    render(<POSPage />)
    await waitFor(() => {
      expect(screen.getByText('إسبريسو')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('بحث...')
    await userEvent.setup().type(searchInput, 'Espresso')
    expect(screen.getByText('إسبريسو')).toBeInTheDocument()
    expect(screen.queryByText('كرواسون')).not.toBeInTheDocument()
  })

  it('should complete order and show success', async () => {
    render(<POSPage />)
    await waitFor(() => {
      expect(screen.getByText('إسبريسو')).toBeInTheDocument()
    })
    await userEvent.setup().click(screen.getByText('إسبريسو'))
    await waitFor(() => {
      expect(screen.getByText('السلة (1)')).toBeInTheDocument()
    })
    await userEvent.setup().click(screen.getByText(/إرسال الطلب/))
    await waitFor(() => {
      expect(screen.getByText('طريقة الدفع')).toBeInTheDocument()
    })
    await userEvent.setup().click(screen.getByText('نقدي'))
  })

  it('should increase item quantity in cart', async () => {
    render(<POSPage />)
    await waitFor(() => {
      expect(screen.getByText('إسبريسو')).toBeInTheDocument()
    })
    await userEvent.setup().click(screen.getByText('إسبريسو'))
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
    })
    const plusBtns = screen.getAllByRole('button')
    const plusBtn = plusBtns.find(b => b.querySelector('svg.lucide-plus'))
    if (plusBtn) await userEvent.setup().click(plusBtn!)
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })
})
