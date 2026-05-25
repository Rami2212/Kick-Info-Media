"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import ProductForm from "../components/ProductForm";

type ProductFormValues = {
  name: string;
  slug: string;
  team: string;
  category: string;
  description: string;
  price: string;
  currency: string;
  cover_image_url: string;
  galleryText: string;
  sizesText: string;
  stock: string;
  published: boolean;
  featured: boolean;
};

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [initialValues, setInitialValues] = useState<Partial<ProductFormValues> | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/products?id=${id}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Product not found.");
        }

        setInitialValues({
          name: data.name || "",
          slug: data.slug || "",
          team: data.team || "",
          category: data.category || "",
          description: data.description || "",
          price: String(data.price ?? "0"),
          currency: data.currency || "USD",
          cover_image_url: data.cover_image_url || "",
          galleryText: Array.isArray(data.gallery) ? data.gallery.join("\n") : "",
          sizesText: Array.isArray(data.sizes) ? data.sizes.join(", ") : "",
          stock: String(data.stock ?? "0"),
          published: !!data.published,
          featured: !!data.featured,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-white/40">Loading product...</div>;
  }

  if (error || !initialValues) {
    return <div className="p-8 text-center text-red-400">{error || "Product not found."}</div>;
  }

  return <ProductForm mode="edit" productId={id} initialValues={initialValues} />;
}

