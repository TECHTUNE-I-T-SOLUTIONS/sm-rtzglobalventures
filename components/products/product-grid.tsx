"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Eye, Heart } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import Link from "next/link"
import Image from "next/image"
import { Product } from "@/types/product"

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  const { addItem, items } = useCart()

  if (products.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border">
        <h3 className="text-lg font-semibold mb-2">No products found</h3>
        <p className="text-muted-foreground">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product, index) => {
        const isInCart = items.some(item => item.product_id === product.id)
        
        return (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="group hover:shadow-lg transition-all duration-300 bg-card border h-full flex flex-col">
              <CardContent className="p-4 flex-1">
                <div className="relative overflow-hidden rounded-lg mb-4">
                  <Image
                    src={
                      product.image_url ||
                      `/placeholder.svg?height=200&width=200&query=${product.category || "/placeholder.svg"}+${product.name}`
                    }
                    alt={product.name}
                    width={200}
                    height={200}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        product.category === "computers"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      }`}
                    >
                      {product.category === "computers" ? "Tech" : "Books"}
                    </span>
                    {isInCart && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        In Cart
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-primary">₦{product.price.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">
                  {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
                </span>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <div className="flex gap-2 w-full">
                <Link href={`/products/${product.category}/${product.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </Link>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => addItem({ id: product.id, name: product.name, price: product.price, quantity: 1, image: product.image_url }, 'product')}
                  disabled={product.stock_quantity === 0}
                  variant={isInCart ? "secondary" : "default"}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {isInCart ? "In Cart" : "Add to Cart"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      )
    })}
    </div>
  )
}
