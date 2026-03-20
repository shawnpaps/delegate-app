import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

export function Settings() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const {
    subscription,
    hasActiveSubscription,
    createCheckoutSession,
    openCustomerPortal,
  } = useSubscription();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate("/");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Profile */}
      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex gap-4">
            <dt className="w-32 text-gray-500">Email</dt>
            <dd className="text-gray-900">{user?.email}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-32 text-gray-500">Name</dt>
            <dd className="text-gray-900">{profile?.full_name || "—"}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-32 text-gray-500">Business</dt>
            <dd className="text-gray-900">{profile?.business_name || "—"}</dd>
          </div>
        </dl>
      </section>

      {/* Subscription */}
      <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>

        {hasActiveSubscription ? (
          <div className="mt-3">
            <p className="text-sm text-gray-700">
              Current plan:{" "}
              <span className="font-medium capitalize">
                {subscription?.plan}
              </span>{" "}
              ({subscription?.status})
            </p>
            {subscription?.current_period_end && (
              <p className="mt-1 text-xs text-gray-400">
                Renews:{" "}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
            <button
              onClick={openCustomerPortal}
              className="mt-3 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Manage Subscription
            </button>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-gray-500">
              You don't have an active subscription.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => createCheckoutSession("starter")}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Starter — $9/mo
              </button>
              <button
                onClick={() => createCheckoutSession("pro")}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Pro — $19/mo
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Sign out */}
      <section className="mt-6">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-200 disabled:opacity-50"
        >
          {signingOut ? "Signing out..." : "Sign Out"}
        </button>
      </section>
    </div>
  );
}
