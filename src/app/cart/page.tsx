"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  clearCartItems,
  getCartItems,
  getCartSummary,
  removeCartItem,
  type CartItem,
  updateCartQuantity,
} from "@/lib/cartClient";
import { AdSideRail } from "@/app/components/ads/Ads";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(getCartItems());
    sync();
    window.addEventListener("cart-updated", sync);
    return () => window.removeEventListener("cart-updated", sync);
  }, []);

  const summary = useMemo(() => getCartSummary(items), [items]);

  const handleQtyChange = (item: CartItem, qty: number) => {
    updateCartQuantity(item.productId, item.size, qty);
    setItems(getCartItems());
  };

  const handleRemove = (item: CartItem) => {
    removeCartItem(item.productId, item.size);
    setItems(getCartItems());
  };

  return (
    <>
      <div className="divider"></div>
      <main className="cart-page">
        <aside className="cart-page-side">
          <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
        </aside>

        <section className="cart-main">
          <header className="posts-head">
            <div>
              <p className="blog-sub">Store</p>
              <h1 className="blog-title">Your Cart</h1>
            </div>
          </header>

          {items.length === 0 ? (
            <div className="admin-panel">
              <p className="empty-state-desc">Your cart is empty.</p>
              <Link href="/products" className="home-triple-link">Browse Products -&gt;</Link>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-items">
                {items.map((item) => (
                  <article key={`${item.productId}-${item.size}`} className="cart-item-card">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={120}
                        height={120}
                        className="cart-item-image"
                      />
                    ) : (
                      <div className="cart-item-image product-card-image-placeholder">No Image</div>
                    )}

                    <div className="cart-item-content">
                      <Link href={`/products/${item.slug}`} className="cart-item-name">{item.name}</Link>
                      <p className="cart-item-meta">{item.team || "National Team"} {item.size ? `| Size ${item.size}` : ""}</p>
                      <p className="cart-item-price">{item.currency} {item.price.toFixed(2)}</p>
                    </div>

                    <div className="cart-item-actions">
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={item.quantity}
                        onChange={(e) => handleQtyChange(item, Number(e.target.value) || 1)}
                        className="admin-input"
                      />
                      <button type="button" onClick={() => handleRemove(item)} className="admin-action-button admin-action-delete">
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="cart-summary">
                <h3 className="font-display text-[18px] text-[#e8e9e9]">Order Summary</h3>
                <p className="cart-summary-line">
                  <span>Items</span>
                  <strong>{summary.totalQty}</strong>
                </p>
                <p className="cart-summary-line">
                  <span>Subtotal</span>
                  <strong>{summary.currency} {summary.subtotal.toFixed(2)}</strong>
                </p>

                <Link href="/checkout" className="admin-button admin-button-blue w-full text-center">
                  Proceed to Checkout
                </Link>
                <button type="button" onClick={() => { clearCartItems(); setItems([]); }} className="admin-button admin-button-ghost w-full">
                  Clear Cart
                </button>
              </aside>
            </div>
          )}
        </section>

        <aside className="cart-page-side">
          <AdSideRail size="160x300" smartLinkLabel="Partner" />
        </aside>
      </main>
    </>
  );
}
