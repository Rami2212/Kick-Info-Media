import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import ProductAddToCartPanel from "@/app/components/ProductAddToCartPanel";
import { sanitizeRichHtml } from "@/lib/security";
import { SEO_DEFAULT_KEYWORDS, mergeSeoKeywords } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug, true);
  if (!product) {
    return { title: "Product Not Found | KickInfoMedia" };
  }

  return {
    title: `${product.name} | KickInfoMedia`,
    description: `${product.team} ${product.category} - ${product.currency} ${product.price.toFixed(2)}`,
    keywords: mergeSeoKeywords(
      [product.name, product.team, product.category, "football jersey", "world cup merchandise"].filter(Boolean),
      SEO_DEFAULT_KEYWORDS,
    ),
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug, true);
  if (!product) notFound();

  const gallery = [product.cover_image_url, ...product.gallery].filter((url, index, all) => !!url && all.indexOf(url) === index);

  return (
    <>
      <div className="divider"></div>
      <main className="product-detail-page">
        <aside className="product-detail-side" aria-hidden="true"></aside>

        <section className="product-detail-main">
          <div className="product-detail-grid">
            <div className="product-media-col">
              {product.cover_image_url ? (
                <Image
                  src={product.cover_image_url}
                  alt={product.name}
                  width={960}
                  height={960}
                  className="product-detail-cover"
                  priority
                />
              ) : (
                <div className="product-detail-cover product-card-image-placeholder">No Image</div>
              )}

              {gallery.length > 1 ? (
                <div className="product-gallery-grid">
                  {gallery.slice(1).map((url) => (
                    <Image
                      key={url}
                      src={url}
                      alt={`${product.name} gallery`}
                      width={240}
                      height={240}
                      className="product-gallery-image"
                    />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="product-info-col">
              <p className="blog-sub">{product.team || "National Team"}</p>
              <h1 className="blog-title">{product.name}</h1>
              <p className="product-price-tag">{product.currency} {product.price.toFixed(2)}</p>
              <p className="product-stock-line">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>

              <div className="product-description" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(product.description || "") }} />

              <ProductAddToCartPanel
                productId={product.id}
                slug={product.slug}
                name={product.name}
                team={product.team}
                imageUrl={product.cover_image_url}
                price={product.price}
                currency={product.currency}
                stock={product.stock}
                sizes={product.sizes}
              />

              <Link href="/products" className="home-triple-link">Back to Products -&gt;</Link>
            </div>
          </div>
        </section>

        <aside className="product-detail-side" aria-hidden="true"></aside>
      </main>
    </>
  );
}
