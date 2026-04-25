import Link from "next/link";
import { CONTACT } from "@/lib/catalog";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Mr Du · Maison sức khỏe cao cấp">
        <span>Mr Du</span>
        <small>Maison · Since 2013</small>
      </Link>
      <nav className="site-nav" aria-label="Điều hướng chính">
        <Link href="/products">Sản phẩm</Link>
        <Link href="/gioi-thieu">Giới thiệu</Link>
        <Link href="/lien-he">Liên hệ</Link>
        <a className="nav-hotline" href={`tel:${CONTACT.phoneHref}`}>
          {CONTACT.hotline}
        </a>
        <a className="nav-cta" href={CONTACT.zalo}>
          Tư vấn Zalo
        </a>
      </nav>
    </header>
  );
}
