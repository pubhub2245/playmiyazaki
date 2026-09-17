import type { Metadata } from "next";
import Link from "next/link";
import { PRIVATE_FOOTER } from "../../brand";

export const metadata: Metadata = {
  title: "Request received",
  robots: { index: false, follow: false },
};

export default function ThanksPage() {
  return (
    <main>
      <p className="mp-kicker">
        <Link href="/private">MIYAZAKI PRIVATE</Link>
      </p>
      <h1>Thank you</h1>

      <section className="mp-section">
        <p>
          Your request has been sent. We reply within 48 hours with a proposed
          evening and price.
        </p>
        <p>
          <Link href="/private/after-dark">MIYAZAKI AFTER DARK →</Link>
        </p>
      </section>

      <footer className="mp-footer">
        <p>{PRIVATE_FOOTER}</p>
      </footer>
    </main>
  );
}
