import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { CONTACT, categories, formatPrice, products } from "@/lib/catalog";
import { listCmsProducts } from "@/lib/supabase-rest";

type Props = {
  params: Promise<{ category: string; slug: string }>;
};

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return products.map((product) => ({
    category: product.categorySlug,
    slug: product.slug
  }));
}

export async function generateMetadata({ params }: Props) {
  const { category, slug } = await params;
  const product = (await listCmsProducts()).find(
    (item) => item.categorySlug === category && item.slug === slug
  );
  return {
    title: product ? product.title : "Sản phẩm",
    description: product?.shortDescription
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { category: categorySlug, slug } = await params;
  const allProducts = await listCmsProducts();
  const product = allProducts.find(
    (item) => item.categorySlug === categorySlug && item.slug === slug
  );
  if (!product) notFound();

  const related = allProducts
    .filter((item) => item.categorySlug === product.categorySlug && item.slug !== product.slug)
    .slice(0, 3);
  const category = categories.find((item) => item.slug === product.categorySlug);
  const hasPrice = typeof product.price === "number" && product.price > 0;

  return (
    <main className="page">
      <section className="section detail-grid" aria-label={`Chi tiết sản phẩm ${product.title}`}>
        <aside className="detail-media">
          <div className="product-media product-media--detail">
            <div className="product-badges">
              {product.badge ? <span>{product.badge}</span> : null}
              {product.featured ? <span>Nổi bật</span> : null}
            </div>
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.title} />
            ) : (
              <span className="product-placeholder" aria-hidden>
                {product.title.slice(0, 2)}
              </span>
            )}
          </div>
          <div className="detail-assurance" aria-label="Cam kết của Mr Du">
            <span>Chính hãng</span>
            <span>Tư vấn theo người dùng</span>
            <span>Giao hàng toàn quốc</span>
          </div>
        </aside>

        <article className="detail-panel">
          <p className="eyebrow">
            {product.brand}
            {category ? ` · ${category.title}` : ""}
          </p>
          <h1>{product.title}</h1>
          <p className="lead">{product.shortDescription}</p>

          <div className="product-buybox" aria-label="Thông tin mua hàng">
            <div className="price-row">
              <div>
                <small>{hasPrice ? "Giá tham khảo" : "Liên hệ Mr Du"}</small>
                <div className="detail-price">
                  {hasPrice ? formatPrice(product.price) : "Báo giá theo quy cách"}
                </div>
              </div>
              <div className="actions actions--compact">
                <a className="button" href={CONTACT.zalo}>
                  Tư vấn qua Zalo
                </a>
                <a className="ghost-button" href={`tel:${CONTACT.phoneHref}`}>
                  Hotline {CONTACT.hotline}
                </a>
              </div>
            </div>
            <div className="meta">
              <span>Xuất xứ: {product.origin ?? "Đang cập nhật"}</span>
              {product.subcategory ? <span>Phân nhóm: {product.subcategory}</span> : null}
              <span>
                {typeof product.stock === "number" && product.stock > 0
                  ? `Còn hàng (${product.stock})`
                  : "Liên hệ tồn kho"}
              </span>
            </div>
            <p className="note">
              Giá có thể thay đổi theo quy cách và thời điểm. Mr Du sẽ xác nhận giá, tồn kho và cách dùng phù hợp trước khi gửi hàng.
            </p>
          </div>

          <nav className="tabs" aria-label="Nội dung sản phẩm">
            <a href="#mo-ta">Mô tả</a>
            <a href="#thanh-phan">Thành phần</a>
            <a href="#cach-dung">Cách dùng</a>
            <a href="#cam-ket">Cam kết</a>
          </nav>
          <div className="detail-sections">
            <section>
              <h2 id="mo-ta">Mô tả sản phẩm</h2>
              <p>{product.description}</p>
            </section>
            <section>
              <h2 id="thanh-phan">Thành phần</h2>
              <p>{product.ingredients || "Đang cập nhật. Liên hệ Mr Du để nhận thông tin chi tiết."}</p>
            </section>
            <section>
              <h2 id="cach-dung">Cách dùng</h2>
              <p>
                {product.usage ||
                  "Vui lòng tham khảo hướng dẫn trên bao bì hoặc liên hệ Mr Du để được tư vấn cách dùng phù hợp với từng người sử dụng."}
              </p>
            </section>
            <section>
              <h2 id="cam-ket">Cam kết Mr Du</h2>
              <p>
                {product.commitment ||
                  "Cam kết chính hãng, tư vấn chuyên sâu theo người dùng, giao hàng toàn quốc và hỗ trợ sau mua theo chính sách Mr Du."}
              </p>
            </section>
          </div>
        </article>
      </section>

      <section className="section" aria-labelledby="related">
        <div className="section-title">
          <div>
            <p className="eyebrow">Cùng nhu cầu</p>
            <h2 id="related">Gợi ý tiếp theo trong bộ sưu tập.</h2>
          </div>
          {category ? (
            <Link className="ghost-button" href={`/products/${category.slug}`}>
              Xem tất cả {category.title}
            </Link>
          ) : null}
        </div>
        {related.length ? (
          <div className="product-grid product-grid--featured">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        ) : (
          <p className="lead">Hiện chưa có sản phẩm liên quan trong cùng bộ sưu tập.</p>
        )}
      </section>
    </main>
  );
}
