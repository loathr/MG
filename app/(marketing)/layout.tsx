import "./site/site.css";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import SiteChrome from "./site/SiteChrome";
import { sanityFetch } from "../../sanity/lib/fetch";

export const metadata = {
  title: "Loathr — strategy-led creative consultancy",
  description:
    "Loathr is a strategy-led creative consultancy — we build stronger brands, execute meaningful projects, and create lasting impact through strategy, media, and design.",
};

const FOOTER_QUERY = `*[_type == "siteSettings"][0]{ footerTagline, footerFine }`;

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode();
  const footer = await sanityFetch<{ footerTagline?: string; footerFine?: string } | null>(FOOTER_QUERY, null);
  return (
    <SiteChrome footerTagline={footer?.footerTagline} footerFine={footer?.footerFine}>
      {children}
      {isEnabled ? <VisualEditing /> : null}
    </SiteChrome>
  );
}
