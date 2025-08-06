"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "./use-auth"
import toast from "react-hot-toast"

interface WishlistItem {
  id: string
  product_id: string
  created_at: string
  product: {
    id: string
    name: string
    price: number
    image_url: string | null
    category: string
    stock_quantity: number
    is_active: boolean
  }
}

export function useWishlist() {
  const { user } = useAuthStore()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchWishlist()
    } else {
      setItems([])
      setLoading(false)
    }
  }, [user])

  const fetchWishlist = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select(`
          *,
          product:products (
            id,
            name,
            price,
            image_url,
            category,
            stock_quantity,
            is_active
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error("Error fetching wishlist:", error)
    } finally {
      setLoading(false)
    }
  }

  const addToWishlist = async (productId: string) => {
    if (!user) {
      toast.error("Please login to add items to wishlist")
      return false
    }

    try {
      const { error } = await supabase.from("wishlist_items").insert([{ user_id: user.id, product_id: productId }])

      if (error) {
        if (error.code === "23505") {
          toast.error("Item already in wishlist")
          return false
        }
        throw error
      }

      toast.success("Added to wishlist")
      fetchWishlist()
      return true
    } catch (error: any) {
      console.error("Error adding to wishlist:", error)
      toast.error(error.message || "Failed to add to wishlist")
      return false
    }
  }

  const removeFromWishlist = async (productId: string) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId)

      if (error) throw error

      toast.success("Removed from wishlist")
      fetchWishlist()
      return true
    } catch (error: any) {
      console.error("Error removing from wishlist:", error)
      toast.error(error.message || "Failed to remove from wishlist")
      return false
    }
  }

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.product_id === productId)
  }

  const clearWishlist = async () => {
    if (!user) return false

    try {
      const { error } = await supabase.from("wishlist_items").delete().eq("user_id", user.id)

      if (error) throw error

      toast.success("Wishlist cleared")
      setItems([])
      return true
    } catch (error: any) {
      console.error("Error clearing wishlist:", error)
      toast.error(error.message || "Failed to clear wishlist")
      return false
    }
  }

  return {
    items,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    refetch: fetchWishlist,
  }
}
