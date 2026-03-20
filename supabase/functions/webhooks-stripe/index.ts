import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

/**
 * Handles Stripe webhook events.
 * Validates signature using the stripe-signature header and STRIPE_WEBHOOK_SECRET.
 * Processes: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
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
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    // Read raw body bytes for signature verification — do NOT parse JSON first
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify Stripe webhook signature using HMAC-SHA256
    const isValid = await verifyStripeSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(rawBody);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const userId = session.metadata?.user_id;

        if (userId) {
          // Fetch subscription details from Stripe
          const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
          const subRes = await fetch(
            `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
            {
              headers: { Authorization: `Bearer ${stripeKey}` },
            }
          );

          if (subRes.ok) {
            const stripeSub = await subRes.json();
            const priceId = stripeSub.items?.data?.[0]?.price?.id;
            const plan = priceId === Deno.env.get("STRIPE_PRO_PRICE_ID")
              ? "pro"
              : "starter";

            await supabaseAdmin
              .from("subscriptions")
              .upsert({
                user_id: userId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                plan,
                status: stripeSub.status,
                trial_ends_at: stripeSub.trial_end
                  ? new Date(stripeSub.trial_end * 1000).toISOString()
                  : null,
                current_period_end: stripeSub.current_period_end
                  ? new Date(stripeSub.current_period_end * 1000).toISOString()
                  : null,
              });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const stripeSub = event.data.object;
        const customerId = stripeSub.customer;

        const { data: existing } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (existing) {
          const priceId = stripeSub.items?.data?.[0]?.price?.id;
          const plan = priceId === Deno.env.get("STRIPE_PRO_PRICE_ID")
            ? "pro"
            : "starter";

          await supabaseAdmin
            .from("subscriptions")
            .update({
              plan,
              status: stripeSub.status,
              trial_ends_at: stripeSub.trial_end
                ? new Date(stripeSub.trial_end * 1000).toISOString()
                : null,
              current_period_end: stripeSub.current_period_end
                ? new Date(stripeSub.current_period_end * 1000).toISOString()
                : null,
            })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSub = event.data.object;
        const customerId = stripeSub.customer;

        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_customer_id", customerId);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("webhooks-stripe error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  try {
    // Parse the signature header
    const sigParts: Record<string, string> = {};
    signatureHeader.split(",").forEach((part) => {
      const [key, value] = part.split("=");
      sigParts[key.trim()] = value?.trim();
    });

    const timestamp = sigParts["t"];
    const signature = sigParts["v1"];

    if (!timestamp || !signature) return false;

    // Build the signed payload
    const signedPayload = `${timestamp}.${payload}`;

    // Create HMAC-SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedPayload)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return expectedSignature === signature;
  } catch {
    return false;
  }
}
