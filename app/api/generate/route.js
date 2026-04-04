export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    const payload = {
      model: body.model || "claude-sonnet-4-20250514",
      max_tokens: body.max_tokens || 4000,
      messages: body.messages,
    };

    if (body.tools) {
      payload.tools = body.tools;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data.error?.message || "Anthropic API request failed" },
        { status: response.status }
      );
    }

    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
