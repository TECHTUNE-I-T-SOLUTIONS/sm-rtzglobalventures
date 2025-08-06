"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function TestDBPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    testDatabase()
  }, [])

  const testDatabase = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log("Testing database connection...")
      
      // Test 1: Get all products
      const { data: allProducts, error: allError } = await supabase
        .from("products")
        .select("*")
      
      if (allError) {
        console.error("Error fetching all products:", allError)
        setError(`All products error: ${allError.message}`)
        return
      }
      
      console.log("All products:", allProducts)
      
      // Test 2: Get computers only
      const { data: computers, error: computersError } = await supabase
        .from("products")
        .select("*")
        .eq("category", "computers")
      
      if (computersError) {
        console.error("Error fetching computers:", computersError)
        setError(`Computers error: ${computersError.message}`)
        return
      }
      
      console.log("Computers:", computers)
      
      // Test 3: Get active products
      const { data: activeProducts, error: activeError } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
      
      if (activeError) {
        console.error("Error fetching active products:", activeError)
        setError(`Active products error: ${activeError.message}`)
        return
      }
      
      console.log("Active products:", activeProducts)
      
      setProducts(allProducts || [])
      
    } catch (err) {
      console.error("Test error:", err)
      setError(`Test error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <h1 className="text-2xl font-bold mb-4">Testing Database Connection...</h1>
        <p>Please wait...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">Database Test Results</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Total Products: {products.length}</h2>
        
        {products.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Products by Category:</h3>
            <ul className="list-disc list-inside">
              {Object.entries(
                products.reduce((acc, product) => {
                  acc[product.category] = (acc[product.category] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              ).map(([category, count]) => (
                <li key={category}>
                  {category}: {count} products
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {products.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Active Products:</h3>
            <p>{products.filter(p => p.is_active).length} out of {products.length} are active</p>
          </div>
        )}
      </div>
      
      {products.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Product Details:</h2>
          <div className="grid gap-4">
            {products.slice(0, 5).map((product) => (
              <div key={product.id} className="p-4 border rounded">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-gray-600">Category: {product.category}</p>
                <p className="text-sm text-gray-600">Price: ₦{product.price}</p>
                <p className="text-sm text-gray-600">Active: {product.is_active ? "Yes" : "No"}</p>
                <p className="text-sm text-gray-600">Stock: {product.stock_quantity}</p>
              </div>
            ))}
            {products.length > 5 && (
              <p className="text-sm text-gray-600">... and {products.length - 5} more products</p>
            )}
          </div>
        </div>
      )}
      
      <button
        onClick={testDatabase}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Again
      </button>
    </div>
  )
} 