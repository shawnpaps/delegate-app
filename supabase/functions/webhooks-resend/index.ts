import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

/**
 * Handles inbound Resend email replies.
 * Validates webhook signature, parses the inbound email,
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
    const rawBody = await req.text();

    // Resend sends a webhook secret in the svix-signature header
    const svixSignature = req.headers.get("svix-signature");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixId = req.headers.get("svix-id");

    const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");

    if (webhookSecret && svixSignature && svixTimestamp && svixId) {
      // Verify Svix-style signature
      const isValid = await verifyResendSignature(
        svixId,
        svixTimestamp,
        rawBody,
        svixSignature,
        webhookSecret
      );
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload = JSON.parse(rawBody);

    // Resend inbound email webhook format
    const fromEmail = payload.from?.email || payload.from;
    const subject = payload.subject || "";
    const body = payload.text || payload.html || "";

    if (!fromEmail) {
      return new Response("OK", { status: 200 });
    }

    // Find a task associated with this email
    const { data: tasks } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("assignee_email", fromEmail)
      .in("status", ["active", "awaiting_response"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (!tasks || tasks.length === 0) {
      console.log("No matching task found for email:", fromEmail);
      return new Response("OK", { status: 200 });
    }

    const task = tasks[0];

    // Store the response
    await supabaseAdmin.from("task_responses").insert({
      task_id: task.id,
      channel: "email",
      body: body.substring(0, 2000), // truncate long emails
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
        message: `${task.assignee_name || "Assignee"} replied via email: "${subject}"`,
      }),
    });

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("webhooks-resend error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function verifyResendSignature(
  id: string,
  timestamp: string,
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const signingPayload = `${id}.${timestamp}.${body}`;

    // Resend uses HMAC-SHA256 with a base64-encoded secret
    const rawSecret = Uint8Array.from(atob(secret), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "raw",
      rawSecret,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signingPayload)
    );

    const expectedSignature = btoa(
      String.fromCharCode(...new Uint8Array(signatureBuffer))
    );

    return signature.includes(expectedSignature);
  } catch {
    return false;
  }
}
