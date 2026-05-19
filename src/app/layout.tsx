import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/src/context/CartContext";
import { QueryProvider } from "@/src/components/providers/query-provider";
import { RouteLoader } from "@/src/components/providers/RouteLoader";
import { HeroUIProvider } from "@/src/components/providers/heroui-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "SUNLIGHT - Premium Phone Cases",
  description: "Custom personalized phone cases with premium ambient design",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} h-full antialiased`}
    >
      {/* ✓ Changed: Removed flex flex-col, added m-0 p-0, changed min-h-full to h-full */}
      <body className="sunlight-atmosphere m-0 p-0 h-full">
        <div className="sunlight-atmosphere__content">
          <HeroUIProvider>
            <RouteLoader />
            <QueryProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </QueryProvider>
          </HeroUIProvider>
        </div>
      </body>
    </html>
  );
}