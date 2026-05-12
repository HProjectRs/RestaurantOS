import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard, Menu, ShoppingBag, Table2, Users, Wifi,
  BarChart3, CalendarDays, Settings, LogOut, ChefHat, Bell,
  CreditCard, Clock, TrendingDown, UserCog, X,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { getSocket } from '../../services/socket'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

const navItems: { to: string; icon: any; label: string; end?: boolean; roles?: string[]; external?: boolean }[] = [
  { to: '/admin', icon: LayoutDashboard, label: 'nav.dashboard', end: true },
  { to: '/admin/pos', icon: CreditCard, label: 'nav.pos', roles: [] },
  { to: '/admin/orders', icon: ShoppingBag, label: 'nav.orders', roles: [] },
  { to: '/admin/menu', icon: Menu, label: 'nav.menu', roles: ['ADMIN', 'MANAGER'] },
  { to: '/admin/tables', icon: Table2, label: 'nav.tables', roles: [] },
  { to: '/admin/reservations', icon: CalendarDays, label: 'nav.reservations', roles: [] },
  { to: '/admin/employees', icon: Users, label: 'nav.employees', roles: [] },
  { to: '/admin/shifts', icon: Clock, label: 'nav.shifts', roles: [] },
  { to: '/admin/wifi', icon: Wifi, label: 'nav.wifi', roles: ['ADMIN', 'MANAGER'] },
  { to: '/admin/expenses', icon: TrendingDown, label: 'nav.expenses', roles: ['ADMIN', 'MANAGER'] },
  { to: '/admin/reports', icon: BarChart3, label: 'nav.reports', roles: ['ADMIN', 'MANAGER'] },
  { to: '/admin/users', icon: UserCog, label: 'nav.users', roles: ['ADMIN'] },
  { to: '/admin/settings', icon: Settings, label: 'nav.settings', roles: ['ADMIN'] },
]

export default function AdminLayout() {
  const { t } = useTranslation()
  const { user, business, logout } = useAuthStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    const socket = getSocket()

    const handleWaiterCall = (data: any) => {
      toast.custom(() => (
        <div className="bg-yellow-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 min-w-[250px]">
          <Bell className="w-5 h-5" />
          <div>
            <p className="font-semibold">{t('waiter:called')}</p>
            <p className="text-sm opacity-90">{t('consumer.table')} {data.tableNumber}</p>
          </div>
        </div>
      ), { duration: 8000 })
      setNotifications(prev => [data, ...prev].slice(0, 20))
    }

    const handleNewOrder = (order: any) => {
      toast.custom(() => (
        <div className="bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 min-w-[250px]">
          <ShoppingBag className="w-5 h-5" />
          <div>
            <p className="font-semibold">{t('orders.title')}</p>
            <p className="text-sm opacity-90">#{order.orderNumber} - {order.total?.toFixed(2)} {t('currency')}</p>
          </div>
        </div>
      ), { duration: 5000 })
    }

    socket.on('waiter:called', handleWaiterCall)
    socket.on('order:new', handleNewOrder)

    return () => {
      socket.off('waiter:called', handleWaiterCall)
      socket.off('order:new', handleNewOrder)
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const filteredNav = navItems.filter(item =>
    !item.roles || item.roles.length === 0 || (user && item.roles.includes(user.role))
  )

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="auto">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-30 w-64 bg-white border-l border-gray-200 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto ${
        mobileOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold">
                R
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-sm">{business?.nameAr || business?.name || 'RestaurantOS'}</h2>
                <p className="text-xs text-gray-500">{user?.name}</p>
              </div>
              <LanguageSwitcher compact />
              <button
                onClick={() => setNotifications([])}
                className="relative p-2 hover:bg-gray-100 rounded-lg"
                title={`${notifications.length} ${t('notification')}`}
              >
                <Bell className="w-5 h-5 text-gray-500" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>
            {notifications.length > 0 && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {notifications.slice(0, 5).map((n, i) => (
                  <div key={i} className="text-xs bg-yellow-50 text-yellow-800 px-2 py-1 rounded-lg">
                    🔔 {t('consumer.table')} {n.tableNumber}: {n.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {filteredNav.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon size={20} />
                <span>{t(item.label)}</span>
              </NavLink>
            ))}

            <a
              href="/kitchen"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              <ChefHat size={20} />
              <span>{t('nav.kitchen')}</span>
            </a>
          </nav>

          <div className="p-3 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-all"
            >
              <LogOut size={20} />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-bold">{business?.nameAr || business?.name || 'RestaurantOS'}</h1>
          <div />
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
