// Register the extensionless-import resolver (./resolver.mjs) on the module
// loader. Loaded via `node --import ./test/register.mjs` so the hook is in place
// before the test files import app/studio/*. Uses the stable module.register API
// (not the deprecated --loader flag) so the runner stays warning-free.
import { register } from "node:module";

register("./resolver.mjs", import.meta.url);
