/** MIYAZAKI PRIVATE. Separate brand, same deployment. See docs/private.md. */
export const PRIVATE_URL = "https://playmiyazaki.com";

export const PRIVATE_FOOTER =
  "MIYAZAKI PRIVATE is operated by Alpha Inc., Miyazaki. We plan and host the experience; accommodation, flights and transport are arranged by you.";

/** Set by the operator in Vercel. Never write an address into the repo. */
export const REQUEST_FORM_ENDPOINT =
  process.env.NEXT_PUBLIC_REQUEST_FORM_ENDPOINT ?? "";
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";
