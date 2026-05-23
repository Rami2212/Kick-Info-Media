"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  seo_description: string;
  seo_keywords: string;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories(categories.filter(c => c.id !== id));
      } else {
        alert("Failed to delete category");
      }
    } catch {
      alert("Error deleting category");
    }
  };

  return (
    <div className="admin-page-wide relative">
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">Taxonomy</p>
          <h2 className="admin-title mt-2">Manage Categories</h2>
        </div>
        <Link href="/admin/categories/new" className="admin-button admin-button-green">
          Add Category
        </Link>
      </div>

      <div className="admin-panel p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40">Loading categories...</div>
        ) : (
          <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-heading uppercase tracking-[0.2em] text-white/40">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-heading uppercase tracking-[0.2em] text-white/40">Slug</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-heading uppercase tracking-[0.2em] text-white/40">Description</th>
                <th scope="col" className="px-6 py-3 text-right text-[10px] font-heading uppercase tracking-[0.2em] text-white/40">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-[#050505] divide-y divide-white/10">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-black/40 transition-colors">
                  <td className="px-6 py-4 text-[12px] font-heading text-[#e8e9e9]/85">{cat.name}</td>
                  <td className="px-6 py-4 text-[10px] text-white/30 uppercase tracking-[0.15em]">{cat.slug}</td>
                  <td className="px-6 py-4 text-[11px] text-white/30 max-w-xs truncate">{cat.description}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="admin-action-group">
                      <Link href={`/admin/categories/${cat.id}`} className="admin-action-button admin-action-edit">Edit</Link>
                      <button onClick={() => handleDelete(cat.id)} className="admin-action-button admin-action-delete">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-white/40">
                    No categories found. <Link href="/admin/categories/new" className="text-[#7fb525] hover:text-white">Create your first category</Link>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>

    </div>
  );
}
