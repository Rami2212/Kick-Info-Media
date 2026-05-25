"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AdminRichEditor from "../../components/AdminRichEditor";

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

const DEFAULT_VALUES: ProductFormValues = {
  name: "",
  slug: "",
  team: "",
  category: "Jersey",
  description: "",
  price: "0",
  currency: "USD",
  cover_image_url: "",
  galleryText: "",
  sizesText: "S, M, L, XL",
  stock: "0",
  published: true,
  featured: false,
};

function toArrayFromText(text: string, splitter: RegExp): string[] {
  return text
    .split(splitter)
    .map((value) => value.trim())
    .filter(Boolean);
}

export default function ProductForm({
  mode,
  productId,
  initialValues,
}: {
  mode: "create" | "edit";
  productId?: string;
  initialValues?: Partial<ProductFormValues>;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<ProductFormValues>({
    ...DEFAULT_VALUES,
    ...(initialValues || {}),
  });

  const galleryUrls = useMemo(
    () => toArrayFromText(formData.galleryText, /\r?\n/),
    [formData.galleryText],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const generateSlug = () => {
    if (!formData.name.trim()) return;
    const slug = formData.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData((prev) => ({ ...prev, slug }));
  };

  const uploadImage = async (file: File, target: "cover" | "gallery") => {
    setUploading(true);
    setError("");
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: uploadData });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Image upload failed");
      }

      if (target === "cover") {
        setFormData((prev) => ({ ...prev, cover_image_url: data.url }));
      } else {
        setFormData((prev) => ({
          ...prev,
          galleryText: prev.galleryText ? `${prev.galleryText}\n${data.url}` : data.url,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        team: formData.team.trim(),
        category: formData.category.trim(),
        description: formData.description,
        price: Number(formData.price),
        currency: formData.currency.trim().toUpperCase() || "USD",
        cover_image_url: formData.cover_image_url.trim(),
        gallery: toArrayFromText(formData.galleryText, /\r?\n/),
        sizes: toArrayFromText(formData.sizesText, /,/),
        stock: Number(formData.stock),
        published: formData.published,
        featured: formData.featured,
      };

      const url = mode === "edit" && productId ? `/api/products?id=${productId}` : "/api/products";
      const method = mode === "edit" ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save product.");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product.");
      setSaving(false);
    }
  };

  return (
    <div className="admin-page space-y-6">
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">Commerce</p>
          <h2 className="admin-title mt-2">{mode === "edit" ? "Edit Product" : "Create Product"}</h2>
        </div>
        <Link href="/admin/products" className="admin-button admin-button-ghost">Cancel</Link>
      </div>

      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}

      <form onSubmit={handleSubmit} className="admin-panel space-y-6">
        <div className="admin-form-grid md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <div className="admin-field">
              <label className="admin-label">Product Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                onBlur={() => {
                  if (!formData.slug.trim()) generateSlug();
                }}
                className="admin-input"
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Description</label>
              <AdminRichEditor
                value={formData.description}
                onChange={(description) => setFormData((prev) => ({ ...prev, description }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-md border border-white/10 bg-black/60 p-4 space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="published"
                  checked={formData.published}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#1877c1] border-white/30 rounded"
                />
                <span className="text-[#e8e9e9] font-heading text-[11px] uppercase tracking-[0.2em]">Published</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#7fb525] border-white/30 rounded"
                />
                <span className="text-[#e8e9e9] font-heading text-[11px] uppercase tracking-[0.2em]">Featured</span>
              </label>
            </div>

            <div className="admin-field">
              <label className="admin-label">
                URL Slug
                <button type="button" onClick={generateSlug} className="ml-2 text-[#7fb525] hover:text-white text-[10px]">Generate</button>
              </label>
              <input type="text" name="slug" required value={formData.slug} onChange={handleChange} className="admin-input" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Team</label>
              <input
                type="text"
                name="team"
                value={formData.team}
                onChange={handleChange}
                className="admin-input"
                placeholder="France"
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="admin-input"
                placeholder="Jersey"
              />
            </div>

            <div className="admin-form-grid-2">
              <div className="admin-field">
                <label className="admin-label">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  className="admin-input"
                />
              </div>
              <div className="admin-field">
                <label className="admin-label">Currency</label>
                <input
                  type="text"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="USD"
                />
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Stock</label>
              <input
                type="number"
                min="0"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="admin-input"
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Sizes (comma separated)</label>
              <input
                type="text"
                name="sizesText"
                value={formData.sizesText}
                onChange={handleChange}
                className="admin-input"
                placeholder="S, M, L, XL"
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Cover Image URL</label>
              <input
                type="text"
                name="cover_image_url"
                value={formData.cover_image_url}
                onChange={handleChange}
                className="admin-input"
                placeholder="https://..."
              />
              <label className="admin-button admin-button-ghost mt-3 w-full cursor-pointer">
                {uploading ? "Uploading..." : "Upload Cover Image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file, "cover");
                    e.target.value = "";
                  }}
                />
              </label>
              {formData.cover_image_url ? (
                <Image
                  src={formData.cover_image_url}
                  alt="Cover preview"
                  width={640}
                  height={640}
                  className="mt-3 w-full rounded-md border border-white/10 object-cover"
                />
              ) : null}
            </div>

            <div className="admin-field">
              <label className="admin-label">Gallery Image URLs (one per line)</label>
              <textarea
                name="galleryText"
                value={formData.galleryText}
                onChange={handleChange}
                rows={5}
                className="admin-textarea"
                placeholder="https://..."
              />
              <label className="admin-button admin-button-ghost mt-3 w-full cursor-pointer">
                {uploading ? "Uploading..." : "Upload To Gallery"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file, "gallery");
                    e.target.value = "";
                  }}
                />
              </label>

              {galleryUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {galleryUrls.slice(0, 6).map((url) => (
                    <Image
                      key={url}
                      src={url}
                      alt="Gallery preview"
                      width={180}
                      height={180}
                      className="w-full rounded-md border border-white/10 object-cover"
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" disabled={saving} className="admin-button admin-button-blue disabled:opacity-50">
            {saving ? "Saving..." : mode === "edit" ? "Update Product" : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}

