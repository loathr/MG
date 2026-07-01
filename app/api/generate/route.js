import { NextResponse } from "next/server";
import { verifyRequest, unauthorized, forbidden, quotaExceeded } from "../_auth";
import { meterGenerate } from "../adminStore";

// Vercel kills serverless functions after their maxDuration regardless of
// streaming. Editorial generations with Claude Opus + web_search routinely take
// 40-90 seconds, so 60s (Hobby max) was killing roughly half the requests. Bumped
// to 300 to match the Pro plan ceiling.
// - Hobby plan max: 60s   (will be capped at 60 even with this set higher)
// - Pro plan max: 300s
// - Enterprise plan max: 900s
// REQUIRES Vercel Pro plan to take effect; on Hobby this still effectively caps at 60.
export const maxDuration = 300;

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 5000, 10000]; // 2s, 5s, 10s backoff

async function callAnthropic(payload, apiKey, attempt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!text) {
    throw new Error(`Empty response (status ${response.status})`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON: ${text.slice(0, 200)}`);
  }

  // Retry on overloaded or 529
  if (
    (response.status === 529 || data.error?.type === "overloaded_error") &&
    attempt < MAX_RETRIES
  ) {
    const delay = RETRY_DELAYS[attempt] || 5000;
    await new Promise((r) => setTimeout(r, delay));
    return callAnthropic(payload, apiKey, attempt + 1);
  }

  // Retry on rate limit (429) with longer delay
  if (response.status === 429 && attempt < MAX_RETRIES) {
    const retryAfter = parseInt(response.headers.get("retry-after") || "5", 10);
    const delay = Math.max(retryAfter * 1000, RETRY_DELAYS[attempt] || 5000);
    await new Promise((r) => setTimeout(r, delay));
    return callAnthropic(payload, apiKey, attempt + 1);
  }

  if (!response.ok) {
    return {
      error: data.error?.message || `API error (${response.status})`,
      status: response.status,
    };
  }

  return { data, status: 200 };
}

export async function POST(request) {
  // Auth gate: when Firebase Admin creds are configured, require a valid signed-in
  // user's ID token so this isn't an open proxy to the Anthropic key. No creds →
  // open (the current behaviour). See CLOUD_SETUP.md.
  const auth = await verifyRequest(request);
  if (!auth.ok) return auth.forbidden ? forbidden(auth.reason) : unauthorized(auth.reason);

  // Usage limit (admin-set, server-enforced): when the gate is on, meter this
  // account's monthly generations and refuse once it's at its cap. No limit set
  // (or no admin store) → unlimited, as today.
  if (auth.gated && auth.uid) {
    const quota = await meterGenerate(auth.uid, Date.now(), auth.role);
    if (!quota.allowed) return quotaExceeded(quota.remaining);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    const payload = {
      model: body.model || "claude-opus-4-8",
      max_tokens: body.max_tokens || 8000,
      messages: body.messages,
    };

    if (body.tools) {
      payload.tools = body.tools;
    }

    // Adaptive thinking + effort (output_config) — forwarded so the studio
    // generation can run the model with reasoning enabled at a tuned effort.
    if (body.thinking) {
      payload.thinking = body.thinking;
    }
    if (body.output_config) {
      payload.output_config = body.output_config;
    }

    // Streaming path: client opts in via body.stream = true. We forward Anthropic's
    // Server-Sent Events stream directly to the client. Vercel considers the function
    // "complete" the moment the streamed response begins, so the maxDuration cap stops
    // applying — long Claude Opus + web_search calls can run past 60 seconds without
    // being killed.
    if (body.stream === true) {
      payload.stream = true;
      const upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(payload),
      });

      if (!upstream.ok) {
        const errText = await upstream.text();
        let errMsg = errText;
        try { const parsed = JSON.parse(errText); errMsg = parsed.error?.message || parsed.error || errText; } catch {}
        return NextResponse.json(
          { error: errMsg },
          { status: upstream.status }
        );
      }

      // Pipe the SSE body through. Client parses events.
      return new Response(upstream.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
        },
      });
    }

    // Non-streaming path (existing behavior) — used by short utility calls.
    const result = await callAnthropic(payload, apiKey, 0);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 502 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
