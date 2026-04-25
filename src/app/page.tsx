import Link from "next/link";
import { LeadForm } from "@/components/lead-form";
import { ProductCard } from "@/components/product-card";
import { CONTACT, categories, getFeaturedProducts } from "@/lib/catalog";
import { listCmsProducts } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cmsProducts = await listCmsProducts();
  const cmsFeatured = cmsProducts.filter((item) => item.featured);
  const featuredProducts = (cmsFeatured.length ? cmsFeatured : getFeaturedProducts()).slice(0, 6);

  const proofItems = [
    "Chính hãng · Nguồn gốc rõ",
    "Tư vấn theo người dùng",
    "Đóng gói quà biếu trang trọng",
    "Phản hồi trong giờ làm việc"
  ];

  const values = [
    {
      title: "Tuyển chọn như một maison",
      body: "Mr Du chỉ giới thiệu thương hiệu có xuất xứ minh bạch, chứng từ đầy đủ và trải nghiệm người dùng thực tế đủ tốt để mang đi biếu tặng."
    },
    {
      title: "Tư vấn theo người dùng",
      body: "Chúng tôi hỏi về người sẽ dùng, dịp biếu tặng và ngân sách trước khi gợi ý. Không bán rập khuôn, không chạy theo xu hướng."
    },
    {
      title: "Đồng hành sau khi mua",
      body: "Theo dõi phản hồi sử dụng, hướng dẫn cách dùng đúng và nhắc lịch chăm sóc khi khách hàng cần, để mỗi hộp quà đều có ý nghĩa dài lâu."
    }
  ];

  return (
    <main className="page">
      {/* Hero */}
      <section className="hero" aria-label="Giới thiệu maison">
        <div className="hero-copy">
          <p className="eyebrow">Mr Du · Maison sức khỏe · Since 2013</p>
          <h1>Quà sức khỏe cao cấp, chọn riêng cho từng người thân.</h1>
          <p className="lead">
            Yến sào, hồng sâm, linh chi và thực phẩm chức năng được tuyển chọn theo nguồn gốc, thương hiệu và sự phù hợp với người dùng. Mr Du tư vấn như một người quen chỉn chu, giúp bạn chọn đúng món quà trước những dịp quan trọng.
          </p>
          <div className="actions">
            <Link className="button" href="/lien-he">
              Nhận tư vấn chọn sản phẩm
            </Link>
            <Link className="ghost-button" href="/products">
              Xem bộ sưu tập
            </Link>
          </div>
          <div className="hero-proof" aria-label="Cam kết nổi bật">
            {proofItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <aside className="hero-card" aria-hidden>
          <span className="ring ring--lg" />
          <span className="ring ring--sm" />
          <div className="hero-card-inner">
            <p className="eyebrow">The ritual of longevity</p>
            <h2>Mỗi món quà là một lời chúc được cân nhắc.</h2>
            <p>
              Mr Du chuẩn bị sản phẩm theo người nhận: người cao tuổi, đối tác, hậu phẫu hay phụ nữ sau sinh đều có một phương án gợi ý riêng.
            </p>
          </div>
        </aside>
      </section>

      {/* Trust / values */}
      <section className="section" aria-labelledby="section-values">
        <div className="section-title">
          <div>
            <p className="eyebrow">Concierge wellness</p>
            <h2 id="section-values">Không chỉ bán sản phẩm, Mr Du giúp bạn chọn đúng.</h2>
            <p className="lead">
              Ba cam kết xuyên suốt từ lúc bạn nhắn tin đến khi sản phẩm đến tay người nhận.
            </p>
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

      {/* Categories */}
      <section className="section" aria-labelledby="section-categories">
        <div className="section-title">
          <div>
            <p className="eyebrow">Bộ sưu tập chủ lực</p>
            <h2 id="section-categories">Những hành trình chăm sóc được tuyển chọn.</h2>
            <p className="lead">
              Bốn dòng sản phẩm để bắt đầu một lịch chăm sóc đều đặn hoặc một món quà biếu tặng đúng ý.
            </p>
          </div>
          <Link className="ghost-button" href="/products">
            Tất cả bộ sưu tập
          </Link>
        </div>
        <div className="grid grid-2">
          {categories.map((category, index) => (
            <article className="category-panel" key={category.slug}>
              <div className="category-panel-media">
                <span className="category-panel-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={category.image} alt={category.imageAlt} loading="lazy" />
                <span className="category-panel-accent">{category.accent}</span>
              </div>
              <div className="category-panel-body">
                <p className="eyebrow">{category.eyebrow.replace(/^\d+\s*\/\s*/, "")}</p>
                <h3>{category.title}</h3>
                <p className="lead">{category.description}</p>
                <div className="category-tags">
                  {category.filters.slice(1, 4).map((filter) => (
                    <span className="tag" key={filter}>
                      {filter}
                    </span>
                  ))}
                </div>
                <Link className="ghost-button" href={`/products/${category.slug}`}>
                  Khám phá dòng này
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="section" aria-labelledby="section-featured">
        <div className="section-title">
          <div>
            <p className="eyebrow">Tuyển chọn nổi bật</p>
            <h2 id="section-featured">Những sản phẩm đang được Mr Du ưu tiên giới thiệu.</h2>
            <p className="lead">
              Gợi ý để bắt đầu trước khi Mr Du tư vấn chi tiết theo người dùng và ngân sách.
            </p>
          </div>
          <Link className="ghost-button" href="/products">
            Tất cả sản phẩm
          </Link>
        </div>
        <div className="product-grid product-grid--featured">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Trust stats */}
      <section className="section section--tight" aria-labelledby="section-stats">
        <div className="section-title">
          <div>
            <p className="eyebrow">Niềm tin tích lũy</p>
            <h2 id="section-stats">Một tiêu chuẩn phục vụ được giữ qua từng đơn hàng.</h2>
          </div>
        </div>
        <div className="stats">
          <Stat value="12+" label="Năm đồng hành" />
          <Stat value="5,000+" label="Khách hàng tin dùng" />
          <Stat value={`${Math.max(cmsProducts.length, 1)}+`} label="Sản phẩm chính hãng" />
          <Stat value="04" label="Dòng sản phẩm chủ lực" />
        </div>
      </section>

      {/* Testimonial + contact */}
      <section className="section contact-grid" aria-labelledby="section-contact">
        <article className="testimonial-card">
          <p className="eyebrow">Khách hàng nói về Mr Du</p>
          <blockquote className="quote">
            <p>
              Điều mình thích là Mr Du tư vấn rất kỹ: mua cho bố mẹ, biếu đối tác hay dùng hằng ngày đều được gợi ý khác nhau, không bán đại trà.
            </p>
            <footer>Chị Minh Thư · Hà Nội</footer>
          </blockquote>
          <div className="actions">
            <a className="button" href={`tel:${CONTACT.phoneHref}`}>
              Hotline {CONTACT.hotline}
            </a>
            <a className="ghost-button" href={CONTACT.zalo}>
              Chat Zalo ngay
            </a>
          </div>
        </article>
        <div className="form-card">
          <p className="eyebrow">Concierge tư vấn</p>
          <h2 id="section-contact">Để lại nhu cầu, Mr Du phản hồi trong giờ làm việc.</h2>
          <p className="lead">
            Chia sẻ người sẽ dùng, dịp biếu tặng và ngân sách ước chừng. Mr Du sẽ gợi ý 2–3 phương án trước khi xác nhận giá và tồn kho.
          </p>
          <LeadForm />
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
