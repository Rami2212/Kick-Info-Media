import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listProducts } from "@/lib/products";
import { AdSideRail } from "@/app/components/ads/Ads";

export const metadata: Metadata = {
  title: "Products | KickInfoMedia",
  description: "Shop world cup jerseys and football merchandise.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams: Promise<{
    q?: string;
    team?: string;
    category?: string;
    size?: string;
    sort?: string;
  }>;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export default async function ProductsPage({ searchParams }: Props) {
  const { q, team, category, size, sort } = await searchParams;
  const query = normalizeText(q);
  const selectedTeam = normalizeText(team);
  const selectedCategory = normalizeText(category);
  const selectedSize = normalizeText(size);
  const selectedSort = normalizeText(sort) || "newest";

  const products = await listProducts({ publishedOnly: true });

  const teamOptions = Array.from(new Set(products.map((item) => item.team).filter(Boolean))).sort();
  const categoryOptions = Array.from(new Set(products.map((item) => item.category).filter(Boolean))).sort();
  const sizeOptions = Array.from(new Set(products.flatMap((item) => item.sizes).filter(Boolean))).sort();

  let filtered = products.filter((product) => {
    if (selectedTeam && product.team !== selectedTeam) return false;
    if (selectedCategory && product.category !== selectedCategory) return false;
    if (selectedSize && !product.sizes.includes(selectedSize)) return false;
    if (query) {
      const haystack = `${product.name} ${product.team} ${product.category} ${product.description.replace(/<[^>]*>/g, " ")}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  if (selectedSort === "price_asc") {
    filtered = [...filtered].sort((a, b) => a.price - b.price);
  } else if (selectedSort === "price_desc") {
    filtered = [...filtered].sort((a, b) => b.price - a.price);
  } else if (selectedSort === "featured") {
    filtered = [...filtered].sort((a, b) => Number(b.featured) - Number(a.featured));
  }

  const makeHref = (next: {
    q?: string;
    team?: string;
    category?: string;
    size?: string;
    sort?: string;
  }) => {
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.team) params.set("team", next.team);
    if (next.category) params.set("category", next.category);
    if (next.size) params.set("size", next.size);
    if (next.sort && next.sort !== "newest") params.set("sort", next.sort);
    const queryString = params.toString();
    return queryString ? `/products?${queryString}` : "/products";
  };

  return (
    <>
      <div className="divider"></div>
      <section className="products-page">
        <aside className="products-filter-sidebar">
          <div className="products-filter-box">
            <p className="posts-filter-kicker">Store</p>
            <h2 className="posts-filter-title">Filters</h2>

            <form action="/products" method="get" className="mt-4">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search products..."
                className="admin-input"
              />
            </form>

            <div className="posts-filter-group">
              <p className="posts-filter-group-title">Sort</p>
              <div className="posts-filter-chip-row">
                {[
                  { value: "newest", label: "Newest" },
                  { value: "price_asc", label: "Price Low" },
                  { value: "price_desc", label: "Price High" },
                  { value: "featured", label: "Featured" },
                ].map((item) => (
                  <Link
                    key={item.value}
                    href={makeHref({
                      q: query,
                      team: selectedTeam,
                      category: selectedCategory,
                      size: selectedSize,
                      sort: item.value,
                    })}
                    className={`posts-filter-chip ${selectedSort === item.value ? "active" : ""}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="posts-filter-group">
              <p className="posts-filter-group-title">Team</p>
              <div className="posts-filter-list">
                <Link href={makeHref({ q: query, category: selectedCategory, size: selectedSize, sort: selectedSort })} className={`posts-filter-link ${!selectedTeam ? "active" : ""}`}>
                  <span>All Teams</span>
                  <span>{products.length}</span>
                </Link>
                {teamOptions.map((value) => (
                  <Link
                    key={value}
                    href={makeHref({ q: query, team: value, category: selectedCategory, size: selectedSize, sort: selectedSort })}
                    className={`posts-filter-link ${selectedTeam === value ? "active" : ""}`}
                  >
                    <span>{value}</span>
                    <span>{products.filter((item) => item.team === value).length}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="posts-filter-group">
              <p className="posts-filter-group-title">Category</p>
              <div className="posts-filter-chip-row">
                <Link
                  href={makeHref({ q: query, team: selectedTeam, size: selectedSize, sort: selectedSort })}
                  className={`posts-filter-chip ${!selectedCategory ? "active" : ""}`}
                >
                  All
                </Link>
                {categoryOptions.map((value) => (
                  <Link
                    key={value}
                    href={makeHref({ q: query, team: selectedTeam, category: value, size: selectedSize, sort: selectedSort })}
                    className={`posts-filter-chip ${selectedCategory === value ? "active" : ""}`}
                  >
                    {value}
                  </Link>
                ))}
              </div>
            </div>

            <div className="posts-filter-group">
              <p className="posts-filter-group-title">Size</p>
              <div className="posts-filter-chip-row">
                <Link
                  href={makeHref({ q: query, team: selectedTeam, category: selectedCategory, sort: selectedSort })}
                  className={`posts-filter-chip ${!selectedSize ? "active" : ""}`}
                >
                  All
                </Link>
                {sizeOptions.map((value) => (
                  <Link
                    key={value}
                    href={makeHref({ q: query, team: selectedTeam, category: selectedCategory, size: value, sort: selectedSort })}
                    className={`posts-filter-chip ${selectedSize === value ? "active" : ""}`}
                  >
                    {value}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="products-main">
          <header className="posts-head">
            <div>
              <p className="blog-sub">Store</p>
              <h1 className="blog-title">World Cup Jerseys</h1>
            </div>
          </header>

          {filtered.length > 0 ? (
            <div className="products-grid">
              {filtered.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`} className="product-card-link">
                  <article className="product-card">
                    {product.cover_image_url ? (
                      <Image
                        src={product.cover_image_url}
                        alt={product.name}
                        width={720}
                        height={720}
                        className="product-card-image"
                      />
                    ) : (
                      <div className="product-card-image product-card-image-placeholder">No Image</div>
                    )}
                    <div className="product-card-body">
                      <p className="product-card-team">{product.team || "National Team"}</p>
                      <h2 className="product-card-name">{product.name}</h2>
                      <div className="product-card-meta">
                        <span>{product.category || "Jersey"}</span>
                        <strong>{product.currency} {product.price.toFixed(2)}</strong>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="admin-panel">
              <p className="empty-state-desc">No products found for this filter.</p>
            </div>
          )}
        </div>

        <aside className="products-page-side">
          <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
        </aside>
      </section>
    </>
  );
}
