import type { Metadata } from "next";
import "./globals.css";
import Ticker from "./components/Ticker";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { NativeBannerAd, PopunderAdGate, SocialBarAdGate } from "./components/ads/Ads";
import { SEO_DEFAULT_DESCRIPTION, SEO_DEFAULT_KEYWORDS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "KickInfoMedia - Breaking Football News, Transfers & Analysis",
  description: SEO_DEFAULT_DESCRIPTION,
  keywords: SEO_DEFAULT_KEYWORDS,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PopunderAdGate />
        <SocialBarAdGate />
        <Ticker />
        <Navbar />
        {children}
        <section className="global-native-ad-wrap">
          <NativeBannerAd className="global-native-ad-slot" />
        </section>
        <Footer />
      </body>
    </html>
  );
}
