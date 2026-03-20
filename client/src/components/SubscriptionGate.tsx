import type { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";

interface SubscriptionGateProps {
  plan: "starter" | "pro";
  fallback?: ReactNode;
  children: ReactNode;
}

export function SubscriptionGate({
  plan,
  fallback,
  children,
}: SubscriptionGateProps) {
  const { loading, isPlanActive } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (!isPlanActive(plan)) {
    return <>{fallback ?? <DefaultUpgradePrompt plan={plan} />}</>;
  }

  return <>{children}</>;
}

function DefaultUpgradePrompt({ plan }: { plan: string }) {
  const { createCheckoutSession } = useSubscription();

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
      <h3 className="text-lg font-semibold text-gray-900">
        Upgrade to {plan === "pro" ? "Pro" : "Starter"}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        This feature requires a {plan} subscription.
      </p>
      <button
        onClick={() =>
          createCheckoutSession(plan as "starter" | "pro")
        }
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Upgrade Now
      </button>
    </div>
  );
}
