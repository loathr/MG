import Studio from "./studio/Studio";
import AuthGate from "./studio/AuthGate";

// The domain root IS the Studio now (the old monolith it used to render lives on
// in `app/components/LoathrMediaGenerator.jsx` and the `monolith-archive` branch,
// but is no longer routed). `/studio` still resolves to the same app, so existing
// bookmarks and share links (…/studio?deck=&s=) keep working. AuthGate is a no-op
// until Firebase is configured, then it gates on Google sign-in.
export const metadata = { title: "Loathr Studio" };

export default function Home() {
  return (
    <AuthGate>
      <Studio />
    </AuthGate>
  );
}
