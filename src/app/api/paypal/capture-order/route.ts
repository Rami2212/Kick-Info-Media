import { NextResponse } from "next/server";
import { getPayPalAccessToken, getPayPalBaseUrl } from "@/lib/paypal";
import { checkRateLimit, enforceSameOrigin } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sameOriginError = enforceSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  const rateLimit = checkRateLimit(req, "paypal-capture-order", 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many payment capture attempts. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  try {
    const body = await req.json();
    const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
    if (!orderId || !/^[A-Z0-9-]{8,40}$/i.test(orderId)) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();
    const baseUrl = getPayPalBaseUrl();

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: "{}",
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = typeof data?.message === "string" ? data.message : "Failed to capture PayPal order.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    return NextResponse.json({
      status: data?.status || "UNKNOWN",
      id: data?.id || orderId,
      data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to capture PayPal order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
