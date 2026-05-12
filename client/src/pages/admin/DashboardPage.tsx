import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp, TrendingDown, ShoppingCart, Table2, CalendarDays,
  Wifi, DollarSign, Clock, Users, Package, AlertCircle
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { getSocket } from '../../services/socket'
import { useTranslation } from 'react-i18next'

const StatCard = ({ title, value, sub, icon: Icon, gradient, trend }: any) => (
  <div className="relative group rounded-2xl p-5 overflow-hidden animate-fade-in cursor-default transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
    <div className={`absolute inset-0 ${gradient} opacity-90`} />
    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
          <Icon size={20} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm ${trend >= 0 ? 'text-white' : 'text-red-200'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white drop-shadow-sm">{value}</div>
      <div className="text-sm text-white/80 mt-0.5">{title}</div>
      {sub && <div className="text-xs text-white/60 mt-1">{sub}</div>}
    </div>
  </div>
)

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/reports/dashboard')
      return data
    },
    refetchInterval: 60_000,
  })

  const { data: salesData } = useQuery({
    queryKey: ['sales-chart'],
    queryFn: async () => {
      const { data } = await api.get('/reports/sales?period=week')
      return data
    },
  })

  useEffect(() => {
    const socket = getSocket(token || undefined)
    const handleNewData = () => refetch()
    socket.on('order:created', handleNewData)
    socket.on('payment:completed', handleNewData)
    return () => {
      socket.off('order:created', handleNewData)
      socket.off('payment:completed', handleNewData)
    }
  }, [refetch])

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  )

  const s = data?.sales
  const o = data?.operations

  return (
    <div className="space-y-6" dir="auto">
      <div>
        <h1 className="text-xl font-bold text-white">{t('dashboard.title')}</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {t('dashboard.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('dashboard.today_revenue')} value={`${(s?.today || 0).toLocaleString('ar-DZ')} ${t('currency')}`} sub={`أمس: ${(s?.yesterday || 0).toLocaleString()}`} icon={DollarSign} gradient="gradient-emerald" trend={s?.growth} />
        <StatCard title={t('dashboard.today_orders')} value={s?.ordersCount || 0} sub={`متوسط: ${Math.round(s?.avgOrderValue || 0)} ${t('currency')}`} icon={ShoppingCart} gradient="gradient-blue" />
        <StatCard title={t('dashboard.pending_orders')} value={o?.pendingOrders || 0} sub="بانتظار الإعداد" icon={Clock} gradient={o?.pendingOrders > 5 ? 'gradient-amber' : 'gradient-rose'} />
        <StatCard title={t('dashboard.active_tables')} value={`${o?.tablesOccupied || 0}/${o?.totalTables || 0}`} sub="مشغولة / إجمالي" icon={Table2} gradient="gradient-purple" />
      </div>

      {salesData?.byDay?.length > 0 && (
        <div className="glass-dark rounded-2xl p-5 animate-fade-in">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" />
            {t('dashboard.sales_chart')}
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={salesData.byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {data?.recentOrders?.length > 0 && (
        <div className="glass-dark rounded-2xl p-5 animate-fade-in">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-emerald-400" />
            {t('dashboard.recent_orders')}
          </h2>
          <div className="space-y-1">
            {data.recentOrders.slice(0, 8).map((order: any, i: number) => (
              <div key={order.id} className={`flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/5 transition-all duration-200 animate-fade-in`} style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white">#{String(order.orderNumber).slice(-3)}</span>
                  <div>
                    <span className="text-sm font-medium text-white">{order.customerName || `طاولة ${order.table?.number || '-'}`}</span>
                    {order.table && <span className="text-xs text-slate-500 mr-2">{t('consumer.table')} {order.table.number}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${order.status === 'DELIVERED' ? 'bg-emerald-900/40 text-emerald-400' : order.status === 'PREPARING' ? 'bg-amber-900/40 text-amber-400' : order.status === 'READY' ? 'bg-blue-900/40 text-blue-400' : order.status === 'CANCELLED' ? 'bg-red-900/40 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                    {order.status === 'DELIVERED' ? t('orders.delivered') : order.status === 'PREPARING' ? t('orders.preparing') : order.status === 'READY' ? t('orders.ready') : order.status === 'CANCELLED' ? t('orders.cancelled') : order.status === 'PENDING' ? t('orders.pending') : order.status}
                  </span>
                  <span className="text-sm text-emerald-400 font-medium">{order.total?.toLocaleString()} {t('currency')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
