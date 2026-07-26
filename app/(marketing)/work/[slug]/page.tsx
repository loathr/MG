import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText } from "next-sanity";
import { sanityFetch } from "../../../../sanity/lib/fetch";
import { client } from "../../../../sanity/lib/client";
import { urlForImage } from "../../../../sanity/lib/image";

type GalleryItem = { url?: string; caption?: string; img?: unknown };
type Credit = { role?: string; name?: string };
type Project = {
  title: string; cat?: string; kind?: string; headline?: string; year?: string;
  summary?: string; body?: unknown[]; coverUrl?: string; cover?: unknown; videoUrl?: string;
  gallery?: GalleryItem[]; credits?: Credit[]; order?: number;
};
type NextProj = { title: string; slug: string; coverUrl?: string; cover?: unknown } | null;

const cap = (s?: string) => (s ? s[0].toUpperCase() + s.slice(1) : "");
const imgUrl = (url?: string, src?: unknown, w = 1600) =>
  url || urlForImage(src as never)?.width(w).url() || null;

const QUERY = `*[_type == "project" && slug.current == $slug][0]{
  title, "cat": category, kind, headline, year, summary, body,
  coverUrl, cover, videoUrl,
  "gallery": gallery[]{ url, caption, "img": image },
  credits[]{ role, name }, order
}`;

const NEXT_QUERY = `*[_type == "project" && order > $order] | order(order asc)[0]{
  title, "slug": slug.current, coverUrl, cover
}`;
const FIRST_QUERY = `*[_type == "project" && slug.current != $slug] | order(order asc)[0]{
  title, "slug": slug.current, coverUrl, cover
}`;

export async function generateStaticParams() {
  if (!client) return [];
  try {
    const slugs = await client.fetch<{ slug: string }[]>(
      `*[_type == "project" && defined(slug.current)]{ "slug": slug.current }`
    );
    return slugs.map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await sanityFetch<Project | null>(QUERY, null, { slug });
  return { title: p ? `${p.title} — Loathr` : "Project — Loathr" };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await sanityFetch<Project | null>(QUERY, null, { slug });
  if (!p) notFound();

  const hero = imgUrl(p.coverUrl, p.cover, 1920);
  const next: NextProj =
    (await sanityFetch<NextProj>(NEXT_QUERY, null, { order: p.order ?? 0 })) ||
    (await sanityFetch<NextProj>(FIRST_QUERY, null, { slug }));

  return (
    <>
      <section className="pdHero">
        {p.videoUrl ? (
          <video src={p.videoUrl} poster={hero || undefined} autoPlay muted loop playsInline />
        ) : hero ? (
          <img className="bg" src={hero} alt={p.title} />
        ) : null}
        {p.videoUrl ? <span className="pdVtag"><span className="p" />Film</span> : null}
        <div className="wrap">
          <div className="eyebrow mono">{p.cat ? <span style={{ color: "var(--red)" }}>{cap(p.cat)}</span> : null}{p.year ? ` · ${p.year}` : ""}</div>
          <h1>{p.title}</h1>
          {p.summary ? <p className="lead">{p.summary}</p> : null}
        </div>
      </section>

      <section><div className="wrap">
        <div className="pdMeta">
          <div className="cell"><div className="k">Discipline</div><div className="v">{p.kind || cap(p.cat) || "—"}</div></div>
          <div className="cell"><div className="k">Year</div><div className="v">{p.year || "2026"}</div></div>
          <div className="cell"><div className="k">Category</div><div className="v">{cap(p.cat) || "—"}</div></div>
        </div>

        <div className="pdStory">
          <div>
            <div className="eyebrow mono">The story</div>
            {p.headline ? <p className="lead" style={{ marginTop: 16 }}>{p.headline}</p> : null}
            <div className="body">
              {p.body && p.body.length ? (
                <PortableText value={p.body as never} />
              ) : (
                <p>{p.summary || "Details coming soon."}</p>
              )}
            </div>
          </div>
          {p.credits && p.credits.length ? (
            <div className="pdSide">
              {p.credits.map((c, i) => (
                <div className="row" key={i}><div className="k">{c.role}</div><div className="v">{c.name}</div></div>
              ))}
            </div>
          ) : null}
        </div>

        {p.gallery && p.gallery.length ? (
          <div className="pdGal">
            {p.gallery.map((g, i) => {
              const u = imgUrl(g.url, g.img, 1400);
              return u ? <div className="cell" key={i}><img src={u} alt={g.caption || p.title} loading="lazy" /></div> : null;
            })}
          </div>
        ) : null}
      </div></section>

      {next ? (
        <Link className="pdNext" href={`/work/${next.slug}`} data-cursor="Open" data-label="NEXT">
          {imgUrl(next.coverUrl, next.cover, 1600) ? <img src={imgUrl(next.coverUrl, next.cover, 1600)!} alt={next.title} /> : null}
          <div className="in"><div className="eyebrow mono">Next project</div><h2>{next.title}</h2></div>
        </Link>
      ) : null}

      <div className="band"><div className="g" /><div className="wrap">
        <h2 className="h-xl reveal">Let&apos;s build something<br /><em>undeniable.</em></h2>
        <div className="btnrow reveal d2" style={{ justifyContent: "center" }}><Link className="btn red" href="/contact" data-cursor="Let's talk" data-label="→">Start a project</Link></div>
      </div></div>
    </>
  );
}
