import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
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

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { plan } = await req.json();

    if (!plan || !["starter", "pro"].includes(plan)) {
      return new Response(
        JSON.stringify({ error: "Invalid plan. Must be 'starter' or 'pro'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const priceId =
      plan === "pro"
        ? Deno.env.get("STRIPE_PRO_PRICE_ID")
        : Deno.env.get("STRIPE_STARTER_PRICE_ID");

    if (!priceId) {
      throw new Error(`Missing price ID for plan: ${plan}`);
    }

    // Get or create Stripe customer
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      // Create a new Stripe customer
      const customerRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: user.email || "",
          "metadata[user_id]": user.id,
        }),
      });

      if (!customerRes.ok) {
        const err = await customerRes.text();
        console.error("Stripe customer creation failed:", err);
        throw new Error("Failed to create Stripe customer");
      }

      const customer = await customerRes.json();
      customerId = customer.id;
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    // Create a Stripe Checkout session
    const checkoutRes = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          customer: customerId,
          "line_items[0][price]": priceId,
          "line_items[0][quantity]": "1",
          mode: "subscription",
          success_url: `${supabaseUrl.replace(".supabase.co", ".supabase.app")}/dashboard?checkout=success`,
          cancel_url: `${supabaseUrl.replace(".supabase.co", ".supabase.app")}/settings`,
          "subscription_data[trial_period_days]": "14",
          "metadata[user_id]": user.id,
        }),
      }
    );

    if (!checkoutRes.ok) {
      const err = await checkoutRes.text();
      console.error("Stripe checkout creation failed:", err);
      throw new Error("Failed to create checkout session");
    }

    const session = await checkoutRes.json();

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("subscriptions-checkout error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
