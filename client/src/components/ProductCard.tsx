import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { useAuthStore, useCartStore } from '../store'
import { cartApi, favoritesApi } from '../lib/api'
import { getLocalizedField, formatPrice } from '../lib/utils'
import { useState } from 'react'

interface Product {
  id: number
  name_en: string
  name_zh: string
  name_ja: string
  name_ko: string
  name_ru: string
  price: number
  original_price?: number
  images: string[]
  status: string
  view_count: number
  seller_name: string
}

interface ProductCardProps {
  product: Product
  isFavorite?: boolean
  onFavoriteChange?: () => void
}

export default function ProductCard({ product, isFavorite = false, onFavoriteChange }: ProductCardProps) {
  const { t, i18n } = useTranslation()
  const { isAuthenticated } = useAuthStore()
  const { addItem } = useCartStore()
  const [favorite, setFavorite] = useState(isFavorite)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const name = getLocalizedField(product, 'name', i18n.language)
  const image = product.images?.[0] || '/placeholder-product.png'
  const hasDiscount = product.original_price && product.original_price > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }

    setIsAddingToCart(true)
    try {
      await cartApi.add(product.id, 1)
      addItem({
        id: Date.now(),
        product_id: product.id,
        quantity: 1,
        name_en: product.name_en,
        name_zh: product.name_zh,
        name_ja: product.name_ja,
        name_ko: product.name_ko,
        name_ru: product.name_ru,
        price: product.price,
        images: product.images,
        stock: 100,
        seller_name: product.seller_name,
      })
      alert(t('cart.itemAdded'))
    } catch (error) {
      console.error('Add to cart error:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }

    try {
      if (favorite) {
        await favoritesApi.remove(product.id)
        setFavorite(false)
      } else {
        await favoritesApi.add(product.id)
        setFavorite(true)
      }
      onFavoriteChange?.()
    } catch (error) {
      console.error('Toggle favorite error:', error)
    }
  }

  return (
    <div className="card-hover group">
      <Link to={`/products/${product.id}`}>
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{discountPercent}%
            </div>
          )}
          {/* Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
              favorite
                ? 'bg-red-500 text-white'
                : 'bg-white/80 text-gray-600 hover:bg-white'
            }`}
          >
            <Heart className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} />
          </button>
          {/* Quick Add Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || product.status === 'sold_out'}
            className="absolute bottom-0 left-0 right-0 bg-primary-500 text-white py-3 font-medium translate-y-full group-hover:translate-y-0 transition-transform duration-200 flex items-center justify-center space-x-2 disabled:bg-gray-400"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>
              {product.status === 'sold_out'
                ? t('product.outOfStock')
                : isAddingToCart
                ? t('common.loading')
                : t('product.addToCart')}
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
            {name}
          </h3>
          <div className="flex items-center space-x-1 mb-2">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">4.5</span>
            <span className="text-sm text-gray-400">({product.view_count} views)</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-primary-600">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(product.original_price!)}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{product.seller_name}</p>
        </div>
      </Link>
    </div>
  )
}
