import { absolute } from "./url";

export type JsonLdObject = Record<string, unknown>;

/** A crumb trail as BreadcrumbList. Crumbs without href get no `item`. */
export function breadcrumbJsonLd(
  crumbs: { label: string; href?: string }[],
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => {
      const el: JsonLdObject = {
        "@type": "ListItem",
        position: i + 1,
        name: c.label,
      };
      if (c.href) el.item = absolute(c.href);
      return el;
    }),
  };
}

/**
 * A directory page as CollectionPage + ItemList.
 * Only facts already on the page: the heading, the page URL, and the
 * name + URL of every listing shown, in the order they are shown.
 */
export function collectionJsonLd(args: {
  name: string;
  description: string;
  path: string;
  items: { name: string; href: string }[];
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: args.name,
    description: args.description,
    url: absolute(args.path),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: args.items.length,
      itemListElement: args.items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        url: absolute(it.href),
      })),
    },
  };
}
