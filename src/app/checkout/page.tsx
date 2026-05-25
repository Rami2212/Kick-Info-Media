"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { clearCartItems, getCartItems, getCartSummary, type CartItem } from "@/lib/cartClient";
import { AdSideRail } from "@/app/components/ads/Ads";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError: (error: unknown) => void;
      }) => {
        render: (selector: string | HTMLElement) => Promise<void>;
      };
    };
  }
}

function loadPayPalScript(clientId: string, currency: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptId = `paypal-sdk-${currency.toLowerCase()}`;
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing && window.paypal?.Buttons) {
      resolve();
      return;
    }

    if (existing) existing.remove();
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load PayPal SDK."));
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingPayPal, setLoadingPayPal] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const paypalContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sync = () => setItems(getCartItems());
    sync();
    window.addEventListener("cart-updated", sync);
    return () => window.removeEventListener("cart-updated", sync);
  }, []);

  const summary = useMemo(() => getCartSummary(items), [items]);
  const currency = summary.currency || "USD";
  const clientId = (process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "").trim();

  useEffect(() => {
    let cancelled = false;
    async function mountButtons() {
      if (!paypalContainerRef.current) return;
      paypalContainerRef.current.innerHTML = "";

      if (!clientId) {
        setError("PayPal client ID is missing. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID.");
        setLoadingPayPal(false);
        return;
      }

      if (items.length === 0) {
        setLoadingPayPal(false);
        return;
      }

      try {
        setLoadingPayPal(true);
        setError("");
        await loadPayPalScript(clientId, currency);
        if (cancelled || !window.paypal?.Buttons || !paypalContainerRef.current) return;

        const buttons = window.paypal.Buttons({
          createOrder: async () => {
            const response = await fetch("/api/paypal/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                currency,
                items: items.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  size: item.size,
                })),
              }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data?.id) {
              throw new Error(data?.error || "Could not create order.");
            }
            return String(data.id);
          },
          onApprove: async (data) => {
            const response = await fetch("/api/paypal/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: data.orderID }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
              throw new Error(payload?.error || "Payment capture failed.");
            }

            clearCartItems();
            setItems([]);
            setSuccessMessage(`Payment completed. Order ID: ${payload?.id || data.orderID}`);
          },
          onError: (paypalError) => {
            console.error(paypalError);
            setError("PayPal checkout failed. Please try again.");
          },
        });

        await buttons.render(paypalContainerRef.current);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize PayPal checkout.");
      } finally {
        if (!cancelled) setLoadingPayPal(false);
      }
    }

    mountButtons();
    return () => {
      cancelled = true;
    };
  }, [clientId, currency, items]);

  return (
    <>
      <div className="divider"></div>
      <main className="checkout-page">
        <aside className="checkout-page-side">
          <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
        </aside>

        <section className="checkout-main">
          <header className="posts-head">
            <div>
              <p className="blog-sub">Store</p>
              <h1 className="blog-title">Checkout</h1>
            </div>
          </header>

          {items.length === 0 && !successMessage ? (
            <div className="admin-panel">
              <p className="empty-state-desc">Your cart is empty. Add products before checkout.</p>
              <Link href="/products" className="home-triple-link">Browse Products -&gt;</Link>
            </div>
          ) : null}

          {successMessage ? (
            <div className="admin-alert admin-alert-success">{successMessage}</div>
          ) : null}

          {items.length > 0 ? (
            <div className="checkout-layout">
              <div className="admin-panel">
                <h3 className="font-display text-[18px] text-[#e8e9e9] mb-4">Pay with PayPal</h3>
                <p className="text-[12px] text-white/50 mb-4">
                  You will be redirected to PayPal to complete your payment securely.
                </p>
                {error ? <div className="admin-alert admin-alert-error mb-4">{error}</div> : null}
                {loadingPayPal ? <p className="text-white/50 text-sm">Loading PayPal checkout...</p> : null}
                <div ref={paypalContainerRef} className="paypal-button-wrap" />
              </div>

              <aside className="cart-summary">
                <h3 className="font-display text-[18px] text-[#e8e9e9]">Order Summary</h3>
                <p className="cart-summary-line">
                  <span>Items</span>
                  <strong>{summary.totalQty}</strong>
                </p>
                <p className="cart-summary-line">
                  <span>Total</span>
                  <strong>{summary.currency} {summary.subtotal.toFixed(2)}</strong>
                </p>
                <Link href="/cart" className="admin-button admin-button-ghost w-full text-center">
                  Back To Cart
                </Link>
              </aside>
            </div>
          ) : null}
        </section>

        <aside className="checkout-page-side">
          <AdSideRail size="160x300" smartLinkLabel="Partner" />
        </aside>
      </main>
    </>
  );
}
