import { useTranslation } from 'react-i18next'
import { Store, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  const { t } = useTranslation()

  const footerLinks = {
    shop: [
      { label: t('nav.products'), href: '/products' },
      { label: t('nav.categories'), href: '/products' },
      { label: t('nav.favorites'), href: '/favorites' },
    ],
    support: [
      { label: t('nav.orders'), href: '/orders' },
      { label: t('nav.profile'), href: '/profile' },
    ],
    seller: [
      { label: t('seller.dashboard'), href: '/seller' },
      { label: t('seller.products'), href: '/seller/products' },
    ],
  }

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-primary-500 text-white p-2 rounded-lg">
                <Store className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-white">
                {t('app.name')}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              {t('app.tagline')}
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-primary-400" />
                <span>support@globalshop.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-primary-400" />
                <span>+1 234 567 890</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-primary-400" />
                <span>Global Shopping Center</span>
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('nav.products')}</h3>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Seller Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('nav.seller')}</h3>
            <ul className="space-y-2">
              {footerLinks.seller.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} {t('app.name')}. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <span className="text-sm text-gray-500">Payment Methods:</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-gray-800 px-2 py-1 rounded">Visa</span>
              <span className="text-xs bg-gray-800 px-2 py-1 rounded">WeChat</span>
              <span className="text-xs bg-gray-800 px-2 py-1 rounded">Alipay</span>
              <span className="text-xs bg-gray-800 px-2 py-1 rounded">Apple Pay</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
