import Studio from "./Studio";
import AuthGate from "./AuthGate";

export const metadata = { title: "Loathr Studio" };

// AuthGate is a no-op when the cloud layer is unconfigured (renders Studio
// directly, the current open flow); it requires Google sign-in only once Firebase
// is configured (CLOUD_SETUP.md).
export default function StudioPage() {
  return (
    <AuthGate>
      <Studio />
    </AuthGate>
  );
}
