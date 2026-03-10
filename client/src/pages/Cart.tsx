import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'
import { cartApi } from '../lib/api'
import { useCartStore } from '../store'
import { getLocalizedField, formatPrice } from '../lib/utils'

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
  stock: number
  seller_name: string
}

export default function Cart() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { setItems, clearCart } = useCartStore()
  const [items, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const response = await cartApi.getAll()
      setCartItems(response.data.items)
      setItems(response.data.items)
    } catch (error) {
      console.error('Fetch cart error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (id: number, quantity: number) => {
    setUpdating(id)
    try {
      await cartApi.update(id, quantity)
      await fetchCart()
    } catch (error) {
      console.error('Update quantity error:', error)
    } finally {
      setUpdating(null)
    }
  }

  const handleRemoveItem = async (id: number) => {
    try {
      await cartApi.remove(id)
      await fetchCart()
    } catch (error) {
      console.error('Remove item error:', error)
    }
  }

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return
    try {
      await cartApi.clear()
      clearCart()
      setCartItems([])
    } catch (error) {
      console.error('Clear cart error:', error)
    }
  }

  const handleCheckout = () => {
    navigate('/checkout')
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 50 ? 0 : 5.99
  const total = subtotal + shipping

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('cart.empty')}</h2>
          <p className="text-gray-600 mb-8">Discover amazing products and add them to your cart</p>
          <Link to="/products" className="btn-primary">
            {t('cart.continueShopping')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('cart.title')}</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1">
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {items.length} {items.length === 1 ? 'Item' : 'Items'}
              </h2>
              <button
                onClick={handleClearCart}
                className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t('cart.clear')}
              </button>
            </div>

            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <div key={item.id} className="p-6 flex gap-6">
                  {/* Image */}
                  <Link to={`/products/${item.product_id}`} className="flex-shrink-0">
                    <img
                      src={item.images?.[0] || '/placeholder-product.png'}
                      alt={getLocalizedField(item, 'name', i18n.language)}
                      className="h-24 w-24 object-cover rounded-lg"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.product_id}`}
                      className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2"
                    >
                      {getLocalizedField(item, 'name', i18n.language)}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">{item.seller_name}</p>
                    <p className="text-lg font-semibold text-primary-600 mt-2">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>

                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={updating === item.id || item.quantity <= 1}
                        className="px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-3 py-1 font-medium min-w-[3rem] text-center">
                        {updating === item.id ? '...' : item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={updating === item.id || item.quantity >= item.stock}
                        className="px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center mt-6 text-primary-600 hover:text-primary-700 font-medium"
          >
            {t('cart.continueShopping')}
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:w-96">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between text-gray-600">
                <span>{t('cart.subtotal')}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>{t('cart.shipping')}</span>
                <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className="text-sm text-gray-500">
                  Free shipping on orders over $50
                </p>
              )}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>{t('cart.total')}</span>
                  <span className="text-primary-600">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full btn-primary py-4 text-lg flex items-center justify-center"
            >
              {t('cart.checkout')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Secure checkout with multiple payment options
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
