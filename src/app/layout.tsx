import type { Metadata } from "next";
import "./globals.css";
import Ticker from "./components/Ticker";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { NativeBannerAd, PopunderAdGate, SocialBarAdGate } from "./components/ads/Ads";

export const metadata: Metadata = {
  title: "KickInfoMedia — Breaking Football News, Transfers & Analysis",
  description: "The premier destination for breaking football news, tactical analysis, and live coverage from across the globe.",
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
