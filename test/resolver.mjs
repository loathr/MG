// ============================================================================
// Module-resolution hook for the headless unit tests.
//
// The Studio modules import each other with EXTENSIONLESS relative specifiers
// (e.g. `import { uid } from "./model"`) — the shape a bundler/Next resolves but
// bare Node does not. Rather than rewrite the source just to test it, this hook
// appends `.js` to any relative, extensionless specifier that has a real file on
// disk. Everything else — bare packages, `node:` builtins, already-extensioned
// paths — falls straight through to Node's default resolver untouched.
//
// Registered by ./register.mjs (via `--import`), so it is active before any test
// file pulls in app/studio/*. Pure resolution only; it loads/executes nothing.
// ============================================================================
import { existsSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HAS_EXT = /\.(mjs|cjs|js|json|node)$/;

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !HAS_EXT.test(specifier) && context.parentURL) {
    const parentPath = fileURLToPath(context.parentURL);
    const candidate = resolvePath(dirname(parentPath), specifier + ".js");
    if (existsSync(candidate)) {
      return { url: pathToFileURL(candidate).href, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}
