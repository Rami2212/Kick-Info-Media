import type { Metadata } from "next";
import ProductForm from "../components/ProductForm";
import { SEO_DEFAULT_KEYWORDS, mergeSeoKeywords } from "@/lib/seo";

export const metadata: Metadata = {
  title: "New Product | KickInfoMedia Admin",
  description: "Create a new store product in the KickInfoMedia admin dashboard.",
  keywords: mergeSeoKeywords(["new product", "admin products"], SEO_DEFAULT_KEYWORDS),
};

export default function NewProductPage() {
  return <ProductForm mode="create" />;
}
