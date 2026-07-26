import { isSanityConfigured } from "../../../sanity/env";
import Studio from "./Studio";

// The embedded Sanity Studio lives at /cms (the loathrdotcom carousel app owns
// /studio). Force-static per Sanity's guidance so the SPA shell is served
// directly; the Studio hydrates and talks to Sanity client-side.
export const dynamic = "force-static";

export { metadata, viewport } from "next-sanity/studio";

export default function CmsPage() {
  if (!isSanityConfigured) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0a0a0a",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          padding: 32,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 460 }}>
          <h1 style={{ fontSize: 22, marginBottom: 12 }}>CMS not configured</h1>
          <p style={{ color: "#9a9a9a", lineHeight: 1.6, fontSize: 15 }}>
            Set <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> (and optionally{" "}
            <code>NEXT_PUBLIC_SANITY_DATASET</code>) in the environment, then
            redeploy to open the editor here. The site runs on its built-in copy
            until then.
          </p>
        </div>
      </div>
    );
  }
  return <Studio />;
}
