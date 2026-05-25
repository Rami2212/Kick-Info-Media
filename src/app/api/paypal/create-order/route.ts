import { NextResponse } from "next/server";
import { getProductById } from "@/lib/products";
import { getPayPalAccessToken, getPayPalBaseUrl } from "@/lib/paypal";
import { checkRateLimit, enforceSameOrigin } from "@/lib/security";

export const runtime = "nodejs";

type CheckoutItemInput = {
  productId?: string;
  quantity?: number;
  size?: string;
};

function normalizeCurrency(value: unknown): string {
  const next = typeof value === "string" ? value.trim().toUpperCase() : "";
  return next || "USD";
}

function normalizeQuantity(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(20, Math.floor(n));
}

export async function POST(req: Request) {
  const sameOriginError = enforceSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  const rateLimit = checkRateLimit(req, "paypal-create-order", 25, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  try {
    const body = await req.json();
    const inputItems = Array.isArray(body?.items) ? (body.items as CheckoutItemInput[]) : [];
    if (inputItems.length === 0) {
      return NextResponse.json({ error: "No items in cart." }, { status: 400 });
    }

    const currency = normalizeCurrency(body?.currency);
    const orderItems: {
      name: string;
      quantity: string;
      unit_amount: { currency_code: string; value: string };
      description?: string;
    }[] = [];

    let total = 0;

    for (const rawItem of inputItems.slice(0, 30)) {
      const productId = typeof rawItem?.productId === "string" ? rawItem.productId.trim() : "";
      if (!productId) continue;

      const product = await getProductById(productId);
      if (!product || !product.published) continue;

      const quantity = normalizeQuantity(rawItem.quantity);
      const lineTotal = product.price * quantity;
      total += lineTotal;

      const sizeLabel = typeof rawItem?.size === "string" ? rawItem.size.trim() : "";
      const description = [product.team, sizeLabel ? `Size: ${sizeLabel}` : ""]
        .filter(Boolean)
        .join(" | ");

      orderItems.push({
        name: product.name.slice(0, 127),
        quantity: String(quantity),
        unit_amount: {
          currency_code: currency,
          value: product.price.toFixed(2),
        },
        ...(description ? { description: description.slice(0, 127) } : {}),
      });
    }

    if (orderItems.length === 0 || total <= 0) {
      return NextResponse.json({ error: "Cart has no purchasable items." }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();
    const baseUrl = getPayPalBaseUrl();

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: total.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: currency,
                  value: total.toFixed(2),
                },
              },
            },
            items: orderItems,
          },
        ],
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.id) {
      const message = typeof data?.message === "string" ? data.message : "Failed to create PayPal order.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create PayPal order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
