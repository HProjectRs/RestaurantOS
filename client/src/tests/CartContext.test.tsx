import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, renderHook, act } from '@testing-library/react'
import { CartProvider, useCart } from '../store/CartContext'
import { MenuItem } from '../types'

const mockMenuItem: MenuItem = {
  id: 'item-1',
  categoryId: 'cat-1',
  name: 'Espresso',
  nameAr: 'إسبريسو',
  description: 'Rich coffee shot',
  descriptionAr: 'قهوة غنية',
  price: 12.0,
  isAvailable: true,
  isActive: true,
  prepTime: 3,
  sortOrder: 0,
  modifiers: [],
}

const mockMenuItemWithModifiers: MenuItem = {
  ...mockMenuItem,
  id: 'item-2',
  name: 'Cappuccino',
  nameAr: 'كابتشينو',
  price: 16.0,
  modifiers: [
    {
      id: 'mod-1',
      menuItemId: 'item-2',
      name: 'Milk Type',
      nameAr: 'نوع الحليب',
      type: 'SINGLE',
      required: true,
      min: 1,
      max: 1,
      options: [
        { id: 'opt-1', modifierId: 'mod-1', name: 'Whole Milk', nameAr: 'حليب كامل', price: 0, sortOrder: 1 },
        { id: 'opt-2', modifierId: 'mod-1', name: 'Oat Milk', nameAr: 'حليب شوفان', price: 2, sortOrder: 2 },
      ],
    },
  ],
}

function renderCartHook() {
  return renderHook(() => useCart(), { wrapper: CartProvider })
}

describe('CartContext', () => {
  beforeEach(() => {
    const { result } = renderCartHook()
    act(() => result.current.clearCart())
  })

  it('starts with empty cart', () => {
    const { result } = renderCartHook()
    expect(result.current.items).toHaveLength(0)
    expect(result.current.subtotal).toBe(0)
    expect(result.current.itemCount).toBe(0)
  })

  it('adds an item to the cart', () => {
    const { result } = renderCartHook()
    act(() => result.current.addItem(mockMenuItem))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].menuItem.id).toBe('item-1')
    expect(result.current.items[0].quantity).toBe(1)
  })

  it('adds item with custom quantity', () => {
    const { result } = renderCartHook()
    act(() => result.current.addItem(mockMenuItem, 3))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(3)
    expect(result.current.items[0].totalPrice).toBe(36)
  })

  it('adds item with modifiers and calculates price', () => {
    const { result } = renderCartHook()
    act(() =>
      result.current.addItem(mockMenuItemWithModifiers, 1, {
        'mod-1': ['opt-2'],
      })
    )
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].totalPrice).toBe(18)
  })

  it('removes an item by index', () => {
    const { result } = renderCartHook()
    act(() => result.current.addItem(mockMenuItem))
    act(() => result.current.addItem(mockMenuItemWithModifiers))
    expect(result.current.items).toHaveLength(2)

    act(() => result.current.removeItem(0))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].menuItem.id).toBe('item-2')
  })

  it('updates item quantity', () => {
    const { result } = renderCartHook()
    act(() => result.current.addItem(mockMenuItem, 1))
    act(() => result.current.updateItemQuantity(0, 4))
    expect(result.current.items[0].quantity).toBe(4)
    expect(result.current.items[0].totalPrice).toBe(48)
  })

  it('does not decrease quantity below 1', () => {
    const { result } = renderCartHook()
    act(() => result.current.addItem(mockMenuItem, 1))
    act(() => result.current.updateItemQuantity(0, 0))
    expect(result.current.items[0].quantity).toBe(0)
  })

  it('calculates subtotal correctly', () => {
    const { result } = renderCartHook()
    act(() => result.current.addItem(mockMenuItem, 2))
    act(() => result.current.addItem(mockMenuItemWithModifiers, 1))
    expect(result.current.subtotal).toBe(40)
  })

  it('calculates itemCount correctly', () => {
    const { result } = renderCartHook()
    act(() => result.current.addItem(mockMenuItem, 2))
    act(() => result.current.addItem(mockMenuItemWithModifiers, 3))
    expect(result.current.itemCount).toBe(5)
  })

  it('clears cart and resets state', () => {
    const { result } = renderCartHook()
    act(() => result.current.addItem(mockMenuItem, 2))
    act(() => {
      result.current.setBusinessId('biz-1')
      result.current.setCustomerName('Test')
    })
    expect(result.current.items).toHaveLength(1)
    expect(result.current.businessId).toBe('biz-1')

    act(() => result.current.clearCart())
    expect(result.current.items).toHaveLength(0)
    expect(result.current.subtotal).toBe(0)
    expect(result.current.itemCount).toBe(0)
    expect(result.current.businessId).toBe('')
    expect(result.current.customerName).toBe('')
    expect(result.current.existingOrderId).toBeNull()
  })

  it('sets order type', () => {
    const { result } = renderCartHook()
    act(() => result.current.setOrderType('TAKEAWAY'))
    expect(result.current.orderType).toBe('TAKEAWAY')
    act(() => result.current.setOrderType('DELIVERY'))
    expect(result.current.orderType).toBe('DELIVERY')
    act(() => result.current.setOrderType('DINE_IN'))
    expect(result.current.orderType).toBe('DINE_IN')
  })

  it('manages customer info fields', () => {
    const { result } = renderCartHook()
    act(() => result.current.setCustomerName('Ahmed'))
    act(() => result.current.setCustomerPhone('0555123456'))
    act(() => result.current.setNotes('No sugar please'))
    expect(result.current.customerName).toBe('Ahmed')
    expect(result.current.customerPhone).toBe('0555123456')
    expect(result.current.notes).toBe('No sugar please')
  })

  it('manages table and existing order ids', () => {
    const { result } = renderCartHook()
    act(() => result.current.setTableId('table-1'))
    act(() => result.current.setExistingOrderId('order-999'))
    expect(result.current.tableId).toBe('table-1')
    expect(result.current.existingOrderId).toBe('order-999')
  })
})

describe('CartProvider with children', () => {
  it('renders children', () => {
    render(
      <CartProvider>
        <div data-testid="child">Child Content</div>
      </CartProvider>
    )
    expect(screen.getByTestId('child')).toHaveTextContent('Child Content')
  })
})
