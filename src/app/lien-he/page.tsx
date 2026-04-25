import { LeadForm } from "@/components/lead-form";
import { CONTACT } from "@/lib/catalog";

export const metadata = {
  title: "Liên hệ · Concierge tư vấn",
  description:
    "Liên hệ Mr Du qua hotline, Zalo hoặc form tư vấn để được hỗ trợ chọn sản phẩm sức khỏe phù hợp với người dùng và ngân sách."
};

export default function ContactPage() {
  return (
    <main className="page">
      <section className="section" aria-labelledby="contact-intro">
        <div className="section-title">
          <div>
            <p className="eyebrow">Concierge tư vấn</p>
            <h2 id="contact-intro">Trao đổi nhu cầu, Mr Du giúp bạn chọn đúng sản phẩm.</h2>
            <p className="lead">
              Chia sẻ người sẽ dùng, dịp biếu tặng và ngân sách. Đội ngũ tư vấn sẽ gợi ý 2–3 phương án, xác nhận giá, tồn kho và cách dùng trước khi gửi hàng.
            </p>
          </div>
        </div>

        <div className="contact-grid">
          <aside className="info-card" aria-label="Thông tin liên hệ Mr Du">
            <p className="eyebrow">Thông tin liên hệ</p>
            <h2>Chọn cách thuận tiện nhất để trò chuyện.</h2>
            <ul className="info-list">
              <li>
                <a href={`tel:${CONTACT.phoneHref}`}>
                  Hotline {CONTACT.hotline}
                </a>
              </li>
              <li>
                <a href={CONTACT.zalo}>Zalo · Phản hồi trong giờ làm việc</a>
              </li>
            </ul>

            <h3>Địa chỉ maison</h3>
            <p>{CONTACT.address}</p>

            <h3>Giờ làm việc</h3>
            <p>{CONTACT.hours}</p>

            <h3>Thời gian phản hồi</h3>
            <p>Mr Du phản hồi Zalo và hotline trong khoảng 30 phút giờ làm việc. Form liên hệ được xử lý trong cùng ngày làm việc.</p>
          </aside>

          <div className="form-card">
            <p className="eyebrow">Gửi yêu cầu tư vấn</p>
            <h2>Để lại thông tin, Mr Du sẽ phản hồi trong giờ làm việc.</h2>
            <p className="lead">
              Mô tả ngắn về người sẽ dùng (độ tuổi, tình trạng sức khỏe nếu muốn chia sẻ), dịp biếu tặng và ngân sách. Thông tin này giúp Mr Du đưa gợi ý sát nhu cầu nhất.
            </p>
            <LeadForm />
          </div>
        </div>
      </section>
    </main>
  );
}
