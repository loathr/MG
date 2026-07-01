import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin (token verification, Firestore Admin) pulls jwks-rsa → jose,
  // and jose@6 is ESM-only. If Turbopack BUNDLES firebase-admin, its CJS module
  // loader does a strict require() of that ESM file → ERR_REQUIRE_ESM at runtime
  // (the admin routes 401 with "Failed to load external module …/auth"). Marking
  // firebase-admin as an EXTERNAL server package leaves it (and its dep tree) to
  // native Node, which on Node ≥22 supports require() of ESM — so the Admin SDK
  // loads and verifyIdToken works. Pair with engines.node ">=22" (package.json).
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
