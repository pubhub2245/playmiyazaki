import { z } from "zod";

export const localizedString = z
  .object({
    ja: z.string().min(1),
    en: z.string().min(1),
    ko: z.string().min(1).optional(),
  })
  .transform((v) => ({ ja: v.ja, en: v.en, ko: v.ko ?? v.en }));

export const localizedStringNullable = z
  .object({
    ja: z.string().nullable(),
    en: z.string().nullable(),
    ko: z.string().nullable().optional(),
  })
  .transform((v) => ({ ja: v.ja, en: v.en, ko: v.ko ?? v.en }))
  .nullable();

export const listingSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be lowercase-hyphen"),
  genre: z.enum(["surf", "camp", "food", "golf", "nature"]),
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
      ko: z.string().max(160, "description.ko must be <=160 chars").nullable().optional(),
    })
    .transform((v) => ({ ja: v.ja, en: v.en, ko: v.ko ?? v.en }))
    .nullable(),
  tags: z.array(z.string()).nullable(),
  features: z.array(z.string()),
  sources: z.array(z.string().url()).min(1, "sources must have at least 1 URL"),
  verified_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "verified_at must be YYYY-MM-DD"),
  status: z.enum(["open", "closed", "unknown"]),
});

export type Listing = z.output<typeof listingSchema>;
export type ListingInput = z.input<typeof listingSchema>;

const labeledEntry = z
  .object({
    slug: z.string(),
    ja: z.string(),
    en: z.string(),
    ko: z.string().optional(),
  })
  .transform((v) => ({ slug: v.slug, ja: v.ja, en: v.en, ko: v.ko ?? v.en }));

const featureEntry = z
  .object({
    slug: z.string(),
    ja: z.string(),
    en: z.string(),
    ko: z.string().optional(),
    heading_ja: z.string(),
    heading_en: z.string(),
    heading_ko: z.string().optional(),
  })
  .transform((v) => ({
    slug: v.slug,
    ja: v.ja,
    en: v.en,
    ko: v.ko ?? v.en,
    heading_ja: v.heading_ja,
    heading_en: v.heading_en,
    heading_ko: v.heading_ko ?? v.heading_en,
  }));

export type FeatureEntry = z.infer<typeof featureEntry>;

export const taxonomySchema = z.object({
  genres: z.array(labeledEntry),
  categories: z.record(z.string(), z.array(labeledEntry)),
  features: z.record(z.string(), z.array(featureEntry)),
  areas: z.array(labeledEntry),
});

export type Taxonomy = z.infer<typeof taxonomySchema>;
