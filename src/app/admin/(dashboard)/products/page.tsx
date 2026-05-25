"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  slug: string;
  team: string;
  category: string;
  price: number;
  currency: string;
  stock: number;
  published: boolean;
  created_at: string;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products?all=true")
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const response = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    if (response.ok) {
      setProducts((prev) => prev.filter((item) => item.id !== id));
    } else {
      alert("Failed to delete product.");
    }
  }

  return (
    <div className="admin-page-wide">
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">Commerce</p>
          <h2 className="admin-title mt-2">Manage Products</h2>
        </div>
        <Link href="/admin/products/new" className="admin-button admin-button-blue">
          Add Product
        </Link>
      </div>

      <div className="admin-panel p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40">Loading products...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-heading uppercase tracking-[0.2em] text-white/40">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-heading uppercase tracking-[0.2em] text-white/40">Team</th>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-heading uppercase tracking-[0.2em] text-white/40">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-heading uppercase tracking-[0.2em] text-white/40">Price</th>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-heading uppercase tracking-[0.2em] text-white/40">Stock</th>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-heading uppercase tracking-[0.2em] text-white/40">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-[10px] font-heading uppercase tracking-[0.2em] text-white/40">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-[#050505] divide-y divide-white/10">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-black/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-[12px] font-heading text-[#e8e9e9]/85 truncate max-w-xs">{product.name}</div>
                      <div className="text-[10px] text-white/25 truncate max-w-xs">{product.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-white/60">{product.team || "-"}</td>
                    <td className="px-6 py-4 text-[11px] text-white/60">{product.category || "-"}</td>
                    <td className="px-6 py-4 text-[11px] text-white/80">{product.currency} {Number(product.price || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-[11px] text-white/60">{product.stock ?? 0}</td>
                    <td className="px-6 py-4">
                      <span className={`admin-badge ${product.published ? "bg-[#7fb525] text-black" : "bg-[#1877c1] text-white"}`}>
                        {product.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="admin-action-group">
                        <Link href={`/admin/products/${product.id}`} className="admin-action-button admin-action-edit">Edit</Link>
                        <button onClick={() => handleDelete(product.id)} className="admin-action-button admin-action-delete">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-white/40">
                      No products yet.{" "}
                      <Link href="/admin/products/new" className="text-[#7fb525] hover:text-white">
                        Create your first product
                      </Link>.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

