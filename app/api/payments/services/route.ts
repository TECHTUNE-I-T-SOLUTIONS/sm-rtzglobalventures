import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { initializePaystackPayment, generateReference } from "@/lib/paystack";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { service_id } = await req.json();

  if (!service_id) {
    return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: service, error: serviceError } = await supabase
    .from("business_services")
    .select("*, profiles(*)")
    .eq("id", service_id)
    .single();

  if (serviceError || !service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  if (service.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reference = generateReference();
  const callback_url = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/services?service_id=${service.id}`;

  try {
    const paymentData = await initializePaystackPayment({
      email: service.profiles.email,
      amount: service.price,
      reference,
      callback_url,
      metadata: {
        service_id: service.id,
        user_id: user.id,
      },
    });

    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        service_id: service.id,
        amount: service.price,
        payment_provider: "paystack",
        payment_reference: reference,
        status: "pending",
      })
      .select()
      .single();

    if (transactionError) {
      throw transactionError;
    }

    return NextResponse.json({ authorization_url: paymentData.authorization_url });
  } catch (error) {
    console.error("Payment initialization failed:", error);
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
  }
}
