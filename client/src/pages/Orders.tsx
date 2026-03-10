import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Package, ChevronRight, X } from 'lucide-react'
import { ordersApi } from '../lib/api'
import { formatPrice, formatDate, getLocalizedField } from '../lib/utils'

interface Order {
  id: number
  order_number: string
  total_amount: number
  status: string
  payment_status: string
  created_at: string
  items: OrderItem[]
  seller_name?: string
}

interface OrderItem {
  id: number
  product_name: string
  product_image: string
  price: number
  quantity: number
  name_en: string
  name_zh: string
  name_ja: string
  name_ko: string
  name_ru: string
}

const statusColors: { [key: string]: string } = {
  pending: 'badge-warning',
  paid: 'badge-primary',
  shipped: 'badge-primary',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
  refunded: 'badge-secondary',
}

export default function Orders() {
  const { t, i18n } = useTranslation()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await ordersApi.getAll()
      setOrders(response.data.orders)
    } catch (error) {
      console.error('Fetch orders error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    try {
      await ordersApi.cancel(orderId)
      await fetchOrders()
    } catch (error) {
      console.error('Cancel order error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <Package className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('order.title')}</h2>
          <p className="text-gray-600 mb-8">You haven't placed any orders yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('order.title')}</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="card overflow-hidden">
            {/* Order Header */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    {t('order.orderNumber')}: <span className="font-medium text-gray-900">{order.order_number}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('order.date')}: {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`badge ${statusColors[order.status] || 'badge-secondary'}`}>
                    {t(`order.status.${order.status}`)}
                  </span>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                  >
                    View Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-6">
              <div className="space-y-4">
                {order.items?.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <img
                      src={item.product_image || '/placeholder-product.png'}
                      alt={item.product_name}
                      className="h-20 w-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-primary-600 font-medium">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
                {order.items && order.items.length > 2 && (
                  <p className="text-sm text-gray-500">
                    +{order.items.length - 2} more items
                  </p>
                )}
              </div>

              {/* Order Footer */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">{t('order.total')}</p>
                  <p className="text-2xl font-bold text-primary-600">{formatPrice(order.total_amount)}</p>
                </div>
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t('order.cancel')}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <img
                      src={item.product_image || '/placeholder-product.png'}
                      alt={item.product_name}
                      className="h-24 w-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-primary-600 font-medium">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary-600">{formatPrice(selectedOrder.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
