import "./site/site.css";
import SiteChrome from "./site/SiteChrome";

export const metadata = {
  title: "Loathr — strategy-led creative consultancy",
  description:
    "Loathr is a strategy-led creative consultancy — we build stronger brands, execute meaningful projects, and create lasting impact through strategy, media, and design.",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
