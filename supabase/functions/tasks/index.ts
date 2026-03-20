import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { createAuthedClient } from "../_shared/supabase-client.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  let user;
  try {
    user = await requireUser(req);
  } catch (err) {
    return err as Response;
  }

  const supabase = createAuthedClient(
    req.headers.get("Authorization")!.replace("Bearer ", "")
  );

  try {
    switch (req.method) {
      case "GET": {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");
        const status = url.searchParams.get("status");
        const include = url.searchParams.get("include");

        if (id) {
          // Fetch single task
          const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();

          if (error) throw error;

          if (include === "responses") {
            const { data: responses } = await supabase
              .from("task_responses")
              .select("*")
              .eq("task_id", id)
              .order("received_at", { ascending: false });

            return new Response(JSON.stringify(responses ?? []), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Fetch list with optional status filter
        let query = supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (status && status !== "all") {
          query = query.eq("status", status);
        }

        const { data, error } = await query;
        if (error) throw error;

        return new Response(JSON.stringify(data ?? []), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "POST": {
        const body = await req.json();

        const { data, error } = await supabase
          .from("tasks")
          .insert({
            user_id: user.id,
            title: body.title,
            assignee_name: body.assignee_name,
            assignee_email: body.assignee_email,
            assignee_phone: body.assignee_phone,
            due_at: body.due_at,
            follow_up_at: body.follow_up_at,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "PATCH": {
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
          return new Response(
            JSON.stringify({ error: "Missing task id" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { data, error } = await supabase
          .from("tasks")
          .update(updates)
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "DELETE": {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) {
          return new Response(
            JSON.stringify({ error: "Missing task id" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { error } = await supabase
          .from("tasks")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    console.error("tasks error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
