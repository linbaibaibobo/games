import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Package, ShoppingBag, DollarSign, TrendingUp, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { userApi, ordersApi } from '../../lib/api'

interface Stats {
  products: {
    total_products: number
    active_products: number
  }
  orders: {
    total_orders: number
    total_revenue: number
  }
}

export default function SellerDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          userApi.getStats(),
          ordersApi.getAll('seller'),
        ])
        setStats(statsRes.data)
        setRecentOrders(ordersRes.data.orders.slice(0, 5))
      } catch (error) {
        console.error('Fetch dashboard data error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const statCards = [
    {
      title: t('seller.stats.totalProducts'),
      value: stats?.products.total_products || 0,
      icon: Package,
      color: 'bg-blue-500',
      link: '/seller/products',
    },
    {
      title: t('seller.stats.activeProducts'),
      value: stats?.products.active_products || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
      link: '/seller/products',
    },
    {
      title: t('seller.stats.totalOrders'),
      value: stats?.orders.total_orders || 0,
      icon: ShoppingBag,
      color: 'bg-purple-500',
      link: '/seller/orders',
    },
    {
      title: t('seller.stats.totalRevenue'),
      value: `$${(stats?.orders.total_revenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-orange-500',
      link: '/seller/orders',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="card p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} text-white p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/seller/products/add"
            className="btn-primary flex items-center"
          >
            <Package className="h-4 w-4 mr-2" />
            {t('seller.addProduct')}
          </Link>
          <Link
            to="/seller/orders"
            className="btn-secondary flex items-center"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            View Orders
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link
            to="/seller/orders"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
          >
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {recentOrders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No orders yet
            </div>
          ) : (
            recentOrders.map((order: any) => (
              <div key={order.id} className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{order.order_number}</p>
                  <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-primary-600">${order.total_amount}</p>
                  <span className={`badge ${
                    order.status === 'pending' ? 'badge-warning' :
                    order.status === 'paid' ? 'badge-primary' :
                    order.status === 'delivered' ? 'badge-success' :
                    'badge-secondary'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
