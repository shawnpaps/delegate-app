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

    // Fetch task
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

    const message = `Hi! Just checking in on "${typedTask.title}". Could you provide an update? Thanks!`;

    // Send SMS via Twilio if phone is available
    if (typedTask.assignee_phone) {
      const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (twilioSid && twilioToken && twilioPhone) {
        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
          const credentials = btoa(`${twilioSid}:${twilioToken}`);

          await fetch(twilioUrl, {
            method: "POST",
            headers: {
              Authorization: `Basic ${credentials}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              From: twilioPhone,
              To: typedTask.assignee_phone,
              Body: message,
            }),
          });

          // Mark task as awaiting response
          await supabaseAdmin
            .from("tasks")
            .update({ status: "awaiting_response" })
            .eq("id", task_id);
        } catch (e) {
          console.error("SMS send failed:", e);
        }
      }
    }

    // Send email via Resend if email is available
    if (typedTask.assignee_email) {
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
              to: typedTask.assignee_email,
              subject: `Update requested: ${typedTask.title}`,
              html: `<p>${message}</p>`,
            }),
          });

          await supabaseAdmin
            .from("tasks")
            .update({ status: "awaiting_response" })
            .eq("id", task_id);
        } catch (e) {
          console.error("Email send failed:", e);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Assignee contacted" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("contact-assignee error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
