import React, { createContext, useContext, useState, useCallback } from 'react'
import { MenuItem, CartItem } from '../types'

interface CartContextType {
  items: CartItem[]
  businessId: string
  tableId: string | null
  existingOrderId: string | null
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'
  customerName: string
  customerPhone: string
  notes: string
  setBusinessId: (id: string) => void
  setTableId: (id: string | null) => void
  setExistingOrderId: (id: string | null) => void
  setOrderType: (type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY') => void
  setCustomerName: (name: string) => void
  setCustomerPhone: (phone: string) => void
  setNotes: (notes: string) => void
  addItem: (menuItem: MenuItem, quantity?: number, modifiers?: Record<string, string[]>, notes?: string) => void
  removeItem: (index: number) => void
  updateItemQuantity: (index: number, quantity: number) => void
  clearCart: () => void
  subtotal: number
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [businessId, setBusinessId] = useState('')
  const [tableId, setTableId] = useState<string | null>(null)
  const [existingOrderId, setExistingOrderId] = useState<string | null>(null)
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')

  const addItem = useCallback(
    (menuItem: MenuItem, quantity = 1, selectedModifiers: Record<string, string[]> = {}, itemNotes?: string) => {
      let modifiersPrice = 0
      if (menuItem.modifiers && selectedModifiers) {
        for (const [modifierId, optionIds] of Object.entries(selectedModifiers)) {
          const modifier = menuItem.modifiers.find(m => m.id === modifierId)
          if (modifier) {
            for (const optionId of optionIds) {
              const option = modifier.options.find(o => o.id === optionId)
              if (option) modifiersPrice += option.price
            }
          }
        }
      }

      const itemPrice = (menuItem.discountPrice || menuItem.price) + modifiersPrice
      const totalPrice = itemPrice * quantity

      setItems(prev => [
        ...prev,
        {
          menuItem,
          quantity,
          notes: itemNotes,
          selectedModifiers,
          totalPrice,
        },
      ])
    },
    []
  )

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updateItemQuantity = useCallback((index: number, quantity: number) => {
    setItems(prev =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity, totalPrice: (item.totalPrice / item.quantity) * quantity }
          : item
      )
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setBusinessId('')
    setCustomerName('')
    setCustomerPhone('')
    setNotes('')
    setExistingOrderId(null)
  }, [])

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        businessId,
        tableId,
        existingOrderId,
        orderType,
        customerName,
        customerPhone,
        notes,
        setBusinessId,
        setTableId,
        setExistingOrderId,
        setOrderType,
        setCustomerName,
        setCustomerPhone,
        setNotes,
        addItem,
        removeItem,
        updateItemQuantity,
        clearCart,
        subtotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
