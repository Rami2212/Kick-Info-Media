# Kick-Info-Media

## Frontend

The UI follows the HTML redesign preview with a 1200px content width.

Quick start:
```powershell
cd D:\Projects\BusinessX\Kick-Info-Media\src
npm run dev
```

## Backend setup (local)

Required environment variables (add to `src/.env.local`):
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS` (comma-separated admin emails)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## API overview

Blog posts (MongoDB):
- `GET /api/posts?slug=...`
- `GET /api/posts?all=1` (admin)
- `POST /api/posts` (admin)
- `PUT /api/posts?id=...` (admin)
- `DELETE /api/posts?id=...` (admin)

Categories (MongoDB):
- `GET /api/categories`
- `GET /api/categories?slug=...`
- `GET /api/categories?id=...`
- `POST /api/categories` (admin)
- `PUT /api/categories?id=...` (admin)
- `DELETE /api/categories?id=...` (admin)

Users (MongoDB, admin CRUD):
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users?id=...`
- `DELETE /api/admin/users?id=...`

Supabase admin user creation:
- `POST /api/admin/supabase-users`

Site settings (MongoDB):
- `GET /api/site-settings`
- `PUT /api/site-settings` (admin)

Uploads (Cloudinary):
- `POST /api/upload` (image/video for blog editor)
- `POST /api/profile/avatar` (image for profile)

## Netlify

The `netlify.toml` file is configured for Next.js builds in the `src` directory.
