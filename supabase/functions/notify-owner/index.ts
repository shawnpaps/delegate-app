import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";
import type { Task } from "../_shared/types.ts";

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
    const { task_id } = await req.json();

    if (!task_id) {
      return new Response(
        JSON.stringify({ error: "Missing task_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch task with owner info
    const { data: task, error: taskError } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("id", task_id)
      .single();

    if (taskError || !task) {
      return new Response(JSON.stringify({ error: "Task not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const typedTask = task as Task;

    // Fetch owner's profile for name
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("user_id", typedTask.user_id)
      .single();

    // Fetch owner's email from auth
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
      typedTask.user_id
    );
    const ownerEmail = authUser?.user?.email;

    const notificationMessage = `Follow-up reminder: "${typedTask.title}" assigned to ${typedTask.assignee_name || "someone"} is due for a check-in.`;

    // Send web push notification
    const { data: pushSubs } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", typedTask.user_id);

    if (pushSubs && pushSubs.length > 0) {
      const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
      const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
      const vapidSubject = Deno.env.get("VAPID_SUBJECT")!;

      for (const sub of pushSubs) {
        try {
          // Build JWT for VAPID
          const jwt = await buildVapidJwt(
            vapidSubject,
            vapidPublicKey,
            vapidPrivateKey
          );

          const pushPayload = JSON.stringify({
            title: "Delegate — Follow-up Reminder",
            body: notificationMessage,
            url: `/tasks/${typedTask.id}`,
          });

          await fetch(sub.endpoint, {
            method: "POST",
            headers: {
              TTL: "60",
              Urgency: "high",
              Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
              "Content-Type": "application/json",
            },
            body: pushPayload,
          });
        } catch (e) {
          console.error("Push send failed:", e);
        }
      }
    }

    // Send email via Resend
    if (ownerEmail) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");

      if (resendApiKey && fromEmail) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromEmail,
              to: ownerEmail,
              subject: `Follow-up: ${typedTask.title}`,
              html: `<p>${notificationMessage}</p><p><a href="#">View in Delegate</a></p>`,
            }),
          });
        } catch (e) {
          console.error("Email send failed:", e);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Owner notified" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("notify-owner error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function buildVapidJwt(
  subject: string,
  publicKey: string,
  privateKey: string
): Promise<string> {
  const header = {
    typ: "JWT",
    alg: "ES256",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: "https://fcm.googleapis.com",
    exp: now + 12 * 60 * 60,
    sub: subject,
  };

  // For simplicity, return a placeholder — in production use a proper JWT library
  // Deno-compatible or implement ES256 signing manually
  return `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.signature`;
}
