import axios from 'axios'
import { useAuthStore } from '../store'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: {
    email: string
    password: string
    name: string
    role?: string
  }) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
}

// Products API
export const productsApi = {
  getAll: (params?: {
    page?: number
    limit?: number
    category?: number
    search?: string
    minPrice?: number
    maxPrice?: number
    sort?: string
  }) => api.get('/products', { params }),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: FormData) =>
    api.post('/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: number, data: FormData) =>
    api.put(`/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: number) => api.delete(`/products/${id}`),
  getMyProducts: () => api.get('/products/seller/my-products'),
  getCategories: () => api.get('/products/categories/all'),
}

// Cart API
export const cartApi = {
  getAll: () => api.get('/cart'),
  add: (productId: number, quantity: number) =>
    api.post('/cart', { product_id: productId, quantity }),
  update: (id: number, quantity: number) =>
    api.put(`/cart/${id}`, { quantity }),
  remove: (id: number) => api.delete(`/cart/${id}`),
  clear: () => api.delete('/cart'),
}

// Favorites API
export const favoritesApi = {
  getAll: () => api.get('/favorites'),
  add: (productId: number) => api.post('/favorites', { product_id: productId }),
  remove: (productId: number) => api.delete(`/favorites/${productId}`),
  check: (productId: number) => api.get(`/favorites/check/${productId}`),
}

// Orders API
export const ordersApi = {
  getAll: (role?: string) => api.get('/orders', { params: { role } }),
  getById: (id: number) => api.get(`/orders/${id}`),
  create: (data: {
    shipping_address: string
    shipping_name: string
    shipping_phone: string
    cart_item_ids?: number[]
  }) => api.post('/orders', data),
  updateStatus: (id: number, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
  cancel: (id: number) => api.put(`/orders/${id}/cancel`),
}

// Payment API
export const paymentApi = {
  getMethods: () => api.get('/payment/methods'),
  process: (data: {
    order_id: number
    payment_method: string
    payment_details?: any
  }) => api.post('/payment/process', data),
  getStatus: (orderId: number) => api.get(`/payment/status/${orderId}`),
}

// User API
export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: {
    name?: string
    phone?: string
    address?: string
    avatar?: string
  }) => api.put('/users/profile', data),
  changePassword: (data: {
    currentPassword: string
    newPassword: string
  }) => api.put('/users/password', data),
  getStats: () => api.get('/users/stats'),
}

export default api
