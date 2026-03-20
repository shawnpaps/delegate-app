import { useState, useCallback, useEffect } from "react";
import { apiGet, apiPost } from "@/lib/api";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: "starter" | "pro" | null;
  status: "active" | "trialing" | "canceled" | "past_due" | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<Subscription>("/me");
      setSubscription(data);
    } catch {
      // No subscription yet
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCheckoutSession = useCallback(async (plan: "starter" | "pro") => {
    const { url } = await apiPost<{ url: string }>(
      "/subscriptions-checkout",
      { plan }
    );
    window.location.href = url;
  }, []);

  const openCustomerPortal = useCallback(async () => {
    const { url } = await apiPost<{ url: string }>("/subscriptions-portal");
    window.location.href = url;
  }, []);

  const hasActiveSubscription = subscription?.status === "active" || subscription?.status === "trialing";

  const isPlanActive = useCallback(
    (plan: "starter" | "pro") => {
      if (!hasActiveSubscription) return false;
      if (plan === "starter") return true;
      return subscription?.plan === "pro";
    },
    [hasActiveSubscription, subscription?.plan]
  );

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    loading,
    hasActiveSubscription,
    isPlanActive,
    createCheckoutSession,
    openCustomerPortal,
    refetch: fetchSubscription,
  };
}
