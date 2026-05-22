# Kick Info Media — Complete Setup Guide

## Color Palette
- **Background**: `#000000` (pure black)
- **Text/Light**: `#e8e9e9` (light gray)
- **Primary Blue**: `#1877c1` (strong electric blue)
- **Bright Green**: `#7fb525` (fresh lime green)
- **Dark Green**: `#505944` (deep muted green)

## Project Structure

### Frontend Pages
- **Home** (`/`) — Hero, categories, blog grid, sidebar
- **Categories** (`/categories`) — All category showcase
- **Blogs** (`/blogs`) — Blog listing with editor highlights
- **More** (`/more`) — Tools and features hub

### Admin Dashboard
- **Overview** (`/admin`) — Stats and recent activity
- **Blog Manager** (`/admin/posts`) — CRUD for blog posts
- **Categories** (`/admin/categories`) — Manage categories
- **Users** (`/admin/users`) — User management
- **Site Settings** (`/admin/site-settings`) — Cover page and global config
- **Supabase Admin** (`/admin/supabase`) — Create admin users

### Components
- `Navbar` — Top navigation with logo, search, subscribe
- `NewsTicker` — Breaking news ticker bar
- `HeroSection` — Featured article + side articles
- `CategoriesSection` — Category grid showcase
- `BlogGrid` — Article card grid with filters
- `Sidebar` — Trending, newsletter, poll, quick links
- `AdminNav` — Admin sidebar navigation

### Backend APIs (Next.js API Routes)
- **Blogs**: `GET/POST/PUT/DELETE /api/posts`
- **Categories**: `GET/POST/PUT/DELETE /api/categories`
- **Users**: `GET/POST/PUT/DELETE /api/admin/users`
- **Site Settings**: `GET/PUT /api/site-settings`
- **Supabase Admin**: `POST /api/admin/supabase-users`
- **Uploads**: `POST /api/upload`, `POST /api/profile/avatar`

### Database

#### MongoDB Collections
1. **posts** — Blog articles with title, content, media, category, SEO
2. **categories** — Content categories with metadata
3. **users** — User profiles with auth data
4. **site_settings** — Global config (cover page, extra settings)

#### Supabase Auth
- Email/password and Google OAuth
- Service role for admin user creation
- JWT token-based session management

#### Cloudinary
- Blog images/videos in `kick-info-media/blog` folder
- Profile avatars in `kick-info-media/profiles` folder

## Getting Started (Local Development)

```bash
cd D:\Projects\BusinessX\Kick-Info-Media\src
npm install
npm run dev
```

Visit `http://localhost:3000`

## Environment Variables (`.env.local`)

```
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=kick_info_media

NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

ADMIN_EMAILS=admin@kickinfo.com,editor@kickinfo.com

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Deployment (Netlify)

Configuration in `netlify.toml`:
```toml
[build]
  base = "src"
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Pre-deployment Checklist
1. Set all env vars in Netlify dashboard
2. Link MongoDB and Cloudinary accounts
3. Configure Supabase auth redirect URL
4. Set up admin user in Supabase manually or via API
5. Deploy and test login flow

## Admin Authentication

Admins are identified by email in `ADMIN_EMAILS` environment variable. Each admin must:
1. Be registered in MongoDB users collection
2. Have a Supabase account via email/password or Google OAuth
3. Email listed in `ADMIN_EMAILS` env var

## Key Features Implemented

✅ Full blog CRUD with media uploads
✅ Category management with SEO
✅ User management dashboard
✅ Site settings editor
✅ Supabase admin creation
✅ Cloudinary image/video uploads (no moderation)
✅ Responsive admin interface
✅ Modern design with custom color palette
✅ Next.js App Router SSR/SSG ready
✅ Netlify deployment ready

## Next Steps

1. **Wire API calls** — Connect frontend forms to backend endpoints
2. **User authentication** — Implement login/register pages
3. **Rich text editor** — Integrate for blog content editing
4. **Image gallery** — Build media browser for blog editor
5. **Content publishing** — Add scheduling and draft workflow
6. **Analytics** — Track page views and engagement
7. **SEO optimization** — Add structured data and meta tags
8. **Performance** — Image optimization, caching strategies

## Support & Troubleshooting

- **404 on home?** Check `src/app/page.tsx` exists (lowercase)
- **Lint errors?** Run `npm run lint` to check TypeScript
- **Auth issues?** Verify Supabase keys and NEXTAUTH_SECRET
- **Upload errors?** Check Cloudinary credentials and API limits
- **MongoDB timeout?** Verify connection string and whitelist IP

---

**Built with**: Next.js 16 · TypeScript · Tailwind CSS · MongoDB · Supabase · Cloudinary

