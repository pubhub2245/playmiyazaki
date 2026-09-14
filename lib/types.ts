import { z } from "zod";

export const localizedString = z.object({
  ja: z.string().min(1),
  en: z.string().min(1),
});

export const localizedStringNullable = z
  .object({
    ja: z.string().nullable(),
    en: z.string().nullable(),
  })
  .nullable();

export const listingSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be lowercase-hyphen"),
  genre: z.enum(["surf", "camp", "food", "golf"]),
  category: z.array(z.string().min(1)).min(1),
  area: z.string().min(1),
  name: localizedString,
  address: localizedString,
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  phone: z.string().nullable(),
  website: z.string().url().nullable(),
  google_maps_url: z.string().url().nullable(),
  hours: localizedStringNullable,
  price: localizedStringNullable,
  description: z
    .object({
      ja: z.string().max(120, "description.ja must be <=120 chars").nullable(),
      en: z.string().max(160, "description.en must be <=160 chars").nullable(),
    })
    .nullable(),
  tags: z.array(z.string()).nullable(),
  sources: z.array(z.string().url()).min(1, "sources must have at least 1 URL"),
  verified_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "verified_at must be YYYY-MM-DD"),
  status: z.enum(["open", "closed", "unknown"]),
});

export type Listing = z.infer<typeof listingSchema>;

export const taxonomySchema = z.object({
  genres: z.array(z.object({ slug: z.string(), ja: z.string(), en: z.string() })),
  categories: z.record(
    z.string(),
    z.array(z.object({ slug: z.string(), ja: z.string(), en: z.string() })),
  ),
  areas: z.array(z.object({ slug: z.string(), ja: z.string(), en: z.string() })),
});

export type Taxonomy = z.infer<typeof taxonomySchema>;
