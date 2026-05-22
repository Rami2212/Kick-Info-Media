import Link from "next/link";
import { requireAdminAuth } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAdminAuth();
  
  if (!auth.ok) {
    // If authenticated but not an admin, they shouldn't see the admin panel
    // The middleware already handles unauthenticated users
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded shadow max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-6">Your account ({auth.email}) does not have administrator privileges.</p>
          <a href="/" className="text-blue-600 hover:underline">Return to site</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 text-white flex-shrink-0">
        <div className="p-4 border-b border-gray-800">
          <Link href="/admin" className="text-xl font-bold tracking-wider">
            KIM <span className="text-blue-400">Admin</span>
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/admin" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">Dashboard</Link>
          <Link href="/admin/posts" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">Posts</Link>
          <Link href="/admin/categories" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">Categories</Link>
          <Link href="/admin/site-settings" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">Site Settings</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Admin Console</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{auth.email}</span>
            <form action="/api/logout" method="POST">
              <button type="submit" className="text-sm text-red-600 hover:text-red-800">Logout</button>
            </form>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
