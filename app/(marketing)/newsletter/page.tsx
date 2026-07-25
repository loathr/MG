export const metadata = { title: "The Weekly — Loathr" };

const ISSUES = [
  { no: "Issue 042", t: "The one where nobody blinked", d: "Split verdicts, a market read, and three things worth loathing.", dt: "Jul 20, 2026 · 6 posts" },
  { no: "Issue 041", t: "Receipts & second-order effects", d: "The stories that mattered, read and argued from every angle.", dt: "Jul 13, 2026 · 5 posts" },
  { no: "Issue 040", t: "Standards, not cynicism", d: "Forty issues in. A retrospective on the takes that aged well.", dt: "Jul 6, 2026 · 7 posts" },
];

export default function Newsletter() {
  return (
    <>
      <section><div className="wrap" style={{ paddingTop: 112 }}>
        <div className="nlhero">
          <div>
            <div className="eyebrow mono reveal">The Weekly</div>
            <h1 className="h-hd reveal d1">One issue a week.<br />Assembled from the week.</h1>
            <p className="lead reveal d2" style={{ marginTop: 22 }}>The best of what loathrdotcom generated this week — culture, enterprise, and the news desk — in one edition. No filler.</p>
          </div>
          <div className="nlform reveal d2">
            <div className="k">Subscribe · free</div>
            <div className="in">
              <input placeholder="you@company.com" aria-label="Email address" />
              <button type="button" className="btn red" data-cursor="Join" data-label="→">Subscribe</button>
            </div>
            <p style={{ color: "var(--mut2)", fontSize: 12, marginTop: 12 }}>Weekly. Unsubscribe anytime. Sound-designed reading experience on the web edition.</p>
          </div>
        </div>
      </div></section>

      <section><div className="wrap">
        <div className="shead reveal"><div><div className="eyebrow mono">Archive</div><h2 className="h-md">Past issues</h2></div></div>
        <div className="issues">
          {ISSUES.map((i) => (
            <div className="issue" key={i.no} data-cursor="Read" data-label="READ"><div className="no">{i.no}</div><h4>{i.t}</h4><p>{i.d}</p><div className="dt">{i.dt}</div></div>
          ))}
        </div>
      </div></section>
    </>
  );
}
