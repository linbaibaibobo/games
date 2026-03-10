import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart, ShoppingCart, Share2, Truck, Shield, RotateCcw, ChevronLeft, ChevronRight, Star, Store } from 'lucide-react'
import { productsApi, cartApi, favoritesApi } from '../lib/api'
import { useAuthStore, useCartStore } from '../store'
import { getLocalizedField, formatPrice } from '../lib/utils'

interface Product {
  id: number
  name_en: string
  name_zh: string
  name_ja: string
  name_ko: string
  name_ru: string
  description_en: string
  description_zh: string
  description_ja: string
  description_ko: string
  description_ru: string
  price: number
  original_price?: number
  stock: number
  images: string[]
  status: string
  view_count: number
  seller_id: number
  seller_name: string
  seller_avatar?: string
  category_name_en: string
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { addItem } = useCartStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productsApi.getById(parseInt(id!))
        setProduct(response.data.product)

        if (isAuthenticated) {
          const favResponse = await favoritesApi.check(parseInt(id!))
          setIsFavorite(favResponse.data.isFavorite)
        }
      } catch (error) {
        console.error('Fetch product error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, isAuthenticated])

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!product) return

    setIsAddingToCart(true)
    try {
      await cartApi.add(product.id, quantity)
      addItem({
        id: Date.now(),
        product_id: product.id,
        quantity,
        name_en: product.name_en,
        name_zh: product.name_zh,
        name_ja: product.name_ja,
        name_ko: product.name_ko,
        name_ru: product.name_ru,
        price: product.price,
        images: product.images,
        stock: product.stock,
        seller_name: product.seller_name,
      })
      alert(t('cart.itemAdded'))
    } catch (error) {
      console.error('Add to cart error:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!product) return

    try {
      if (isFavorite) {
        await favoritesApi.remove(product.id)
        setIsFavorite(false)
      } else {
        await favoritesApi.add(product.id)
        setIsFavorite(true)
      }
    } catch (error) {
      console.error('Toggle favorite error:', error)
    }
  }

  const handleBuyNow = async () => {
    await handleAddToCart()
    navigate('/cart')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-center text-gray-500">Product not found</p>
      </div>
    )
  }

  const name = getLocalizedField(product, 'name', i18n.language)
  const description = getLocalizedField(product, 'description', i18n.language)
  const hasDiscount = product.original_price && product.original_price > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500 mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center hover:text-gray-700">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </button>
        <span className="mx-2">/</span>
        <span>{product.category_name_en}</span>
        <span className="mx-2">/</span>
        <span className="text-gray-900 truncate max-w-xs">{name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
            <img
              src={product.images?.[currentImageIndex] || '/placeholder-product.png'}
              alt={name}
              className="w-full h-full object-cover"
            />
            {hasDiscount && (
              <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">
                -{discountPercent}%
              </div>
            )}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    currentImageIndex === index ? 'border-primary-500' : 'border-transparent'
                  }`}
                >
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Title & Rating */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{name}</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
                <span className="ml-2 text-sm text-gray-600">(4.5)</span>
              </div>
              <span className="text-sm text-gray-500">{product.view_count} views</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline space-x-3">
            <span className="text-4xl font-bold text-primary-600">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xl text-gray-400 line-through">
                {formatPrice(product.original_price!)}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed">{description}</p>

          {/* Stock Status */}
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
              {product.stock > 0 ? t('product.inStock') : t('product.outOfStock')}
            </span>
            {product.stock > 0 && <span className="text-gray-500">({product.stock} available)</span>}
          </div>

          {/* Quantity */}
          {product.stock > 0 && (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">{t('product.quantity')}</span>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((prev) => Math.min(product.stock, prev + 1))}
                  className="px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || product.stock === 0}
              className="flex-1 btn-primary py-4 text-lg"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {isAddingToCart ? t('common.loading') : t('product.addToCart')}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="flex-1 bg-secondary-500 text-white hover:bg-secondary-600 py-4 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {t('product.buyNow')}
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`p-4 rounded-lg border-2 transition-colors ${
                isFavorite
                  ? 'border-red-500 text-red-500 bg-red-50'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button className="p-4 rounded-lg border-2 border-gray-300 text-gray-600 hover:border-gray-400 transition-colors">
              <Share2 className="h-6 w-6" />
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="flex flex-col items-center text-center">
              <Truck className="h-6 w-6 text-primary-500 mb-2" />
              <span className="text-xs text-gray-600">Free Shipping</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Shield className="h-6 w-6 text-primary-500 mb-2" />
              <span className="text-xs text-gray-600">Secure Payment</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <RotateCcw className="h-6 w-6 text-primary-500 mb-2" />
              <span className="text-xs text-gray-600">Easy Returns</span>
            </div>
          </div>

          {/* Seller Info */}
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
              {product.seller_avatar ? (
                <img src={product.seller_avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <Store className="h-6 w-6 text-primary-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="font-medium text-gray-900">{product.seller_name}</p>
              <p className="text-sm text-gray-500">{t('product.seller')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
