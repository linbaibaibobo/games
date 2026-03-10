import { Outlet, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Store,
  ChevronRight,
} from 'lucide-react'
import { cn } from '../lib/utils'

export default function SellerLayout() {
  const { t } = useTranslation()

  const navItems = [
    {
      path: '/seller',
      icon: LayoutDashboard,
      label: t('seller.dashboard'),
    },
    {
      path: '/seller/products',
      icon: Package,
      label: t('seller.products'),
    },
    {
      path: '/seller/orders',
      icon: ShoppingBag,
      label: t('seller.orders'),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Seller Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Store className="h-6 w-6 text-primary-500 mr-2" />
            <h1 className="text-xl font-semibold text-gray-900">
              {t('seller.dashboard')}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/seller'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    )
                  }
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                  <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100" />
                </NavLink>
              ))}
            </nav>

            {/* Back to Shop */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <NavLink
                to="/"
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Store className="h-5 w-5 mr-3" />
                {t('app.name')}
              </NavLink>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
