import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Truck, CreditCard, ArrowRight } from 'lucide-react'
import { cartApi, ordersApi } from '../lib/api'
import { useCartStore } from '../store'
import { formatPrice, getLocalizedField } from '../lib/utils'

interface CartItem {
  id: number
  product_id: number
  quantity: number
  name_en: string
  name_zh: string
  name_ja: string
  name_ko: string
  name_ru: string
  price: number
  images: string[]
  seller_name: string
}

export default function Checkout() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { items, totalAmount, clearCart } = useCartStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
  })

  const shipping = totalAmount > 50 ? 0 : 5.99
  const total = totalAmount + shipping

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const shippingAddress = `${formData.name}\n${formData.address}\n${formData.city}, ${formData.country} ${formData.postalCode}`

      const response = await ordersApi.create({
        shipping_address: shippingAddress,
        shipping_name: formData.name,
        shipping_phone: formData.phone,
      })

      clearCart()
      const orderId = response.data.orders[0]?.id
      navigate(`/payment/${orderId}`)
    } catch (error) {
      console.error('Create order error:', error)
      alert('Failed to create order')
    } finally {
      setIsLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <button onClick={() => navigate('/products')} className="btn-primary">
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Shipping Form */}
        <div className="flex-1">
          <div className="card p-8">
            <div className="flex items-center mb-6">
              <MapPin className="h-6 w-6 text-primary-500 mr-3" />
              <h2 className="text-xl font-semibold">Shipping Information</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="input"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="input"
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  className="input"
                  placeholder="123 Main Street, Apt 4B"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                    className="input"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                    className="input"
                    placeholder="United States"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    required
                    className="input"
                    placeholder="10001"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-4 text-lg flex items-center justify-center"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    Continue to Payment
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-96">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>

            {/* Items */}
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
              {items.map((item: CartItem) => (
                <div key={item.id} className="flex gap-4">
                  <img
                    src={item.images?.[0] || '/placeholder-product.png'}
                    alt={getLocalizedField(item, 'name', i18n.language)}
                    className="h-16 w-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {getLocalizedField(item, 'name', i18n.language)}
                    </p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium text-primary-600">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span className="flex items-center">
                  <Truck className="h-4 w-4 mr-2" />
                  Shipping
                </span>
                <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-semibold border-t border-gray-200 pt-4">
                <span>Total</span>
                <span className="text-primary-600">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
