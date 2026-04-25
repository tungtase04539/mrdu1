import Link from "next/link";
import { CONTACT } from "@/lib/catalog";

export const metadata = {
  title: "Giới thiệu Mr Du",
  description:
    "Mr Du là maison tuyển chọn yến sào, hồng sâm, linh chi và thực phẩm chức năng cao cấp. Triết lý: chọn kỹ, tư vấn kỹ, đồng hành dài lâu."
};

const values = [
  {
    title: "Tuyển chọn khắt khe",
    body: "Chỉ làm việc với thương hiệu có xuất xứ minh bạch, chứng từ đầy đủ và hồ sơ sản phẩm rõ ràng. Mr Du dùng thử trước khi đưa lên website."
  },
  {
    title: "Tư vấn theo người dùng",
    body: "Mỗi đơn hàng bắt đầu bằng câu hỏi: ai sẽ dùng, trong dịp nào và ngân sách ra sao. Không bán theo xu hướng, không giới thiệu đại trà."
  },
  {
    title: "Đồng hành dài lâu",
    body: "Theo dõi phản hồi sau khi dùng, nhắc lịch chăm sóc, gợi ý thay đổi phác đồ khi cần. Mr Du phục vụ nhiều gia đình qua nhiều năm."
  }
];

const principles = [
  {
    eyebrow: "01 · Nguồn gốc",
    title: "Rõ nguồn gốc, rõ trách nhiệm",
    body: "Ưu tiên nhà phân phối chính ngạch, chứng từ nhập khẩu và hạn sử dụng minh bạch để khách hàng an tâm biếu tặng."
  },
  {
    eyebrow: "02 · Trải nghiệm",
    title: "Trải nghiệm trước khi giới thiệu",
    body: "Đội ngũ Mr Du dùng thử và ghi chú cảm quan: hương vị, mùi, độ phù hợp với người Việt, thời điểm dùng hợp lý."
  },
  {
    eyebrow: "03 · Đồng hành",
    title: "Không kết thúc ở đơn hàng",
    body: "Chúng tôi giữ liên lạc qua Zalo để nhắc liều dùng, đổi phác đồ khi cần và gợi ý dịp biếu tặng tiếp theo."
  }
];

export default function AboutPage() {
  return (
    <main className="page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Về Mr Du · Since 2013</p>
          <h1>Một maison sức khỏe cho những lựa chọn cần sự chỉn chu.</h1>
          <p className="lead">
            Mr Du tuyển chọn yến sào, hồng sâm, linh chi và sản phẩm bổ trợ từ các thương hiệu uy tín. Phục vụ bằng tư vấn kỹ, nguồn gốc rõ và trải nghiệm biếu tặng trang trọng.
          </p>
          <div className="actions">
            <Link className="button" href="/products">
              Xem bộ sưu tập
            </Link>
            <Link className="ghost-button" href="/lien-he">
              Nhận tư vấn
            </Link>
          </div>
        </div>
        <aside className="hero-card" aria-hidden>
          <span className="ring ring--lg" />
          <span className="ring ring--sm" />
          <div className="hero-card-inner">
            <p className="eyebrow">Sức khỏe · Trường thọ · Truyền đời</p>
            <h2>Niềm tin được xây từ chất lượng thật.</h2>
            <p>
              Mỗi sản phẩm là một quyết định đặt tên tuổi của Mr Du: nguồn gốc, thương hiệu, trải nghiệm và sự phù hợp với gia đình Việt.
            </p>
          </div>
        </aside>
      </section>

      <section className="section" aria-labelledby="about-values">
        <div className="section-title">
          <div>
            <p className="eyebrow">Ba cam kết</p>
            <h2 id="about-values">Điều Mr Du cam kết với khách hàng.</h2>
          </div>
        </div>
        <div className="trust-grid">
          {values.map((value) => (
            <article className="value-card" key={value.title}>
              <span className="hairline" aria-hidden />
              <h3>{value.title}</h3>
              <p className="lead">{value.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="about-principles">
        <div className="section-title">
          <div>
            <p className="eyebrow">Nguyên tắc maison</p>
            <h2 id="about-principles">Cách Mr Du chọn sản phẩm mỗi ngày.</h2>
            <p className="lead">
              Ba nguyên tắc được viết ra để mọi thành viên đều áp dụng khi duyệt sản phẩm mới hoặc tư vấn cho khách hàng.
            </p>
          </div>
        </div>
        <div className="grid grid-3">
          {principles.map((principle) => (
            <article className="knowledge-card" key={principle.title}>
              <p className="eyebrow">{principle.eyebrow}</p>
              <h3>{principle.title}</h3>
              <p className="lead">{principle.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="about-cta">
        <article className="testimonial-card info-card">
          <p className="eyebrow">Sẵn sàng đồng hành</p>
          <h2 id="about-cta">Mr Du luôn sẵn sàng lắng nghe nhu cầu của bạn.</h2>
          <p className="lead">
            Hotline {CONTACT.hotline} hoạt động {CONTACT.hours}. Zalo và form liên hệ được phản hồi trong giờ làm việc.
          </p>
          <div className="actions">
            <a className="button" href={CONTACT.zalo}>
              Tư vấn qua Zalo
            </a>
            <Link className="ghost-button" href="/lien-he">
              Gửi yêu cầu tư vấn
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
