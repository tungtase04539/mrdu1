import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { categories } from "@/lib/catalog";
import { listCmsProducts } from "@/lib/supabase-rest";

export const metadata = {
  title: "Bộ sưu tập sản phẩm",
  description:
    "Khám phá boutique yến sào, an cung, sâm linh chi và thực phẩm chức năng cao cấp do Mr Du tuyển chọn."
};

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await listCmsProducts();
  const featured = products.filter((product) => product.featured);
  const curated = (featured.length ? featured : products).slice(0, 6);

  return (
    <main className="page">
      <section className="section" aria-labelledby="catalog-intro">
        <div className="section-title">
          <div>
            <p className="eyebrow">Bộ sưu tập Mr Du</p>
            <h2 id="catalog-intro">Boutique sức khỏe — chọn theo nhu cầu chăm sóc và biếu tặng.</h2>
            <p className="lead">
              Bốn dòng sản phẩm được sắp xếp như một maison: dễ chọn, dễ hỏi, dễ biếu tặng, luôn có người tư vấn đi cùng.
            </p>
          </div>
        </div>

        <div className="grid grid-2">
          {categories.map((category, index) => {
            const items = products
              .filter((item) => item.categorySlug === category.slug)
              .slice(0, 4);
            return (
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
                  <p>{category.description}</p>
                  <div className="category-tags">
                    {category.filters.slice(1, 4).map((filter) => (
                      <span className="tag" key={filter}>
                        {filter}
                      </span>
                    ))}
                  </div>
                  {items.length ? (
                    <div className="category-products">
                      {items.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${category.slug}/${product.slug}`}
                        >
                          {product.title}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  <Link className="ghost-button" href={`/products/${category.slug}`}>
                    Khám phá dòng này
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section" aria-labelledby="catalog-featured">
        <div className="section-title">
          <div>
            <p className="eyebrow">Curated selection</p>
            <h2 id="catalog-featured">Sản phẩm đang được quan tâm.</h2>
            <p className="lead">
              Gợi ý khởi đầu để Mr Du có cơ sở đề xuất chi tiết theo người dùng và ngân sách.
            </p>
          </div>
        </div>
        <div className="product-grid product-grid--featured">
          {curated.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
