import Studio from "./Studio";
import AuthGate from "./AuthGate";
import ErrorBoundary from "./ErrorBoundary";

export const metadata = { title: "Loathr Studio" };

// AuthGate is a no-op when the cloud layer is unconfigured (renders Studio
// directly, the current open flow); it requires Google sign-in only once Firebase
// is configured (CLOUD_SETUP.md). ErrorBoundary wraps everything so a render crash
// shows a readable, screenshot-able panel instead of a blank white screen.
export default function StudioPage() {
  return (
    <ErrorBoundary>
      <AuthGate>
        <Studio />
      </AuthGate>
    </ErrorBoundary>
  );
}
