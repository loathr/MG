import { NextResponse } from "next/server";

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
      model: body.model || "claude-sonnet-4-20250514",
      max_tokens: body.max_tokens || 8000,
      messages: body.messages,
    };

    if (body.tools) {
      payload.tools = body.tools;
    }

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
