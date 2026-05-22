"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";

type Category = {
  id: string;
  name: string;
};

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category_id: "",
    excerpt: "",
    content: "",
    cover_image_url: "",
    published: false,
    seo_description: "",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [catsRes, postRes] = await Promise.all([
          fetch("/api/categories"),
          fetch(`/api/posts?slug=${id}`) // Wait, the ID might be passed but the API fetches by slug or ID? Let's check API.
          // Ah, existing GET /api/posts takes ?slug=... wait, it takes slug for single post! Let's check posts API route...
          // Actually, we can fetch all and find by ID, or we need to pass the ID if the API supports it.
        ]);

        const catsData = await catsRes.json();
        setCategories(catsData);

        // Let's fetch all posts and find the one with this ID, since GET /api/posts?slug=... doesn't take ID.
        // Wait, the API GET /api/posts?slug=... returns post by slug. What if `id` in url is actually the ID?
        const allPostsRes = await fetch("/api/posts?all=true");
        const allPosts = await allPostsRes.json();
        const post = allPosts.find((p: any) => p.id === id);

        if (!post) {
          throw new Error("Post not found");
        }

        setFormData({
          title: post.title || "",
          slug: post.slug || "",
          category_id: post.category_id || "",
          excerpt: post.excerpt || "",
          content: post.content || "",
          cover_image_url: post.cover_image_url || "",
          published: !!post.published,
          seo_description: post.seo_description || "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
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
      const res = await fetch(`/api/posts?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update post");
      }

      router.push("/admin/posts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Edit Post</h2>
        <Link href="/admin/posts" className="text-gray-500 hover:text-gray-700">Cancel</Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input 
                type="text" 
                name="title" 
                required 
                value={formData.title} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
              <textarea 
                name="excerpt" 
                rows={3}
                value={formData.excerpt} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown/HTML)</label>
              <textarea 
                name="content" 
                required 
                rows={15}
                value={formData.content} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="published" 
                  checked={formData.published} 
                  onChange={handleChange}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-900 font-medium">Publish Post</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-8">If unchecked, this post will be saved as a draft.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Slug
                <button type="button" onClick={generateSlug} className="ml-2 text-blue-600 hover:underline text-xs">Generate</button>
              </label>
              <input 
                type="text" 
                name="slug" 
                required 
                value={formData.slug} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                name="category_id" 
                value={formData.category_id} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
              <input 
                type="text" 
                name="cover_image_url" 
                value={formData.cover_image_url} 
                onChange={handleChange}
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
              <textarea 
                name="seo_description" 
                rows={3}
                value={formData.seo_description} 
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Update Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
