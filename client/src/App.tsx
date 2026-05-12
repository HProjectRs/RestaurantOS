import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import NetworkStatus from './components/NetworkStatus'
import LoginPage from './pages/LoginPage'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import KitchenPage from './pages/KitchenPage'
import AdminLayout from './components/layout/AdminLayout'
import DashboardPage from './pages/admin/DashboardPage'
import MenuManagementPage from './pages/admin/MenuManagementPage'
import OrdersPage from './pages/admin/OrdersPage'
import TablesPage from './pages/admin/TablesPage'
import EmployeesPage from './pages/admin/EmployeesPage'
import WifiPage from './pages/admin/WifiPage'
import ReportsPage from './pages/admin/ReportsPage'
import ReservationsPage from './pages/admin/ReservationsPage'
import SettingsPage from './pages/admin/SettingsPage'
import POSPage from './pages/admin/POSPage'
import ShiftsPage from './pages/admin/ShiftsPage'
import ExpensesPage from './pages/admin/ExpensesPage'
import UsersPage from './pages/admin/UsersPage'
import WiFiConnectPage from './pages/WiFiConnectPage'
import OrderTrackingPage from './pages/OrderTrackingPage'
import ConsumerHomePage from './pages/ConsumerHomePage'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-3 min-h-screen justify-center">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400">جاري التحميل...</p>
    </div>
  )
}

export default function App() {
  const { checkAuth, isLoading } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  if (isLoading) return <LoadingSpinner />

  return (
    <>
    <NetworkStatus />
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/kitchen" element={<KitchenPage />} />
      <Route path="/wifi" element={<WiFiConnectPage />} />
      <Route path="/order/:orderNumber" element={<OrderTrackingPage />} />
      <Route path="/consumer" element={<ConsumerHomePage />} />

      {/* Protected admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="menu" element={<MenuManagementPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="pos" element={<POSPage />} />
        <Route path="tables" element={<TablesPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="wifi" element={<WifiPage />} />
        <Route path="reports" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><ReportsPage /></ProtectedRoute>} />
        <Route path="reservations" element={<ReservationsPage />} />
        <Route path="shifts" element={<ShiftsPage />} />
        <Route path="expenses" element={<ProtectedRoute roles={['ADMIN', 'MANAGER']}><ExpensesPage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={['ADMIN']}><UsersPage /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute roles={['ADMIN']}><SettingsPage /></ProtectedRoute>} />
      </Route>

      <Route path="/" element={<ConsumerHomePage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    </>
  )
}
