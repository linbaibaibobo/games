import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Package, ChevronDown, Check, Truck, X } from 'lucide-react'
import { ordersApi } from '../../lib/api'
import { formatPrice, formatDate } from '../../lib/utils'

interface Order {
  id: number
  order_number: string
  total_amount: number
  status: string
  payment_status: string
  created_at: string
  buyer_name: string
  buyer_email: string
  items: OrderItem[]
  shipping_address: string
  shipping_name: string
  shipping_phone: string
}

interface OrderItem {
  id: number
  product_name: string
  product_image: string
  price: number
  quantity: number
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'badge-warning' },
  { value: 'paid', label: 'Paid', color: 'badge-primary' },
  { value: 'shipped', label: 'Shipped', color: 'badge-primary' },
  { value: 'delivered', label: 'Delivered', color: 'badge-success' },
  { value: 'cancelled', label: 'Cancelled', color: 'badge-danger' },
  { value: 'refunded', label: 'Refunded', color: 'badge-secondary' },
]

export default function SellerOrders() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingOrder, setUpdatingOrder] = useState<number | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await ordersApi.getAll('seller')
      setOrders(response.data.orders)
    } catch (error) {
      console.error('Fetch orders error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId: number, status: string) => {
    setUpdatingOrder(orderId)
    try {
      await ordersApi.updateStatus(orderId, status)
      await fetchOrders()
    } catch (error) {
      console.error('Update status error:', error)
    } finally {
      setUpdatingOrder(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find((o) => o.value === status)
    return option ? (
      <span className={`badge ${option.color}`}>{option.label}</span>
    ) : (
      <span className="badge badge-secondary">{status}</span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('seller.orders')}</h1>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No orders yet
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{order.order_number}</p>
                      <p className="text-sm text-gray-500">{order.items?.length || 0} items</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{order.buyer_name}</p>
                      <p className="text-sm text-gray-500">{order.buyer_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-primary-600">{formatPrice(order.total_amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          disabled={updatingOrder === order.id}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {updatingOrder === order.id ? 'Updating...' : option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Order Details</h2>
                <p className="text-sm text-gray-500">{selectedOrder.order_number}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Customer</h3>
                <p className="text-sm text-gray-600">{selectedOrder.buyer_name}</p>
                <p className="text-sm text-gray-600">{selectedOrder.buyer_email}</p>
              </div>

              {/* Shipping Info */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{selectedOrder.shipping_address}</p>
                <p className="text-sm text-gray-600 mt-1">Phone: {selectedOrder.shipping_phone}</p>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Items</h3>
                <div className="space-y-4">
                  {selectedOrder.items?.map((item) => (
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
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
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
