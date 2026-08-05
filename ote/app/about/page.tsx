import Link from "next/link";
import type { Metadata } from "next";
import { SITE } from "../../lib/content";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <main className="about">
      <Link href="/" className="back">
        ‹ back to the wall
      </Link>
      <h1 className="grot">
        O<b>T</b>E
      </h1>
      <p className="lede">{SITE.about}</p>
      <div className="contact">
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        <a href="/">the wall →</a>
      </div>
    </main>
  );
}
