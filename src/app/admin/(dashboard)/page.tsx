import { listBlogPosts } from "@/lib/blogPosts";
import { listCategories } from "@/lib/categories";
import Link from "next/link";

export default async function AdminDashboard() {
  const posts = await listBlogPosts({ publishedOnly: false });
  const categories = await listCategories();

  const publishedPosts = posts.filter(p => p.published);
  const drafts = posts.filter(p => !p.published);

  return (
    <div className="admin-page-wide space-y-6">
      <div className="admin-panel">
        <p className="admin-kicker">Overview</p>
        <h2 className="admin-title mt-2">Dashboard Overview</h2>
        <p className="admin-subtitle">
          Manage posts, categories, and editorial activity from a single view.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="admin-panel">
          <h3 className="font-heading text-[10px] uppercase tracking-[0.25em] text-white/40">Total Posts</h3>
          <p className="font-display text-[28px] text-[#e8e9e9] mt-3">{posts.length}</p>
        </div>
        <div className="admin-panel">
          <h3 className="font-heading text-[10px] uppercase tracking-[0.25em] text-white/40">Published</h3>
          <p className="font-display text-[28px] text-[#7fb525] mt-3">{publishedPosts.length}</p>
        </div>
        <div className="admin-panel">
          <h3 className="font-heading text-[10px] uppercase tracking-[0.25em] text-white/40">Drafts</h3>
          <p className="font-display text-[28px] text-[#1877c1] mt-3">{drafts.length}</p>
        </div>
        <div className="admin-panel">
          <h3 className="font-heading text-[10px] uppercase tracking-[0.25em] text-white/40">Categories</h3>
          <p className="font-display text-[28px] text-[#e8e9e9] mt-3">{categories.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="admin-panel">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-[18px] text-[#e8e9e9]">Recent Posts</h3>
            <Link href="/admin/posts" className="font-heading text-[10px] uppercase tracking-[0.2em] text-[#7fb525] hover:text-white">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {posts.slice(0, 5).map(post => (
              <div key={post.id} className="flex flex-col gap-3 rounded-md border border-white/10 bg-black/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-heading text-[12px] text-[#e8e9e9]/85 truncate max-w-sm">{post.title}</p>
                  <p className="font-body text-[10px] text-white/25 mt-1">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`admin-badge shrink-0 ${
                  post.published ? "bg-[#7fb525] text-black" : "bg-[#1877c1] text-white"
                }`}>
                  {post.published ? "Published" : "Draft"}
                </span>
              </div>
            ))}
            {posts.length === 0 && <p className="text-white/40 text-sm">No posts yet.</p>}
          </div>
        </div>

        <div className="admin-panel">
          <h3 className="font-display text-[18px] text-[#e8e9e9] mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link href="/admin/posts/new" className="rounded-md border border-white/10 bg-black/60 p-5 hover:border-[#1877c1]/40 transition-colors">
              <div className="w-10 h-10 rounded-md bg-[#1877c1]/15 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#1877c1]"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </div>
              <span className="font-heading text-[11px] uppercase tracking-[0.2em] text-white/70">Create Post</span>
            </Link>

            <Link href="/admin/categories" className="rounded-md border border-white/10 bg-black/60 p-5 hover:border-[#7fb525]/40 transition-colors">
              <div className="w-10 h-10 rounded-md bg-[#7fb525]/15 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#7fb525]"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </div>
              <span className="font-heading text-[11px] uppercase tracking-[0.2em] text-white/70">Manage Categories</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
