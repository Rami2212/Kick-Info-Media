"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AdminRichEditor from "../../components/AdminRichEditor";

type Category = {
  id: string;
  name: string;
};

export default function NewPostPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category_id: "",
    excerpt: "",
    content: "",
    cover_image_url: "",
    published: false,
    highlight: false,
    seo_description: "",
    seo_keywords: "",
  });

  useEffect(() => {
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, category_id: data[0].id }));
        }
      })
      .catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const uploadCoverImage = async (file: File) => {
    setCoverUploading(true);
    setError("");

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Cover image upload failed");
      }

      setFormData(prev => ({ ...prev, cover_image_url: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cover image upload failed");
    } finally {
      setCoverUploading(false);
    }
  };

  const generateSlug = () => {
    if (!formData.title) return;
    const slug = formData.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create post");
      }

      router.push("/admin/posts");
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
          <p className="admin-kicker">Editorial</p>
          <h2 className="admin-title mt-2">Create New Post</h2>
        </div>
        <Link href="/admin/posts" className="admin-button admin-button-ghost">Cancel</Link>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-panel space-y-6">
        <div className="admin-form-grid md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <div className="admin-field">
              <label className="admin-label">Title</label>
              <input
                type="text" 
                name="title" 
                required 
                value={formData.title} 
                onChange={handleChange}
                onBlur={() => { if(!formData.slug) generateSlug(); }}
                className="admin-input"
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Excerpt</label>
              <textarea
                name="excerpt" 
                rows={3}
                value={formData.excerpt} 
                onChange={handleChange}
                className="admin-textarea"
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Content</label>
              <AdminRichEditor
                value={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-md border border-white/10 bg-black/60 p-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="published" 
                  checked={formData.published} 
                  onChange={handleChange}
                  className="h-4 w-4 text-[#1877c1] border-white/30 rounded"
                />
                <span className="text-[#e8e9e9] font-heading text-[11px] uppercase tracking-[0.2em]">Publish Post</span>
              </label>
              <p className="text-[10px] text-white/30 mt-2">If unchecked, this post will be saved as a draft.</p>
            </div>

            <div className="rounded-md border border-white/10 bg-black/60 p-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="highlight"
                  checked={formData.highlight}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#7fb525] border-white/30 rounded"
                />
                <span className="text-[#e8e9e9] font-heading text-[11px] uppercase tracking-[0.2em]">Highlight Post</span>
              </label>
              <p className="text-[10px] text-white/30 mt-2">Highlighted posts appear in the homepage highlights section.</p>
            </div>

            <div className="admin-field">
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

            <div className="admin-field">
              <label className="admin-label">Category</label>
              <select
                name="category_id" 
                value={formData.category_id} 
                onChange={handleChange}
                className="admin-select"
              >
                <option value="">No Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label className="admin-label">Cover Image URL</label>
              <input
                type="text" 
                name="cover_image_url" 
                value={formData.cover_image_url} 
                onChange={handleChange}
                placeholder="https://..."
                className="admin-input"
              />
              <label className="admin-button admin-button-ghost mt-3 w-full cursor-pointer">
                {coverUploading ? "Uploading..." : "Upload Cover Image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadCoverImage(file);
                    e.target.value = "";
                  }}
                />
              </label>
              {formData.cover_image_url && (
                <Image
                  src={formData.cover_image_url}
                  alt="Cover preview"
                  width={640}
                  height={360}
                  className="mt-3 w-full rounded-md border border-white/10 object-cover"
                />
              )}
            </div>

            <div className="admin-field">
              <label className="admin-label">SEO Description</label>
              <textarea
                name="seo_description" 
                rows={3}
                value={formData.seo_description} 
                onChange={handleChange}
                className="admin-textarea"
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">SEO Keywords</label>
              <input
                type="text"
                name="seo_keywords"
                value={formData.seo_keywords}
                onChange={handleChange}
                placeholder="football news, transfers, club updates"
                className="admin-input"
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
            {saving ? "Saving..." : "Save Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
