import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

/**
 * Handles inbound Twilio SMS replies.
 * Validates X-Twilio-Signature, matches sender to a task's assignee_phone,
 * stores the response, and triggers notify-owner.
 */
Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    if (!twilioAuthToken) {
      throw new Error("TWILIO_AUTH_TOKEN not configured");
    }

    // Twilio sends x-www-form-urlencoded data
    const rawBody = await req.text();
    const params = new URLSearchParams(rawBody);

    const twilioSignature = req.headers.get("X-Twilio-Signature");
    if (!twilioSignature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate Twilio signature
    // Build the full request URL (Twilio signs against the full URL configured in their console)
    const requestUrl = new URL(req.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}${requestUrl.pathname}`;

    // Sort POST params alphabetically and append to URL
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}${value}`)
      .join("");

    const signaturePayload = baseUrl + sortedParams;
    const isValid = await verifyTwilioSignature(
      signaturePayload,
      twilioSignature,
      twilioAuthToken
    );

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromNumber = params.get("From");
    const messageBody = params.get("Body");

    if (!fromNumber || !messageBody) {
      return new Response("OK", { status: 200 });
    }

    // Find the task associated with this phone number
    const { data: tasks } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("assignee_phone", fromNumber)
      .in("status", ["active", "awaiting_response"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (!tasks || tasks.length === 0) {
      console.log("No matching task found for phone:", fromNumber);
      return new Response("OK", { status: 200 });
    }

    const task = tasks[0];

    // Store the response
    await supabaseAdmin.from("task_responses").insert({
      task_id: task.id,
      channel: "sms",
      body: messageBody,
    });

    // Notify the owner
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    await fetch(`${supabaseUrl}/functions/v1/notify-owner`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        task_id: task.id,
        message: `${task.assignee_name || "Assignee"} replied: "${messageBody}"`,
      }),
    });

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("webhooks-twilio error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function verifyTwilioSignature(
  payload: string,
  signature: string,
  authToken: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(authToken),
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );

    const expectedSignature = btoa(
      String.fromCharCode(...new Uint8Array(signatureBuffer))
    );

    return expectedSignature === signature;
  } catch {
    return false;
  }
}
