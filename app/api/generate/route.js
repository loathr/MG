export async function POST(request) {
  const body = await request.json();

  const headers = {
    "Content-Type": "application/json",
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
  };

  const payload = {
    model: body.model || "claude-sonnet-4-20250514",
    max_tokens: body.max_tokens || 4000,
    messages: body.messages,
  };

  // Support web search tool for trending topics
  if (body.tools) {
    payload.tools = body.tools;
  }

  const response = await fetch("/api/generate", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return Response.json(data);
}