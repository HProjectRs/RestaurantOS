import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { UtensilsCrossed, Eye, EyeOff, LogIn, Lock, Mail, ChefHat, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@cafe.com')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || '/admin'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error(t('login.email') + ' ' + t('login.password'))
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password)
      toast.success(t('login.success'))
      navigate(from, { replace: true })
    } catch (err: any) {
      toast.error(err.message || 'فشل تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-primary-950 to-surface-950 flex items-center justify-center p-5" dir="auto">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary-500/5 to-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-5 rounded-3xl bg-gradient-to-br from-emerald-400 to-primary-600 shadow-2xl shadow-emerald-500/25 animate-bounce-in">
            <UtensilsCrossed size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('app.name')}</h1>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <Sparkles size={14} className="text-emerald-400" />
            <p className="text-surface-400 text-sm">{t('app.tagline')}</p>
            <Sparkles size={14} className="text-emerald-400" />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-4xl p-8 border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center shadow-lg">
              <ChefHat size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t('login.title')}</h2>
              <p className="text-xs text-surface-400">أهلاً بعودتك</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-surface-300 mb-2 block font-medium">{t('login.email')}</label>
              <div className="relative group">
                <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 group-focus-within:text-primary-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 focus:bg-white/10 transition-all duration-200"
                  placeholder="admin@cafe.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-surface-300 mb-2 block font-medium">{t('login.password')}</label>
              <div className="relative group">
                <Lock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 group-focus-within:text-primary-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-3.5 pr-12 pl-12 text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 focus:bg-white/10 transition-all duration-200"
                  placeholder="••••••••"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-l from-primary-600 to-emerald-500 hover:from-primary-700 hover:to-emerald-600 disabled:from-primary-800 disabled:to-emerald-800 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2.5 text-base"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  {t('login.button')}
                </>
              )}
            </button>
          </form>

          {/* Test credentials hint */}
          <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-xs text-surface-400 mb-2 font-medium flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-400" />
              {t('login.test_credentials')}
            </p>
            <div className="space-y-1 text-xs text-surface-500">
              <p className="flex items-center gap-2">
                <span className="badge bg-emerald-500/20 text-emerald-300 border-0">{t('roles.ADMIN')}</span>
                <span dir="ltr" className="text-surface-300">admin@cafe.com</span>
                <span className="text-surface-500">/</span>
                <span dir="ltr" className="text-surface-300">admin123</span>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-surface-600 mt-6 tracking-wide">
          RestaurantOS v2.0 &mdash; {t('app.tagline')}
        </p>
      </div>
    </div>
  )
}
