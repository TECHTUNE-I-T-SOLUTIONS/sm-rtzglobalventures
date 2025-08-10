"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/hooks/use-auth"
import toast from "react-hot-toast"

interface ProductItem {
  id: string
  name: string
  price: number
  image_url: string | null
  stock_quantity: number
}

interface EbookItem {
  id: string
  title: string
  price: number
  cover_image_url: string | null
}

interface CartItem {
  id: string
  user_id: string
  product_id: string | null
  ebook_id: string | null
  quantity: number
  created_at: string
  updated_at: string
  products?: ProductItem // Optional, will be present if product_id is not null
  ebooks?: EbookItem // Optional, will be present if ebook_id is not null
}

interface CartContextType {
  items: CartItem[]
  loading: boolean
  totalItems: number
  totalPrice: number
  addItem: (item: { id: string; name: string; price: number; quantity: number; image: string | null }, type: 'product' | 'ebook') => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
  getFreeEbook: (ebook: any) => Promise<void>
  removeCartItemsByIds: (itemIds: string[]) => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
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
          products (id, name, price, image_url, stock_quantity),
          ebooks (id, title, price, cover_image_url)
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

  const addItem = async (item: { id: string; name: string; price: number; quantity: number; image: string | null }, type: 'product' | 'ebook') => {
    if (!user) {
      toast.error("Please log in to add items to cart")
      return
    }

    try {
      const existingItem = items.find(i => 
        (type === 'product' && i.product_id === item.id) || 
        (type === 'ebook' && i.ebook_id === item.id)
      )

      if (existingItem) {
        const newQuantity = existingItem.quantity + item.quantity
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: newQuantity })
          .eq("id", existingItem.id)

        if (error) throw error
        toast.success("Cart updated!")
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({
            user_id: user.id,
            product_id: type === 'product' ? item.id : null,
            ebook_id: type === 'ebook' ? item.id : null,
            quantity: item.quantity
          })

        if (error) throw error
        toast.success("Added to cart!")
      }

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

  const refreshCart = async () => {
    await fetchCart()
  }

  const removeCartItemsByIds = async (itemIds: string[]) => {
    if (!user || itemIds.length === 0) return

    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .in("id", itemIds)

      if (error) throw error
      toast.success("Selected items removed from cart")
      await fetchCart()
    } catch (error: any) {
      console.error("Error removing cart items:", error)
      toast.error(error.message || "Failed to remove items from cart")
    }
  }

  const getFreeEbook = async (ebook: any) => {
    if (!user) {
      toast.error("Please log in to acquire free ebooks.")
      return
    }
    try {
      const { error } = await supabase.from("acquired_ebooks").insert({
        user_id: user.id,
        ebook_id: ebook.id,
      })
      if (error && error.code !== '23505') { // 23505 is unique violation, meaning ebook already acquired
        throw error
      }
      window.open(ebook.file_url, "_blank")
      toast.success(`You can now download ${ebook.title}`)
    } catch (error: any) {
      console.error("Error acquiring free ebook:", error)
      toast.error(error.message || "Failed to acquire free ebook.")
    }
  }

  const totalItems = items
    .filter(item => item)
    .reduce((total, item) => total + item.quantity, 0);

  const totalPrice = items
    .filter(item => item && (item.products || item.ebooks))
    .reduce((total, item) => {
      const price = item.products?.price || item.ebooks?.price || 0;
      return total + (price * item.quantity);
    }, 0);

  useEffect(() => {
    fetchCart()
  }, [user])

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        refreshCart,
        getFreeEbook,
        removeCartItemsByIds
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
