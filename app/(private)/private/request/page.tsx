import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, PRIVATE_FOOTER, REQUEST_FORM_ENDPOINT } from "../brand";

export const metadata: Metadata = {
  title: "Request a private evening",
  description:
    "Send a request for MIYAZAKI AFTER DARK. We reply within 48 hours.",
  alternates: { canonical: "/private/request" },
};

const NOTE =
  "We reply within 48 hours. Your details are used only to plan your evening.";

const STAYING = [
  "central Miyazaki City",
  "elsewhere in Miyazaki",
  "not decided",
];

const GUESTS = ["2", "3", "4", "5", "6"];

const EVENINGS = [
  "After Dark private evening",
  "Nishitachi Night with a Local",
  "Local on Call",
  "7-Day Route",
];

/** Template for the mailto fallback: the same fields as the form. */
const MAIL_SUBJECT = "Request: MIYAZAKI PRIVATE";
const MAIL_BODY = [
  "Name:",
  "Email:",
  "Which evening? (After Dark private evening / Nishitachi Night with a Local / Local on Call / 7-Day Route):",
  "Preferred dates (2-3 options):",
  "Number of guests (2-6):",
  "Where you will be staying (central Miyazaki City / elsewhere in Miyazaki / not decided):",
  "Language (English / other):",
  "Anything you'd like us to know (dietary needs, occasion, interests):",
  "",
].join("\n");

export default function RequestPage() {
  return (
    <main>
      <p className="mp-kicker">
        <Link href="/private">MIYAZAKI PRIVATE</Link>
      </p>
      <h1>Request a private evening</h1>

      <section className="mp-section">
        {REQUEST_FORM_ENDPOINT ? (
          <RequestForm endpoint={REQUEST_FORM_ENDPOINT} />
        ) : CONTACT_EMAIL ? (
          <MailFallback email={CONTACT_EMAIL} />
        ) : (
          <p>Requests open shortly.</p>
        )}
        <p className="mp-muted" style={{ marginTop: "32px", fontSize: "14px" }}>
          {NOTE}
        </p>
      </section>

      <footer className="mp-footer">
        <p>{PRIVATE_FOOTER}</p>
      </footer>
    </main>
  );
}

function RequestForm({ endpoint }: { endpoint: string }) {
  return (
    <form action={endpoint} method="post">
      {/* Spam trap. Real guests never see or fill this. */}
      <div className="mp-hp" aria-hidden>
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="_next" value="/private/request/thanks" />

      <label className="mp-field">
        <span>Name</span>
        <input type="text" name="name" required autoComplete="name" />
      </label>

      <label className="mp-field">
        <span>Email</span>
        <input type="email" name="email" required autoComplete="email" />
      </label>

      <label className="mp-field">
        <span>Which evening?</span>
        <select name="evening" defaultValue={EVENINGS[0]}>
          {EVENINGS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </label>

      <label className="mp-field">
        <span>Preferred dates (2–3 options)</span>
        <textarea name="dates" rows={3} required />
      </label>

      <label className="mp-field">
        <span>Number of guests (2–6)</span>
        <select name="guests" defaultValue="2">
          {GUESTS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>

      <label className="mp-field">
        <span>Where you will be staying</span>
        <select name="staying" defaultValue={STAYING[0]}>
          {STAYING.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="mp-field">
        <span>Language (English / other)</span>
        <input type="text" name="language" defaultValue="English" />
      </label>

      <label className="mp-field">
        <span>Anything you&rsquo;d like us to know (dietary needs, occasion, interests)</span>
        <textarea name="notes" rows={4} />
      </label>

      <button className="mp-btn" type="submit">
        Send request
      </button>
    </form>
  );
}

function MailFallback({ email }: { email: string }) {
  const href =
    `mailto:${email}` +
    `?subject=${encodeURIComponent(MAIL_SUBJECT)}` +
    `&body=${encodeURIComponent(MAIL_BODY)}`;
  return (
    <p>
      <a className="mp-btn" href={href}>
        Email us at {email}
      </a>
    </p>
  );
}
