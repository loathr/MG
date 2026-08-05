import Link from "next/link";
import MediaWall from "../components/MediaWall";
import { SITE } from "../lib/content";

export default function Home() {
  return (
    <main>
      <MediaWall />
      <Link href="/about" className="brand grot" aria-label={`${SITE.name} — about`}>
        O<b>T</b>E
      </Link>
      <div className="who">
        {SITE.name}
        <br />
        <Link href="/about">about · contact</Link>
      </div>
      <div className="hint">the wall is live · hover to read · click a panel to enter</div>
    </main>
  );
}
