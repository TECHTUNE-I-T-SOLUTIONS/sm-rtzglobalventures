import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase.from("products").select("*").eq("id", params.id).single()

    if (error) throw error

    return NextResponse.json({ product: data })
  } catch (error: any) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, description, price, category, image_url, stock_quantity, specifications, is_active } = body

    const { data, error } = await supabase
      .from("products")
      .update({
        name,
        description,
        price: Number.parseFloat(price),
        category,
        image_url,
        stock_quantity: Number.parseInt(stock_quantity),
        specifications: specifications || {},
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()

    if (error) throw error

    return NextResponse.json({ product: data[0] })
  } catch (error: any) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase.from("products").delete().eq("id", params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
