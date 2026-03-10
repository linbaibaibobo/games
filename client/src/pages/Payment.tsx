import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CreditCard, Wallet, MessageCircle, Apple, Check, Shield, Lock } from 'lucide-react'
import { paymentApi, ordersApi } from '../lib/api'

const paymentMethods = [
  { id: 'visa', name: 'Visa / Mastercard', icon: CreditCard, color: 'bg-blue-500' },
  { id: 'wechat', name: 'WeChat Pay', icon: MessageCircle, color: 'bg-green-500' },
  { id: 'alipay', name: 'Alipay', icon: Wallet, color: 'bg-blue-400' },
  { id: 'applepay', name: 'Apple Pay', icon: Apple, color: 'bg-gray-800' },
]

export default function Payment() {
  const { orderId } = useParams<{ orderId: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [selectedMethod, setSelectedMethod] = useState('visa')
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      await paymentApi.process({
        order_id: parseInt(orderId!),
        payment_method: selectedMethod,
        payment_details: cardData,
      })
      alert(t('payment.success'))
      navigate('/orders')
    } catch (error) {
      console.error('Payment error:', error)
      alert(t('payment.failed'))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('payment.title')}</h1>

      <div className="card p-8">
        {/* Payment Methods */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h2>
          <div className="grid grid-cols-2 gap-4">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`flex items-center p-4 border-2 rounded-xl transition-all ${
                  selectedMethod === method.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`${method.color} text-white p-2 rounded-lg mr-3`}>
                  <method.icon className="h-5 w-5" />
                </div>
                <span className="font-medium text-gray-900">{method.name}</span>
                {selectedMethod === method.id && (
                  <Check className="h-5 w-5 text-primary-500 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Card Form */}
        {selectedMethod === 'visa' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={cardData.number}
                  onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  value={cardData.expiry}
                  onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVV
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={cardData.cvv}
                    onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                    placeholder="123"
                    maxLength={4}
                    className="input pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                value={cardData.name}
                onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                placeholder="John Doe"
                className="input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full btn-primary py-4 text-lg flex items-center justify-center"
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('payment.processing')}
                </span>
              ) : (
                <>
                  <Shield className="h-5 w-5 mr-2" />
                  {t('payment.pay')}
                </>
              )}
            </button>
          </form>
        )}

        {/* Other Payment Methods */}
        {selectedMethod !== 'visa' && (
          <div className="text-center py-8">
            <div className="bg-gray-50 rounded-xl p-8 mb-6">
              <p className="text-gray-600 mb-4">
                You will be redirected to {paymentMethods.find(m => m.id === selectedMethod)?.name} to complete your payment.
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Secure payment processing</span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="w-full btn-primary py-4 text-lg"
            >
              {isProcessing ? t('payment.processing') : `Pay with ${paymentMethods.find(m => m.id === selectedMethod)?.name}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
