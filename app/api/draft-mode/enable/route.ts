import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "../../../../sanity/lib/client";

// Presentation calls this to turn on draft mode for the preview iframe. It
// validates the request against Sanity using the read token. Disabled (404)
// when Sanity or the token isn't configured.
const token = process.env.SANITY_API_READ_TOKEN;

export const { GET } =
  client && token
    ? defineEnableDraftMode({ client: client.withConfig({ token }) })
    : { GET: async () => new Response("Draft mode not configured", { status: 404 }) };
