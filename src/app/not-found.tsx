import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Không tìm thấy",
  robots: {
    index: false,
    follow: true
  }
};

export default function NotFound() {
  return (
    <main className="page">
      <section className="section">
        <div className="info-card">
          <p className="eyebrow">Không tìm thấy</p>
          <h1>Trang này không tồn tại</h1>
          <p className="lead">Liên kết có thể đã thay đổi hoặc sản phẩm đang được cập nhật.</p>
          <div className="actions">
            <Link className="button" href="/products">
              Xem sản phẩm
            </Link>
            <Link className="ghost-button" href="/">
              Về trang chủ
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
