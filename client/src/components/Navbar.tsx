import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  Store,
  Globe,
  ChevronDown,
  LogOut,
  Package,
} from 'lucide-react'
import { useAuthStore, useCartStore } from '../store'
import { cn } from '../lib/utils'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
]

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { totalItems } = useCartStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode)
    setIsLangOpen(false)
  }

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/products', label: t('nav.products') },
  ]

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10 text-sm">
            <p className="hidden sm:block">{t('app.tagline')}</p>
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center space-x-1 hover:text-primary-100 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  <span>{languages.find((l) => l.code === i18n.language)?.name || 'English'}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                {isLangOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg py-1 z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={cn(
                          'w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2',
                          i18n.language === lang.code
                            ? 'text-primary-600 font-medium'
                            : 'text-gray-700'
                        )}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-primary-500 text-white p-2 rounded-lg">
              <Store className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              {t('app.name')}
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('nav.search')}
                className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-primary-500 transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>

          {/* Right Navigation */}
          <div className="flex items-center space-x-4">
            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center space-x-6">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    cn(
                      'text-sm font-medium transition-colors',
                      isActive
                        ? 'text-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-600 hover:text-primary-500 transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs font-bold h-5 w-5 flex items-center justify-center rounded-full">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* Favorites */}
            {isAuthenticated && (
              <Link
                to="/favorites"
                className="hidden sm:block p-2 text-gray-600 hover:text-primary-500 transition-colors"
              >
                <Heart className="h-6 w-6" />
              </Link>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900">
                  <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {t('nav.profile')}
                  </Link>
                  {user?.role === 'seller' && (
                    <Link
                      to="/seller"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <Store className="h-4 w-4 mr-2" />
                        {t('nav.seller')}
                      </div>
                    </Link>
                  )}
                  <Link
                    to="/orders"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      {t('nav.orders')}
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('nav.logout')}
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 space-y-3">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="md:hidden">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('nav.search')}
                  className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </form>

            {/* Mobile Nav Links */}
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block py-2 text-base font-medium',
                    isActive ? 'text-primary-600' : 'text-gray-600'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}

            {isAuthenticated && (
              <>
                <NavLink
                  to="/favorites"
                  onClick={() => setIsMenuOpen(false)}
                  className="block py-2 text-base font-medium text-gray-600"
                >
                  {t('nav.favorites')}
                </NavLink>
                <NavLink
                  to="/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="block py-2 text-base font-medium text-gray-600"
                >
                  {t('nav.orders')}
                </NavLink>
              </>
            )}

            {!isAuthenticated && (
              <div className="pt-3 border-t border-gray-200 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-center py-2 text-base font-medium text-gray-600 border border-gray-300 rounded-lg"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-center py-2 text-base font-medium text-white bg-primary-500 rounded-lg"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
