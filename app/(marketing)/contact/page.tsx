import { sanityFetch } from "../../../sanity/lib/fetch";
import ContactForm from "./ContactForm";

export const metadata = { title: "Contact · Loathr" };

type Faq = { q: string; a: string };
type Contact = { eyebrow: string; heading: string; lead: string; serviceOptions: string[]; submitLabel: string; faq: Faq[]; trustNote: string };

const F: Contact = {
  eyebrow: "Get started",
  heading: "Let’s talk.",
  lead: "Whether your company has a question or a project to scope, from concept to completion, we’re here.",
  serviceOptions: [
    "Strategy: Business / Consultancy / PM",
    "Creative: Branding / Photo / Film",
    "Growth: Marketing / Social / Web",
    "Not sure yet",
  ],
  submitLabel: "Send message",
  faq: [
    { q: "What services do you offer?", a: "Strategy, creative/production, and growth, grouped as three pillars so engagements stay integrated, not scattered." },
    { q: "Typical project timeline?", a: "Scoped per engagement. We define scope, timeline, and budget parameters up front. No surprises." },
    { q: "Do you offer post-launch support?", a: "Yes. We embed systems and transfer knowledge. We don't hand over a report and walk away." },
    { q: "Online and offline projects?", a: "Both. Digital experiences, film, print, and physical brand systems." },
  ],
  trustNote: "Accredited & trusted · logos pending",
};

const QUERY = `*[_type == "contactPage"][0]{ eyebrow, heading, lead, serviceOptions, submitLabel, faq[]{ q, a }, trustNote }`;

const arr = <T,>(a: T[] | undefined, f: T[]) => (a && a.length ? a : f);

export default async function Contact() {
  const cms = await sanityFetch<Partial<Contact> | null>(QUERY, null);
  const c = { ...F, ...(cms || {}) };
  return (
    <ContactForm
      eyebrow={c.eyebrow || F.eyebrow}
      heading={c.heading || F.heading}
      lead={c.lead || F.lead}
      serviceOptions={arr(c.serviceOptions, F.serviceOptions)}
      submitLabel={c.submitLabel || F.submitLabel}
      faq={arr(c.faq, F.faq)}
      trustNote={c.trustNote || F.trustNote}
    />
  );
}
