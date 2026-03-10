import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { productsApi } from '../../lib/api'
import { getLocalizedField } from '../../lib/utils'

interface Category {
  id: number
  name_en: string
  name_zh: string
  name_ja: string
  name_ko: string
  name_ru: string
}

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
  category_id?: number
  status: string
  images: string[]
}

export default function EditProduct() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [newImages, setNewImages] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [removedImages, setRemovedImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name_en: '',
    name_zh: '',
    name_ja: '',
    name_ko: '',
    name_ru: '',
    description_en: '',
    description_zh: '',
    description_ja: '',
    description_ko: '',
    description_ru: '',
    price: '',
    original_price: '',
    stock: '',
    category_id: '',
    status: 'active',
  })

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [productRes, categoriesRes] = await Promise.all([
        productsApi.getById(parseInt(id!)),
        productsApi.getCategories(),
      ])

      const productData = productRes.data.product
      setProduct(productData)
      setExistingImages(productData.images || [])
      setCategories(categoriesRes.data.categories)

      setFormData({
        name_en: productData.name_en || '',
        name_zh: productData.name_zh || '',
        name_ja: productData.name_ja || '',
        name_ko: productData.name_ko || '',
        name_ru: productData.name_ru || '',
        description_en: productData.description_en || '',
        description_zh: productData.description_zh || '',
        description_ja: productData.description_ja || '',
        description_ko: productData.description_ko || '',
        description_ru: productData.description_ru || '',
        price: productData.price?.toString() || '',
        original_price: productData.original_price?.toString() || '',
        stock: productData.stock?.toString() || '',
        category_id: productData.category_id?.toString() || '',
        status: productData.status || 'active',
      })
    } catch (error) {
      console.error('Fetch data error:', error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const totalImages = existingImages.length - removedImages.length + newImages.length + files.length

    if (totalImages > 5) {
      alert('Maximum 5 images allowed')
      return
    }

    setNewImages([...newImages, ...files])

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewImagePreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeExistingImage = (image: string) => {
    setRemovedImages([...removedImages, image])
  }

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index))
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value) data.append(key, value)
      })

      // Add new images
      newImages.forEach((image) => {
        data.append('images', image)
      })

      // Keep existing images that weren't removed
      const keepImages = existingImages.filter((img) => !removedImages.includes(img))
      data.append('keep_images', JSON.stringify(keepImages))

      await productsApi.update(parseInt(id!), data)
      alert('Product updated successfully')
      navigate('/seller/products')
    } catch (error) {
      console.error('Update product error:', error)
      alert('Failed to update product')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const visibleExistingImages = existingImages.filter((img) => !removedImages.includes(img))
  const totalImages = visibleExistingImages.length + newImages.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/seller/products')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{t('seller.editProduct')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Images */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Existing Images */}
            {visibleExistingImages.map((image, index) => (
              <div key={`existing-${index}`} className="relative aspect-square">
                <img
                  src={image}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(image)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {/* New Images */}
            {newImagePreviews.map((preview, index) => (
              <div key={`new-${index}`} className="relative aspect-square">
                <img
                  src={preview}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
                <span className="absolute bottom-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                  New
                </span>
              </div>
            ))}
            {totalImages < 5 && (
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name (English) *
              </label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                required
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name (Chinese)
              </label>
              <input
                type="text"
                value={formData.name_zh}
                onChange={(e) => setFormData({ ...formData, name_zh: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name (Japanese)
              </label>
              <input
                type="text"
                value={formData.name_ja}
                onChange={(e) => setFormData({ ...formData, name_ja: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name (Korean)
              </label>
              <input
                type="text"
                value={formData.name_ko}
                onChange={(e) => setFormData({ ...formData, name_ko: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name (Russian)
              </label>
              <input
                type="text"
                value={formData.name_ru}
                onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Original Price
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.original_price}
                onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock *
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Category & Status */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Category & Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="input"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {getLocalizedField(category, 'name', i18n.language)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                <option value="active">{t('product.status.active')}</option>
                <option value="inactive">{t('product.status.inactive')}</option>
                <option value="sold_out">{t('product.status.soldOut')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (English)
              </label>
              <textarea
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                rows={4}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Chinese)
              </label>
              <textarea
                value={formData.description_zh}
                onChange={(e) => setFormData({ ...formData, description_zh: e.target.value })}
                rows={4}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/seller/products')}
            className="btn-secondary"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? t('common.loading') : t('common.update')}
          </button>
        </div>
      </form>
    </div>
  )
}
