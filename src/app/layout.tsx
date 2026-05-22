import type { Metadata } from "next";
import "./globals.css";
import Ticker from "./components/Ticker";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

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
        <Ticker />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
