import { SITE_URL, type Lang } from "./i18n";

export function urlHome(lang: Lang): string {
  return `/${lang}`;
}

export function urlGenre(lang: Lang, genre: string): string {
  return `/${lang}/${genre}`;
}

export function urlCategory(lang: Lang, genre: string, category: string): string {
  return `/${lang}/${genre}/c/${category}`;
}

export function urlArea(lang: Lang, genre: string, area: string): string {
  return `/${lang}/${genre}/a/${area}`;
}

export function urlListing(lang: Lang, genre: string, slug: string): string {
  return `/${lang}/${genre}/${slug}`;
}

export function urlFeature(lang: Lang, genre: string, feature: string): string {
  return `/${lang}/${genre}/f/${feature}`;
}

export function absolute(p: string): string {
  return `${SITE_URL}${p}`;
}

export function googleMapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function urlAreaIndex(lang: Lang, area: string): string {
  return `/${lang}/a/${area}`;
}
