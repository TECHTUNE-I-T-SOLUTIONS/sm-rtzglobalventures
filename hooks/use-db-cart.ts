"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "./use-auth"
import toast from "react-hot-toast"

interface CartItem {
  id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
  products: {
    id: string
    name: string
    price: number
    image_url: string | null
    stock_quantity: number
  }
}

interface CartState {
  items: CartItem[]
  loading: boolean
  addItem: (productId: string, quantity?: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  getTotalItems: () => number
  getTotalPrice: () => number
  refreshCart: () => Promise<void>
}

export function useDBCart() {
  const { user } = useAuthStore()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCart = async () => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          products (
            id,
            name,
            price,
            image_url,
            stock_quantity
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error("Error fetching cart:", error)
      toast.error("Failed to load cart")
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (productId: string, quantity = 1) => {
    if (!user) {
      toast.error("Please log in to add items to cart")
      return
    }

    try {
      // Check if item already exists in cart
      const existingItem = items.find(item => item.product_id === productId)

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: newQuantity })
          .eq("id", existingItem.id)

        if (error) throw error
        toast.success("Cart updated!")
      } else {
        // Add new item
        const { error } = await supabase
          .from("cart_items")
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity
          })

        if (error) throw error
        toast.success("Added to cart!")
      }

      // Refresh cart
      await fetchCart()
    } catch (error: any) {
      console.error("Error adding to cart:", error)
      toast.error(error.message || "Failed to add to cart")
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId)

      if (error) throw error
      toast.success("Removed from cart")
      await fetchCart()
    } catch (error: any) {
      console.error("Error removing from cart:", error)
      toast.error(error.message || "Failed to remove from cart")
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId)
      return
    }

    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", itemId)

      if (error) throw error
      await fetchCart()
    } catch (error: any) {
      console.error("Error updating quantity:", error)
      toast.error(error.message || "Failed to update quantity")
    }
  }

  const clearCart = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)

      if (error) throw error
      setItems([])
      toast.success("Cart cleared")
    } catch (error: any) {
      console.error("Error clearing cart:", error)
      toast.error(error.message || "Failed to clear cart")
    }
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.products.price * item.quantity), 0)
  }

  const refreshCart = async () => {
    await fetchCart()
  }

  useEffect(() => {
    fetchCart()
  }, [user])

  return {
    items,
    loading,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    refreshCart
  }
} 