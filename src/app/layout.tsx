import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const sans = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-sans-next",
  weight: ["300", "400", "500", "600"]
});

const serif = Fraunces({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-serif-next",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"]
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Mr Du · Maison sức khỏe cao cấp",
    template: "%s · Mr Du"
  },
  description:
    "Mr Du tuyển chọn yến sào, hồng sâm, linh chi và thực phẩm chức năng cao cấp. Tư vấn theo người dùng, chính hãng, đóng gói quà biếu trang trọng.",
  openGraph: {
    title: "Mr Du · Maison sức khỏe cao cấp",
    description:
      "Yến sào, hồng sâm, linh chi và thực phẩm chức năng cao cấp, tư vấn theo người dùng, đóng gói quà biếu trang trọng.",
    url: siteUrl,
    siteName: "Mr Du",
    locale: "vi_VN",
    type: "website"
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">
          Bỏ qua điều hướng
        </a>
        <SiteHeader />
        <div id="main-content">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
