import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import type { ParsedTaskResult } from "../_shared/types.ts";

const OPENAI_SYSTEM_PROMPT = `You are a task extraction assistant for small business owners.
Given raw natural language input, extract a structured task object.

Return JSON with exactly these fields:
{
  "task": "Clear action-oriented task title (imperative mood, e.g. 'Send invoice to Jane')",
  "assignee": "Name of the person assigned (empty string if not mentioned)",
  "contact": "Email or phone of the assignee (empty string if not mentioned)",
  "due_at": "ISO 8601 datetime for when the task is due (empty string if not mentioned)",
  "follow_up_at": "ISO 8601 datetime for when to follow up. Default to 24 hours before due_at if due_at is set, otherwise 24 hours from now."
}

Rules:
- If no year is given, assume current year
- If no time is given, assume 5:00 PM local time
- Be generous in inferring intent — the user is busy and may be vague
- Never add fields not in the schema
- Return ONLY valid JSON, no markdown fences or explanation`;

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    await requireUser(req);
  } catch (err) {
    return err as Response;
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'text' field" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: OPENAI_SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text();
      console.error("OpenAI error:", errBody);
      return new Response(
        JSON.stringify({ error: "Failed to parse task" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const completion = await openaiRes.json();
    const content = completion.choices[0].message.content;
    const parsed: ParsedTaskResult = JSON.parse(content);
    parsed.raw_input = text;

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("parse-task error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
