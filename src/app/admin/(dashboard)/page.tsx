import { listBlogPosts } from "@/lib/blogPosts";
import { listCategories } from "@/lib/categories";
import Link from "next/link";

export default async function AdminDashboard() {
  const posts = await listBlogPosts({ publishedOnly: false });
  const categories = await listCategories();

  const publishedPosts = posts.filter(p => p.published);
  const drafts = posts.filter(p => !p.published);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Posts</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{posts.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Published</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{publishedPosts.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Drafts</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{drafts.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Categories</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{categories.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Posts</h3>
            <Link href="/admin/posts" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {posts.slice(0, 5).map(post => (
              <div key={post.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-md border border-transparent hover:border-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-900 truncate max-w-sm">{post.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  post.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {post.published ? 'Published' : 'Draft'}
                </span>
              </div>
            ))}
            {posts.length === 0 && <p className="text-gray-500 text-sm">No posts yet.</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/posts/new" className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors group">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </div>
              <span className="font-medium text-gray-800">Create Post</span>
            </Link>
            
            <Link href="/admin/categories" className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors group">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-green-600 mb-3 group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </div>
              <span className="font-medium text-gray-800">Manage Categories</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
