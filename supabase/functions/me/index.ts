import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { createAuthedClient } from "../_shared/supabase-client.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  let user;
  try {
    user = await requireUser(req);
  } catch (err) {
    return err as Response;
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const accessToken = req.headers
      .get("Authorization")!
      .replace("Bearer ", "");
    const supabase = createAuthedClient(accessToken);

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Fetch subscription using admin client (subscriptions may not have RLS for user reads)
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
        },
        profile: profile ?? null,
        subscription: subscription ?? null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("me error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
