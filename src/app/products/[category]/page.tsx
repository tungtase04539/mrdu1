import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { CONTACT, categories, getCategory } from "@/lib/catalog";
import { listCmsProducts } from "@/lib/supabase-rest";

type Props = {
  params: Promise<{ category: string }>;
};

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  return {
    title: category ? category.title : "Sản phẩm",
    description: category?.description
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const items = (await listCmsProducts()).filter(
    (product) => product.categorySlug === category.slug
  );

  return (
    <main className="page">
      <section className="section" aria-labelledby="category-intro">
        <div className="section-title">
          <div>
            <p className="eyebrow">{category.eyebrow}</p>
            <h2 id="category-intro">{category.title}</h2>
            <p className="lead">{category.description}</p>
          </div>
          <Link className="ghost-button" href="/products">
            Tất cả bộ sưu tập
          </Link>
        </div>

        <div className="catalog-toolbar" role="region" aria-label="Tổng quan bộ sưu tập">
          <p>
            <strong>{items.length}</strong> sản phẩm đang hiển thị trong bộ sưu tập {category.title}
          </p>
          <div className="filters" aria-label="Nhóm sản phẩm tham khảo">
            {category.filters.map((filter, index) => (
              <span key={filter}>
                {filter}
                {index === 0 ? ` (${items.length})` : ""}
              </span>
            ))}
          </div>
        </div>

        {items.length ? (
          <div className="product-grid product-grid--catalog">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <section className="empty-state">
            <p className="eyebrow">Đang cập nhật</p>
            <h2>Sản phẩm mới sắp về maison.</h2>
            <p className="lead">
              Liên hệ Mr Du để được tư vấn dòng phù hợp trước khi hàng lên website.
            </p>
            <div className="actions">
              <a className="button" href={CONTACT.zalo}>
                Tư vấn qua Zalo
              </a>
              <a className="ghost-button" href={`tel:${CONTACT.phoneHref}`}>
                Hotline {CONTACT.hotline}
              </a>
            </div>
          </section>
        )}
      </section>

      <section className="section" aria-labelledby="category-edu">
        <div className="section-title">
          <div>
            <p className="eyebrow">Kiến thức chuyên sâu</p>
            <h2 id="category-edu">Hiểu đúng về {category.title}.</h2>
            <p className="lead">
              Ba góc nhìn ngắn gọn giúp bạn chọn sản phẩm và tư vấn cho người thân tự tin hơn.
            </p>
          </div>
        </div>
        <div className="grid grid-3">
          {category.education.map((item, index) => (
            <article className="knowledge-card" key={item.title}>
              <span className="number" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{item.title}</h3>
              <p className="lead">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
