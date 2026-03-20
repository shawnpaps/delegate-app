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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    // Fetch all tasks due for follow-up
    const { data: tasks, error } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .lte("follow_up_at", new Date().toISOString())
      .in("status", ["active", "awaiting_response"]);

    if (error) throw error;

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ message: "No tasks due for follow-up", count: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    };

    const results: string[] = [];

    for (const task of tasks as Task[]) {
      // Always notify the owner
      try {
        const notifyRes = await fetch(
          `${supabaseUrl}/functions/v1/notify-owner`,
          {
            method: "POST",
            headers: authHeader,
            body: JSON.stringify({ task_id: task.id }),
          }
        );
        if (notifyRes.ok) {
          results.push(`notified owner for task ${task.id}`);
        }
      } catch (e) {
        console.error(`Failed to notify owner for task ${task.id}:`, e);
      }

      // Update owner_notified_at timestamp
      await supabaseAdmin
        .from("tasks")
        .update({ owner_notified_at: new Date().toISOString() })
        .eq("id", task.id);

      // If owner was already notified > 24h ago and task is still active, contact the assignee
      const twentyFourHoursAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      if (
        task.owner_notified_at &&
        task.owner_notified_at < twentyFourHoursAgo &&
        task.status === "active"
      ) {
        try {
          const contactRes = await fetch(
            `${supabaseUrl}/functions/v1/contact-assignee`,
            {
              method: "POST",
              headers: authHeader,
              body: JSON.stringify({ task_id: task.id }),
            }
          );
          if (contactRes.ok) {
            results.push(`contacted assignee for task ${task.id}`);
          }
        } catch (e) {
          console.error(`Failed to contact assignee for task ${task.id}:`, e);
        }

        // Update follow_up_sent_at
        await supabaseAdmin
          .from("tasks")
          .update({ follow_up_sent_at: new Date().toISOString() })
          .eq("id", task.id);
      }
    }

    return new Response(
      JSON.stringify({ message: "Follow-up check complete", count: tasks.length, results }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("follow-up error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
