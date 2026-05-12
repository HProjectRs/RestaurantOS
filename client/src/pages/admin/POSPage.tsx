import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { MenuCategory, CartItem } from '../../types'
import { Plus, Minus, Trash2, ShoppingCart, X, Search, CreditCard, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

export default function POSPage() {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showPayment, setShowPayment] = useState(false)

  const businessId = localStorage.getItem('businessId') || ''

  useEffect(() => {
    if (!businessId) return
    api.get(`/menu/categories?businessId=${businessId}`)
      .then(res => { setCategories(res.data); if (res.data.length) setSelectedCategory(res.data[0].id) })
      .catch(() => toast.error('فشل تحميل القائمة'))
      .finally(() => setLoading(false))
  }, [businessId])

  const allItems = categories.flatMap(c => c.items).filter(i => i.isAvailable)
  const filtered = search
    ? allItems.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.nameAr?.includes(search) ||
        (i as any).barcode?.toLowerCase().includes(search.toLowerCase())
      )
    : selectedCategory
      ? categories.find(c => c.id === selectedCategory)?.items.filter(i => i.isAvailable) || []
      : allItems

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id)
      if (existing) {
        return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { menuItem: item, quantity: 1, selectedModifiers: {}, totalPrice: item.discountPrice || item.price }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.menuItem.id !== id) return i
      const qty = Math.max(0, i.quantity + delta)
      return qty === 0 ? null : { ...i, quantity: qty, totalPrice: (i.totalPrice / i.quantity) * qty }
    }).filter(Boolean) as CartItem[])
  }

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(i => i.menuItem.id !== id))
  }

  const subtotal = cart.reduce((sum, i) => sum + i.totalPrice, 0)

  const placeOrder = async () => {
    if (!cart.length) return
    try {
      await api.post('/orders', {
        businessId,
        items: cart.map(i => ({ menuItemId: i.menuItem.id, quantity: i.quantity, unitPrice: i.menuItem.discountPrice || i.menuItem.price })),
        type: 'DINE_IN',
      })
      toast.success('تم إرسال الطلب')
      setCart([])
      setShowPayment(false)
    } catch {
      toast.error('فشل إرسال الطلب')
    }
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-4" dir="auto">
      {/* Left: Menu items */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('search')}
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {!search && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === c.id ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {c.nameAr || c.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(item => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="bg-white rounded-xl p-3 border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all text-right"
            >
              {item.image && <img src={item.image} className="w-full h-24 object-cover rounded-lg mb-2" />}
              <p className="font-medium text-sm">{item.nameAr || item.name}</p>
              <p className="text-emerald-600 font-bold mt-1">{item.discountPrice || item.price} {t('currency')}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-80 bg-white rounded-2xl border border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-bold flex items-center gap-2">
            <ShoppingCart size={18} />
            {t('menu_customer.cart')} ({cart.length})
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.menuItem.nameAr || item.menuItem.name}</p>
                <p className="text-xs text-gray-500">{item.menuItem.price} {t('currency')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(item.menuItem.id, -1)} className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                  <Minus size={14} />
                </button>
                <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                <button onClick={() => updateQty(item.menuItem.id, 1)} className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                  <Plus size={14} />
                </button>
              </div>
              <button onClick={() => removeItem(item.menuItem.id)} className="text-red-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {!cart.length && <p className="text-gray-400 text-center py-8 text-sm">{t('menu_customer.cart_empty')}</p>}
        </div>

        <div className="p-4 border-t space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t('menu_customer.subtotal')}</span>
            <span className="font-bold">{subtotal.toFixed(2)} {t('currency')}</span>
          </div>
          <button
            onClick={() => setShowPayment(true)}
            disabled={!cart.length}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-300 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <CreditCard size={18} />
            {t('menu_customer.place_order')} ({cart.length})
          </button>
        </div>
      </div>

      {/* Payment modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{t('menu_customer.payment_method')}</h3>
              <button onClick={() => setShowPayment(false)}><X size={20} /></button>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span>{t('menu_customer.subtotal')}</span>
                <span>{subtotal.toFixed(2)} {t('currency')}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>{t('menu_customer.total')}</span>
                <span className="text-emerald-600">{subtotal.toFixed(2)} {t('currency')}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={placeOrder} className="bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-400">
                {t('menu_customer.cash')}
              </button>
              <button onClick={placeOrder} className="bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-400">
                {t('menu_customer.card')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
