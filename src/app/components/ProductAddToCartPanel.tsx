"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addToCart } from "@/lib/cartClient";

type ProductAddToCartPanelProps = {
  productId: string;
  slug: string;
  name: string;
  team: string;
  imageUrl: string;
  price: number;
  currency: string;
  stock: number;
  sizes: string[];
};

export default function ProductAddToCartPanel({
  productId,
  slug,
  name,
  team,
  imageUrl,
  price,
  currency,
  stock,
  sizes,
}: ProductAddToCartPanelProps) {
  const availableSizes = useMemo(() => sizes.filter(Boolean), [sizes]);
  const [size, setSize] = useState(availableSizes[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const outOfStock = stock <= 0;

  const canSubmit = !outOfStock && quantity > 0 && (availableSizes.length === 0 || !!size);

  function handleAddToCart() {
    if (!canSubmit) return;
    addToCart({
      productId,
      slug,
      name,
      team,
      imageUrl,
      price,
      currency,
      size,
      quantity,
      stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="product-buy-box">
      {availableSizes.length > 0 ? (
        <div className="admin-field">
          <label className="admin-label">Size</label>
          <select value={size} onChange={(e) => setSize(e.target.value)} className="admin-select">
            {availableSizes.map((entry) => (
              <option key={entry} value={entry}>{entry}</option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="admin-field">
        <label className="admin-label">Quantity</label>
        <input
          type="number"
          min={1}
          max={20}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          className="admin-input"
        />
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!canSubmit}
        className="admin-button admin-button-blue disabled:opacity-50 w-full"
      >
        {outOfStock ? "Out of Stock" : added ? "Added" : "Add to Cart"}
      </button>

      <Link href="/cart" className="admin-button admin-button-ghost w-full text-center">
        Go To Cart
      </Link>
    </div>
  );
}

