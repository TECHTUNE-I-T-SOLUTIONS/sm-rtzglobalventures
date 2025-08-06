import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const status = searchParams.get("status")

    let query = supabase.from("products").select("*").order("created_at", { ascending: false })

    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (status && status !== "all") {
      query = query.eq("is_active", status === "active")
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ products: data })
  } catch (error: any) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, category, image_url, stock_quantity, specifications } = body

    if (!name || !price || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name,
          description,
          price: Number.parseFloat(price),
          category,
          image_url,
          stock_quantity: Number.parseInt(stock_quantity) || 0,
          specifications: specifications || {},
          is_active: true,
        },
      ])
      .select()

    if (error) throw error

    return NextResponse.json({ product: data[0] })
  } catch (error: any) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
