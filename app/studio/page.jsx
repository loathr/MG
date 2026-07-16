import Studio from "./Studio";
import AuthGate from "./AuthGate";
import ErrorBoundary from "./ErrorBoundary";
import CrashBanner from "./CrashBanner";

export const metadata = { title: "Loathr Studio" };

// AuthGate is a no-op when the cloud layer is unconfigured (renders Studio
// directly, the current open flow); it requires Google sign-in only once Firebase
// is configured (CLOUD_SETUP.md). ErrorBoundary wraps everything so a render crash
// shows a readable, screenshot-able panel instead of a blank white screen.
// CrashBanner is a temporary diagnostic: it surfaces what the app was doing before
// an OOM/hang tab-kill (which no error boundary can catch) on the next load.
export default function StudioPage() {
  return (
    <ErrorBoundary>
      <CrashBanner />
      <AuthGate>
        <Studio />
      </AuthGate>
    </ErrorBoundary>
  );
}
