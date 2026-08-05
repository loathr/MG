import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MediaWall from "../../components/MediaWall";
import { DISCIPLINES, findDiscipline } from "../../lib/content";

export function generateStaticParams() {
  return DISCIPLINES.map((d) => ({ discipline: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ discipline: string }>;
}): Promise<Metadata> {
  const { discipline } = await params;
  const d = findDiscipline(discipline);
  return { title: d ? d.name : "Not found" };
}

export default async function DisciplinePage({
  params,
}: {
  params: Promise<{ discipline: string }>;
}) {
  const { discipline } = await params;
  const d = findDiscipline(discipline);
  if (!d) notFound();

  const idx = DISCIPLINES.findIndex((x) => x.slug === d.slug) + 1;

  return (
    <main>
      <MediaWall disciplineSlug={d.slug} />
      <Link href="/" className="back">
        ‹ back to the wall
      </Link>
      <div className="sec-title">
        <div className="t grot">{d.name}</div>
        <div className="s mono">
          Channel {String(idx).padStart(2, "0")} · {d.blurb}
        </div>
      </div>
      <div className="hint">click a piece to open</div>
    </main>
  );
}
