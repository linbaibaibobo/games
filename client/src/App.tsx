import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store'
import { authApi } from './lib/api'

// Layouts
import MainLayout from './layouts/MainLayout'
import SellerLayout from './layouts/SellerLayout'

// Pages
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Favorites from './pages/Favorites'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import Checkout from './pages/Checkout'
import Payment from './pages/Payment'

// Seller Pages
import SellerDashboard from './pages/seller/Dashboard'
import SellerProducts from './pages/seller/Products'
import SellerOrders from './pages/seller/Orders'
import AddProduct from './pages/seller/AddProduct'
import EditProduct from './pages/seller/EditProduct'

// Components
import ProtectedRoute from './components/ProtectedRoute'
import SellerRoute from './components/SellerRoute'

function App() {
  const { setAuth, logout } = useAuthStore()

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await authApi.getMe()
        const { user } = response.data
        const token = localStorage.getItem('auth-storage')
          ? JSON.parse(localStorage.getItem('auth-storage')!).state.token
          : null
        if (token) {
          setAuth(user, token)
        }
      } catch (error) {
        logout()
      }
    }

    initAuth()
  }, [setAuth, logout])

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute />}
      >
        <Route element={<MainLayout />}>
          <Route path="cart" element={<Cart />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="orders" element={<Orders />} />
          <Route path="profile" element={<Profile />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="payment/:orderId" element={<Payment />} />
        </Route>

        {/* Seller Routes */}
        <Route element={<SellerRoute />}>
          <Route element={<SellerLayout />}>
            <Route path="seller" element={<SellerDashboard />} />
            <Route path="seller/products" element={<SellerProducts />} />
            <Route path="seller/products/add" element={<AddProduct />} />
            <Route path="seller/products/edit/:id" element={<EditProduct />} />
            <Route path="seller/orders" element={<SellerOrders />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default App
