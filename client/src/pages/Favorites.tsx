import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import { favoritesApi, cartApi } from '../lib/api'
import { useCartStore } from '../store'
import { getLocalizedField, formatPrice } from '../lib/utils'

interface FavoriteItem {
  id: number
  product_id: number
  name_en: string
  name_zh: string
  name_ja: string
  name_ko: string
  name_ru: string
  price: number
  images: string[]
  status: string
  seller_name: string
}

export default function Favorites() {
  const { t, i18n } = useTranslation()
  const { addItem } = useCartStore()
  const [items, setItems] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      const response = await favoritesApi.getAll()
      setItems(response.data.items)
    } catch (error) {
      console.error('Fetch favorites error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (productId: number) => {
    try {
      await favoritesApi.remove(productId)
      setItems(items.filter((item) => item.product_id !== productId))
    } catch (error) {
      console.error('Remove favorite error:', error)
    }
  }

  const handleAddToCart = async (item: FavoriteItem) => {
    try {
      await cartApi.add(item.product_id, 1)
      addItem({
        id: Date.now(),
        product_id: item.product_id,
        quantity: 1,
        name_en: item.name_en,
        name_zh: item.name_zh,
        name_ja: item.name_ja,
        name_ko: item.name_ko,
        name_ru: item.name_ru,
        price: item.price,
        images: item.images,
        stock: 100,
        seller_name: item.seller_name,
      })
      alert(t('cart.itemAdded'))
    } catch (error) {
      console.error('Add to cart error:', error)
    }
  }

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
          <Heart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('favorites.empty')}</h2>
          <p className="text-gray-600 mb-8">Save items you love to your favorites</p>
          <Link to="/products" className="btn-primary">
            {t('cart.continueShopping')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('favorites.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div key={item.id} className="card-hover group">
            <Link to={`/products/${item.product_id}`}>
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                  src={item.images?.[0] || '/placeholder-product.png'}
                  alt={getLocalizedField(item, 'name', i18n.language)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleRemove(item.product_id)
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
                  {getLocalizedField(item, 'name', i18n.language)}
                </h3>
                <p className="text-lg font-bold text-primary-600 mb-3">
                  {formatPrice(item.price)}
                </p>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAddToCart(item)
                  }}
                  disabled={item.status === 'sold_out'}
                  className="w-full btn-secondary py-2 flex items-center justify-center"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {item.status === 'sold_out' ? t('product.outOfStock') : t('favorites.addToCart')}
                </button>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
