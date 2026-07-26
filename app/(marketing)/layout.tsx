import "./site/site.css";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import SiteChrome from "./site/SiteChrome";

export const metadata = {
  title: "Loathr — strategy-led creative consultancy",
  description:
    "Loathr is a strategy-led creative consultancy — we build stronger brands, execute meaningful projects, and create lasting impact through strategy, media, and design.",
};

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode();
  return (
    <SiteChrome>
      {children}
      {isEnabled ? <VisualEditing /> : null}
    </SiteChrome>
  );
}
