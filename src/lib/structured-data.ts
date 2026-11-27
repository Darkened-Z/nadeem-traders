import type { ProductSeoData } from "./actions";

export const SITE_URL = "https://nadeemtraders.com";

export function toAbsoluteUrl(pathOrUrl?: string | null): string | undefined {
  if (!pathOrUrl) return undefined;
  const trimmed = pathOrUrl.trim();
  if (!trimmed || trimmed.startsWith("data:")) return undefined;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `${SITE_URL}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Nadeem Traders",
    url: SITE_URL,
    logo: `${SITE_URL}/LOGO.png`,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Nadeem Traders",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function productJsonLd(
  product: ProductSeoData,
  displayName: string,
  description: string,
) {
  const productUrl = `${SITE_URL}/product/${product.id}`;
  const availability =
    product.stock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock";

  const optionImages = product.options
    .map((o) => toAbsoluteUrl(o.image_url))
    .filter((u): u is string => !!u);
  const mainImage = toAbsoluteUrl(product.image_url);
  const uniqueImages = [...new Set([...optionImages, ...(mainImage ? [mainImage] : [])])];
  const imageField =
    uniqueImages.length > 1 ? uniqueImages : uniqueImages[0] ?? `${SITE_URL}/LOGO.png`;

  const schema: {
    "@context": string;
    "@type": string;
    name: string;
    image: string | string[];
    description: string;
    sku: string;
    url: string;
    brand: { "@type": string; name: string };
    offers?: Record<string, unknown>;
  } = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: displayName,
    image: imageField,
    description,
    sku: String(product.id),
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: "Nadeem Traders",
    },
  };

  if (product.options.length > 0) {
    const priced = product.options.filter(
      (o): o is typeof o & { price: number } => o.price != null,
    );
    if (priced.length > 0) {
      const prices = priced.map((o) => o.price);
      schema.offers = {
        "@type": "AggregateOffer",
        lowPrice: Math.min(...prices),
        highPrice: Math.max(...prices),
        offerCount: priced.length,
        priceCurrency: "PKR",
        offers: priced.map((o) => ({
          "@type": "Offer",
          name: o.name,
          price: o.price,
          priceCurrency: "PKR",
          availability,
          url: productUrl,
        })),
      };
    }
  } else if (product.price != null) {
    schema.offers = {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "PKR",
      availability,
      url: productUrl,
    };
  }

  return schema;
}
