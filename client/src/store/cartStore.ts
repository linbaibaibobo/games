import { create } from 'zustand'

interface CartItem {
  id: number
  product_id: number
  quantity: number
  name_en: string
  name_zh: string
  name_ja: string
  name_ko: string
  name_ru: string
  price: number
  images: string[]
  stock: number
  seller_name: string
}

interface CartState {
  items: CartItem[]
  totalItems: number
  totalAmount: number
  setItems: (items: CartItem[]) => void
  addItem: (item: CartItem) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalItems: 0,
  totalAmount: 0,
  setItems: (items) => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    set({ items, totalItems, totalAmount })
  },
  addItem: (item) => {
    const { items } = get()
    const existingItem = items.find((i) => i.product_id === item.product_id)
    if (existingItem) {
      const updatedItems = items.map((i) =>
        i.product_id === item.product_id
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      )
      get().setItems(updatedItems)
    } else {
      get().setItems([...items, item])
    }
  },
  removeItem: (id) => {
    const { items } = get()
    get().setItems(items.filter((i) => i.id !== id))
  },
  updateQuantity: (id, quantity) => {
    const { items } = get()
    if (quantity <= 0) {
      get().setItems(items.filter((i) => i.id !== id))
    } else {
      get().setItems(
        items.map((i) => (i.id === id ? { ...i, quantity } : i))
      )
    }
  },
  clearCart: () => set({ items: [], totalItems: 0, totalAmount: 0 }),
}))
