"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Post = {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  published: boolean;
  created_at: string;
};

type Category = {
  id: string;
  name: string;
};

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchData() {
      try {
        const [postsRes, catsRes] = await Promise.all([
          fetch("/api/posts?all=true"),
          fetch("/api/categories")
        ]);
        
        if (postsRes.ok && catsRes.ok) {
          const postsData = await postsRes.json();
          const catsData = await catsRes.json();
          
          setPosts(postsData);
          
          const catMap: Record<string, string> = {};
          catsData.forEach((c: Category) => {
            catMap[c.id] = c.name;
          });
          setCategories(catMap);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    try {
      const res = await fetch(`/api/posts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== id));
      } else {
        alert("Failed to delete post");
      }
    } catch {
      alert("Error deleting post");
    }
  }

  return (
    <div className="admin-page-wide">
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">Editorial</p>
          <h2 className="admin-title mt-2">Manage Posts</h2>
        </div>
        <Link
          href="/admin/posts/new" 
          className="admin-button admin-button-blue"
        >
          Create New Post
        </Link>
      </div>

      <div className="admin-panel p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40">Loading posts...</div>
        ) : (
          <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-heading uppercase tracking-[0.2em] text-white/40">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-heading uppercase tracking-[0.2em] text-white/40">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-heading uppercase tracking-[0.2em] text-white/40">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-heading uppercase tracking-[0.2em] text-white/40">Date</th>
                <th scope="col" className="px-6 py-3 text-right text-[10px] font-heading uppercase tracking-[0.2em] text-white/40">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-[#050505] divide-y divide-white/10">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-black/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-[12px] font-heading text-[#e8e9e9]/85 truncate max-w-xs">{post.title}</div>
                    <div className="text-[10px] text-white/25 truncate max-w-xs">{post.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-white/50 bg-black px-2 py-1 border border-white/10">
                      {categories[post.category_id] || "None"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`admin-badge ${
                      post.published ? "bg-[#7fb525] text-black" : "bg-[#1877c1] text-white"
                    }`}>
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] text-white/30">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="admin-action-group">
                      <Link href={`/admin/posts/${post.id}`} className="admin-action-button admin-action-edit">Edit</Link>
                      <button onClick={() => handleDelete(post.id)} className="admin-action-button admin-action-delete">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-white/40">
                    No posts found. <Link href="/admin/posts/new" className="text-[#7fb525] hover:text-white">Create your first post</Link>.
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
