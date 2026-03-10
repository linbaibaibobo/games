import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react'
import { productsApi } from '../../lib/api'
import { getLocalizedField, formatPrice } from '../../lib/utils'

interface Product {
  id: number
  name_en: string
  name_zh: string
  name_ja: string
  name_ko: string
  name_ru: string
  price: number
  stock: number
  status: string
  images: string[]
  category_name: string
}

export default function SellerProducts() {
  const { t, i18n } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getMyProducts()
      setProducts(response.data.products)
    } catch (error) {
      console.error('Fetch products error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('seller.deleteConfirm'))) return
    try {
      await productsApi.delete(id)
      setProducts(products.filter((p) => p.id !== id))
    } catch (error) {
      console.error('Delete product error:', error)
    }
  }

  const filteredProducts = products.filter((product) =>
    getLocalizedField(product, 'name', i18n.language)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">{t('product.status.active')}</span>
      case 'inactive':
        return <span className="badge badge-secondary">{t('product.status.inactive')}</span>
      case 'sold_out':
        return <span className="badge badge-danger">{t('product.status.soldOut')}</span>
      default:
        return <span className="badge badge-secondary">{status}</span>
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('seller.products')}</h1>
        <Link to="/seller/products/add" className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          {t('seller.addProduct')}
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="input pl-10"
          />
        </div>
        <button className="btn-secondary flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </button>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={product.images?.[0] || '/placeholder-product.png'}
                          alt={getLocalizedField(product, 'name', i18n.language)}
                          className="h-12 w-12 object-cover rounded-lg"
                        />
                        <div className="ml-4">
                          <p className="font-medium text-gray-900 line-clamp-1">
                            {getLocalizedField(product, 'name', i18n.language)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.category_name}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/seller/products/edit/${product.id}`}
                          className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  )
}
