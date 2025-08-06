export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: "computers" | "books"
  subcategory: string | null
  image_url: string | null
  stock_quantity: number
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
} 