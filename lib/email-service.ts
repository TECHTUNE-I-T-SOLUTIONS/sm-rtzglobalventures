import { supabase } from "./supabase"

export interface EmailNotification {
  to: string
  subject: string
  html: string
  type: "order_confirmation" | "password_reset" | "welcome" | "order_status"
}

export async function sendEmailNotification(notification: EmailNotification) {
  try {
    // Store email in database for tracking
    const { data, error } = await supabase
      .from("email_notifications")
      .insert([
        {
          recipient_email: notification.to,
          subject: notification.subject,
          html_content: notification.html,
          notification_type: notification.type,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) throw error

    // In a real implementation, you would integrate with an email service like:
    // - Supabase Edge Functions with Resend
    // - SendGrid
    // - AWS SES
    // For now, we'll just log and mark as sent
    console.log("Email notification queued:", notification)

    // Update status to sent
    await supabase
      .from("email_notifications")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", data[0].id)

    return { success: true, id: data[0].id }
  } catch (error) {
    console.error("Error sending email notification:", error)
    return { success: false, error }
  }
}

export function generateOrderConfirmationEmail(orderData: any) {
  return {
    subject: `Order Confirmation #${orderData.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Order Confirmation</h1>
        <p>Thank you for your order! Here are the details:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <h2>Order #${orderData.id}</h2>
          <p><strong>Total:</strong> ₦${orderData.total_amount.toLocaleString()}</p>
          <p><strong>Status:</strong> ${orderData.status}</p>
          <p><strong>Date:</strong> ${new Date(orderData.created_at).toLocaleDateString()}</p>
        </div>
        <p>We'll send you updates as your order progresses.</p>
        <p>Best regards,<br>Sm@rtz Global Enterprise Team</p>
      </div>
    `,
  }
}
