import { useState, useEffect } from 'react'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { api } from '../services/api'
import { CreditCard, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from '../i18n/useTranslation'

function PaymentForm({ orderId, amount, onSuccess }: { orderId: string; amount: number; onSuccess: () => void }) {
  const { t } = useTranslation()
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: { return_url: window.location.origin + '/admin/orders' },
      })

      if (error) {
        toast.error(error.message || 'فشل الدفع')
      } else if (paymentIntent?.status === 'succeeded') {
        toast.success('تم الدفع بنجاح!')
        onSuccess()
      }
    } catch {
      toast.error('فشل الدفع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex justify-between items-center pt-2">
        <span className="font-bold text-lg">{amount.toFixed(2)} {t('currency')}</span>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="btn-primary flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {loading ? 'جاري الدفع...' : 'دفع'}
        </button>
      </div>
    </form>
  )
}

export default function StripePayment({ orderId, amount, onSuccess }: { orderId: string; amount: number; onSuccess: () => void }) {
  const [stripePromise, setStripePromise] = useState<any>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        const config = await api.getStripeConfig()
        if (!config.publishableKey) {
          setLoading(false)
          return
        }
        setStripePromise(loadStripe(config.publishableKey))

        const { clientSecret } = await api.createPaymentIntent(orderId)
        setClientSecret(clientSecret)
      } catch {
        // Stripe not configured
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [orderId])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        جاري تهيئة الدفع...
      </div>
    )
  }

  if (!stripePromise || !clientSecret) {
    return (
      <div className="text-sm text-gray-500 py-2">
        الدفع الإلكتروني غير متاح - استخدم الدفع النقدي أو البطاقة
      </div>
    )
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: { colorPrimary: '#22c55e', fontFamily: 'system-ui, sans-serif' },
    },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm orderId={orderId} amount={amount} onSuccess={onSuccess} />
    </Elements>
  )
}
