import Link from "next/link";
import { CONTACT, categories } from "@/lib/catalog";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-wrap">
        <div className="footer-brand">
          <p className="eyebrow">Mr Du · Maison sức khỏe · Since 2013</p>
          <h2>Quà sức khỏe cao cấp, tư vấn kỹ cho từng người dùng.</h2>
          <p>
            Yến sào, hồng sâm, linh chi và thực phẩm chức năng được tuyển chọn theo nguồn gốc, trải nghiệm sử dụng và sự phù hợp với gia đình Việt. Mr Du đồng hành trước và sau khi mua.
          </p>
        </div>

        <div className="footer-grid">
          <div>
            <h3>Bộ sưu tập</h3>
            <ul className="footer-links">
              <li>
                <Link href="/products">Tất cả sản phẩm</Link>
              </li>
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link href={`/products/${category.slug}`}>{category.title}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Concierge tư vấn</h3>
            <ul className="footer-links">
              <li>
                <a href={`tel:${CONTACT.phoneHref}`}>Hotline {CONTACT.hotline}</a>
              </li>
              <li>
                <a href={CONTACT.zalo}>Chat Zalo</a>
              </li>
              <li>
                <Link href="/lien-he">Gửi yêu cầu tư vấn</Link>
              </li>
              <li>
                <Link href="/gioi-thieu">Về Mr Du</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3>Thông tin maison</h3>
            <p className="muted">{CONTACT.address}</p>
            <p className="muted">{CONTACT.hours}</p>
            <p className="muted">Phản hồi Zalo/hotline trong khoảng 30 phút giờ làm việc.</p>
          </div>

          <div>
            <h3>Cam kết Mr Du</h3>
            <p className="muted">
              Sản phẩm chính hãng, nguồn gốc minh bạch, tư vấn theo nhu cầu và hỗ trợ sau mua theo chính sách maison.
            </p>
          </div>
        </div>

        <p className="footer-note">
          Thông tin trên website chỉ phục vụ tư vấn sản phẩm, không thay thế chẩn đoán hoặc chỉ định y tế. Vui lòng đọc kỹ hướng dẫn sử dụng và hỏi chuyên môn khi đang điều trị, mang thai hoặc dùng thuốc thường xuyên.
        </p>
        <div className="footer-legal">
          <span>© {new Date().getFullYear()} Mr Du</span>
          <span>Hải Phòng · Việt Nam</span>
          <Link href="/lien-he">Liên hệ hợp tác</Link>
        </div>
      </div>
    </footer>
  );
}
