import { useState, useEffect, useRef } from 'react'
import { api } from '../../services/api'
import { useThermalPrinter } from '../../hooks/useThermalPrinter'
import { Order } from '../../types'
import { Search, Filter, Eye, X, Printer, Usb, Clock, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from '../../i18n/useTranslation'

const statusColors: Record<string, string> = {
  PENDING: 'badge-pending',
  PREPARING: 'badge-preparing',
  READY: 'badge-ready',
  DELIVERED: 'badge-delivered',
  CANCELLED: 'badge-cancelled',
}

export default function OrdersPage() {
  const { t } = useTranslation()
  const printer = useThermalPrinter()
  const statusText: Record<string, string> = {
    PENDING: t('orders.pending'),
    PREPARING: t('orders.preparing'),
    READY: t('orders.ready'),
    DELIVERED: t('orders.delivered'),
    CANCELLED: t('orders.cancelled'),
  }
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const loadOrders = () => {
    const params = new URLSearchParams()
    if (filter) params.set('status', filter)
    api.getOrders(params.toString())
      .then(setOrders)
      .catch(() => toast.error('فشل تحميل الطلبات'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadOrders() }, [filter])

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api.updateOrderStatus(id, status)
      toast.success('تم تحديث الحالة')
      loadOrders()
    } catch { toast.error('فشل التحديث') }
  }

  const handlePayment = async (id: string, paymentStatus: string, paymentMethod: string) => {
    try {
      await api.updatePayment(id, { paymentStatus, paymentMethod })
      toast.success('تم تحديث الدفع')
      loadOrders()
    } catch { toast.error('فشل التحديث') }
  }

  const filteredOrders = orders.filter(o =>
    !search || o.orderNumber.toString().includes(search) || o.customerName?.includes(search)
  )

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('orders.title')}</h1>
          <p className="text-gray-500">{t('orders.subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['', 'PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s ? statusText[s] : t('orders.all')}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pr-10"
          placeholder={t('search')}
        />
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredOrders.map((order, i) => (
          <div
            key={order.id}
            className="card-hover animate-fade-in cursor-pointer"
            style={{ animationDelay: `${i * 0.03}s` }}
            onClick={() => setSelectedOrder(order)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-glow">
                  #{String(order.orderNumber).slice(-3)}
                </span>
                <div>
                  <p className="font-medium text-sm">{order.customerName || `طاولة ${order.table?.number || '-'}`}</p>
                  <p className="text-xs text-gray-400">
                    {order.type === 'DINE_IN' ? t('menu_customer.dine_in') : order.type === 'TAKEAWAY' ? t('menu_customer.takeaway') : t('menu_customer.delivery')}
                  </p>
                </div>
              </div>
              <span className={statusColors[order.status]}>{statusText[order.status]}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-gray-500">
                  <Clock size={12} />
                  {new Date(order.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  order.paymentStatus === 'PAID'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {order.paymentStatus === 'PAID' ? t('orders.payment.paid') : t('orders.payment.unpaid')}
                </span>
              </div>
              <span className="font-bold text-primary-600">
                {order.total.toFixed(2)} {t('currency')}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex gap-1.5">
              {order.items?.slice(0, 4).map((item: any) => (
                <span key={item.id} className="text-xs px-2 py-1 bg-gray-50 rounded-lg text-gray-600 truncate max-w-[100px]">
                  {item.menuItem.nameAr || item.menuItem.name}
                </span>
              ))}
              {(order.items?.length || 0) > 4 && (
                <span className="text-xs px-2 py-1 bg-gray-50 rounded-lg text-gray-400">+{order.items!.length - 4}</span>
              )}
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
            <ShoppingCart size={48} className="mb-3 text-gray-300" />
            <p className="text-lg font-medium">{t('no_data')}</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-modal animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">طلب #{selectedOrder.orderNumber}</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">النوع:</span>
                  <span className="mr-2">{selectedOrder.type === 'DINE_IN' ? t('menu_customer.dine_in') : selectedOrder.type === 'TAKEAWAY' ? t('menu_customer.takeaway') : t('menu_customer.delivery')}</span>
                </div>
                <div>
                  <span className="text-gray-500">الوقت:</span>
                  <span className="mr-2">{new Date(selectedOrder.createdAt).toLocaleString('ar-SA')}</span>
                </div>
                {selectedOrder.table && (
                  <div>
                    <span className="text-gray-500">طاولة:</span>
                    <span className="mr-2">{selectedOrder.table.number}</span>
                  </div>
                )}
                {selectedOrder.customerName && (
                  <div>
                    <span className="text-gray-500">العميل:</span>
                    <span className="mr-2">{selectedOrder.customerName}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">الأصناف</h3>
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="flex justify-between py-2 text-sm border-b last:border-0">
                    <span>{item.quantity}x {item.menuItem.nameAr || item.menuItem.name}</span>
                    <span>{(item.price * item.quantity).toFixed(2)} {t('currency')}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>المجموع الفرعي</span>
                  <span>{selectedOrder.subtotal.toFixed(2)} {t('currency')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>الضريبة</span>
                  <span>{selectedOrder.tax.toFixed(2)} {t('currency')}</span>
                </div>
                {selectedOrder.serviceCharge > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>خدمة</span>
                    <span>{selectedOrder.serviceCharge.toFixed(2)} {t('currency')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>الإجمالي</span>
                  <span className="text-primary-600">{selectedOrder.total.toFixed(2)} {t('currency')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-4 space-y-2">
                {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.status === 'PENDING' && (
                      <button onClick={() => handleStatusUpdate(selectedOrder.id, 'PREPARING')} className="btn-primary text-sm py-2 flex-1">
                        {t('orders.start_preparing')}
                      </button>
                    )}
                    {selectedOrder.status === 'PREPARING' && (
                      <button onClick={() => handleStatusUpdate(selectedOrder.id, 'READY')} className="btn-primary text-sm py-2 flex-1">
                        {t('orders.mark_ready')}
                      </button>
                    )}
                    {selectedOrder.status === 'READY' && (
                      <button onClick={() => handleStatusUpdate(selectedOrder.id, 'DELIVERED')} className="btn-primary text-sm py-2 flex-1">
                        {t('orders.confirm_delivery')}
                      </button>
                    )}
                  </div>
                )}

                {selectedOrder.paymentStatus !== 'PAID' && selectedOrder.status !== 'CANCELLED' && (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handlePayment(selectedOrder.id, 'PAID', 'CASH')} className="btn-secondary text-sm py-2 flex-1">
                      {t('orders.pay_cash')}
                    </button>
                    <button onClick={() => handlePayment(selectedOrder.id, 'PAID', 'CARD')} className="btn-secondary text-sm py-2 flex-1">
                      {t('orders.pay_card')}
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!printer.device) {
                        await printer.connectPrinter()
                      }
                      const receipt = await api.getReceipt(selectedOrder.id)
                      const text = JSON.stringify(receipt, null, 2)
                      await printer.printReceipt(text)
                    }}
                    className="btn-secondary text-sm py-2 flex-1 flex items-center justify-center gap-2"
                  >
                    <Printer size={16} />
                    {t('receipt.print')}
                  </button>
                  {printer.isSupported && (
                    <button
                      onClick={() => printer.connectPrinter()}
                      className={`btn-secondary text-sm py-2 px-3 ${printer.device ? 'bg-green-100 text-green-700' : ''}`}
                      title={printer.device ? 'متصل' : 'اتصال بطابعة'}
                    >
                      <Usb size={16} />
                    </button>
                  )}
                </div>

                {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'DELIVERED' && (
                  <button onClick={() => {
                    if (confirm(t('orders.confirm_cancel'))) handleStatusUpdate(selectedOrder.id, 'CANCELLED')
                  }} className="btn-danger text-sm py-2 w-full">
                    {t('orders.cancel')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
