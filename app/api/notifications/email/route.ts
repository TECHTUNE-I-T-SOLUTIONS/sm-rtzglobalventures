import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId, email, subject, body, templateType, metadata } = await request.json()

    if (!email || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Insert email notification into database
    const { data, error } = await supabase
      .from("email_notifications")
      .insert([
        {
          user_id: userId,
          email,
          subject,
          body,
          template_type: templateType || "general",
          metadata: metadata || {},
        },
      ])
      .select()

    if (error) throw error

    // In a real implementation, you would trigger the Supabase Edge Function here
    // For now, we'll simulate sending the email
    console.log("Email notification queued:", data[0])

    return NextResponse.json({ success: true, notification: data[0] })
  } catch (error: any) {
    console.error("Error creating email notification:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")

    let query = supabase.from("email_notifications").select("*").order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ notifications: data })
  } catch (error: any) {
    console.error("Error fetching email notifications:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
