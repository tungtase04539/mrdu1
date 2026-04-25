import Link from "next/link";
import { formatPrice, type Product } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  const kicker = [product.subcategory, product.origin].filter(Boolean) as string[];
  const hasPrice = typeof product.price === "number" && product.price > 0;

  return (
    <Link
      className="product-card"
      href={`/products/${product.categorySlug}/${product.slug}`}
      aria-label={`Xem chi tiết ${product.title}`}
    >
      <div className="product-media">
        {product.badge || product.featured ? (
          <div className="product-badges">
            <span>{product.badge ?? "Nổi bật"}</span>
          </div>
        ) : null}
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.title} loading="lazy" />
        ) : (
          <span className="product-placeholder" aria-hidden>
            {product.title.slice(0, 2)}
          </span>
        )}
      </div>
      <div className="product-body">
        {kicker.length ? (
          <div className="product-kicker">
            {kicker.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}
        <h3>{product.title}</h3>
        <p>{product.shortDescription}</p>
        <div className="product-commerce">
          <span className="product-price">
            <strong>{hasPrice ? formatPrice(product.price) : "Liên hệ"}</strong>
            <small>{hasPrice ? "Giá tham khảo" : "Để Mr Du báo giá"}</small>
          </span>
          <em>Xem chi tiết</em>
        </div>
      </div>
    </Link>
  );
}
