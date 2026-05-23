"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function NewCategoryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    seo_description: "",
    seo_keywords: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generateSlug = () => {
    if (!formData.name) return;
    const slug = formData.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData((prev) => ({ ...prev, slug }));
  };

  const uploadCategoryImage = async (file: File) => {
    setImageUploading(true);
    setError("");

    try {
      if (file.type !== "image/png") {
        throw new Error("Please upload a PNG image.");
      }

      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Category image upload failed");
      }

      setFormData((prev) => ({ ...prev, image_url: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Category image upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create category");
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSaving(false);
    }
  };

  return (
    <div className="admin-page space-y-6">
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">Taxonomy</p>
          <h2 className="admin-title mt-2">Create New Category</h2>
        </div>
        <Link href="/admin/categories" className="admin-button admin-button-ghost">Cancel</Link>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-panel space-y-6">
        <div className="admin-form-grid md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <div>
              <label className="admin-label">Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                onBlur={() => { if (!formData.slug) generateSlug(); }}
                className="admin-input"
              />
            </div>

            <div>
              <label className="admin-label">Description</label>
              <textarea
                name="description"
                rows={8}
                value={formData.description}
                onChange={handleChange}
                className="admin-textarea"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="admin-label">
                URL Slug
                <button type="button" onClick={generateSlug} className="ml-2 text-[#7fb525] hover:text-white text-[10px]">Generate</button>
              </label>
              <input
                type="text"
                name="slug"
                required
                value={formData.slug}
                onChange={handleChange}
                className="admin-input"
              />
            </div>

            <div>
              <label className="admin-label">SEO Description</label>
              <textarea
                name="seo_description"
                rows={4}
                value={formData.seo_description}
                onChange={handleChange}
                className="admin-textarea"
                placeholder="Short search result description for this category"
              />
            </div>

            <div>
              <label className="admin-label">Category Image URL (100x100 PNG)</label>
              <input
                type="text"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="admin-input"
                placeholder="https://..."
              />
              <label className="admin-button admin-button-ghost mt-3 w-full cursor-pointer">
                {imageUploading ? "Uploading..." : "Upload 100x100 PNG"}
                <input
                  type="file"
                  accept="image/png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadCategoryImage(file);
                    e.target.value = "";
                  }}
                />
              </label>
              {formData.image_url && (
                <Image
                  src={formData.image_url}
                  alt="Category preview"
                  width={100}
                  height={100}
                  className="mt-3 h-[100px] w-[100px] rounded-md border border-white/10 object-cover"
                />
              )}
            </div>

            <div>
              <label className="admin-label">SEO Keywords</label>
              <input
                type="text"
                name="seo_keywords"
                value={formData.seo_keywords}
                onChange={handleChange}
                className="admin-input"
                placeholder="football news, transfers, match previews"
              />
            </div>
          </div>
        </div>

        <div className="admin-form-actions">
          <button
            type="submit"
            disabled={saving}
            className="admin-button admin-button-blue disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Category"}
          </button>
        </div>
      </form>
    </div>
  );
}
