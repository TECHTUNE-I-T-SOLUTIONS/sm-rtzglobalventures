"use client"

import { create } from "zustand"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image_url?: string
}

interface CartState {
  items: CartItem[]
  addItem: (productId: string, quantity?: number) => Promise<void>
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStoreSimple = create<CartState>((set, get) => ({
  items: [],

  addItem: async (productId: string, quantity = 1) => {
    try {
      // Fetch product details from Supabase
      const { supabase } = await import("@/lib/supabase")
      const { data: product, error } = await supabase.from("products").select("*").eq("id", productId).single()

      if (error) throw error

      const existingItem = get().items.find((item) => item.id === productId)

      if (existingItem) {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId ? { ...item, quantity: item.quantity + quantity } : item,
          ),
        }))
      } else {
        const newItem: CartItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
          image_url: product.image_url,
        }
        set((state) => ({ items: [...state.items, newItem] }))
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
    }
  },

  removeItem: (productId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }))
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }

    set((state) => ({
      items: state.items.map((item) => (item.id === productId ? { ...item, quantity } : item)),
    }))
  },

  clearCart: () => {
    set({ items: [] })
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0)
  },

  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
  },
})) 