import { sanityFetch } from "../../../sanity/lib/fetch";

export const metadata = { title: "The Weekly — Loathr" };

type Issue = { no: string; t: string; d: string; dt: string };
type NL = {
  eyebrow: string; heading: string; lead: string;
  formKicker: string; placeholder: string; submitLabel: string; fineprint: string;
  archiveEyebrow: string; archiveHeading: string; issues: Issue[];
};

const F: NL = {
  eyebrow: "The Weekly",
  heading: "One issue a week.\nAssembled from the week.",
  lead: "The best of what loathrdotcom generated this week — culture, enterprise, and the news desk — in one edition. No filler.",
  formKicker: "Subscribe · free",
  placeholder: "you@company.com",
  submitLabel: "Subscribe",
  fineprint: "Weekly. Unsubscribe anytime. Sound-designed reading experience on the web edition.",
  archiveEyebrow: "Archive",
  archiveHeading: "Past issues",
  issues: [
    { no: "Issue 042", t: "The one where nobody blinked", d: "Split verdicts, a market read, and three things worth loathing.", dt: "Jul 20, 2026 · 6 posts" },
    { no: "Issue 041", t: "Receipts & second-order effects", d: "The stories that mattered, read and argued from every angle.", dt: "Jul 13, 2026 · 5 posts" },
    { no: "Issue 040", t: "Standards, not cynicism", d: "Forty issues in. A retrospective on the takes that aged well.", dt: "Jul 6, 2026 · 7 posts" },
  ],
};

const QUERY = `*[_type == "newsletterPage"][0]{
  eyebrow, heading, lead, formKicker, placeholder, submitLabel, fineprint,
  archiveEyebrow, archiveHeading, issues[]{ no, t, d, dt }
}`;

const arr = <T,>(a: T[] | undefined, f: T[]) => (a && a.length ? a : f);

export default async function Newsletter() {
  const cms = await sanityFetch<Partial<NL> | null>(QUERY, null);
  const c = { ...F, ...(cms || {}) };
  const [h1, h2] = (c.heading || F.heading).split("\n");

  return (
    <>
      <section><div className="wrap" style={{ paddingTop: 112 }}>
        <div className="nlhero">
          <div>
            <div className="eyebrow mono reveal">{c.eyebrow || F.eyebrow}</div>
            <h1 className="h-hd reveal d1">{h1}{h2 ? <><br />{h2}</> : null}</h1>
            <p className="lead reveal d2" style={{ marginTop: 22 }}>{c.lead || F.lead}</p>
          </div>
          <div className="nlform reveal d2">
            <div className="k">{c.formKicker || F.formKicker}</div>
            <div className="in">
              <input placeholder={c.placeholder || F.placeholder} aria-label="Email address" />
              <button type="button" className="btn red" data-cursor="Join" data-label="→">{c.submitLabel || F.submitLabel}</button>
            </div>
            <p style={{ color: "var(--mut2)", fontSize: 12, marginTop: 12 }}>{c.fineprint || F.fineprint}</p>
          </div>
        </div>
      </div></section>

      <section><div className="wrap">
        <div className="shead reveal"><div><div className="eyebrow mono">{c.archiveEyebrow || F.archiveEyebrow}</div><h2 className="h-md">{c.archiveHeading || F.archiveHeading}</h2></div></div>
        <div className="issues">
          {arr(c.issues, F.issues).map((i) => (
            <div className="issue" key={i.no} data-cursor="Read" data-label="READ"><div className="no">{i.no}</div><h4>{i.t}</h4><p>{i.d}</p><div className="dt">{i.dt}</div></div>
          ))}
        </div>
      </div></section>
    </>
  );
}
