export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  business_name: string | null;
  created_at: string;
}

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

export interface Task {
  id: string;
  user_id: string;
  title: string;
  assignee_name: string | null;
  assignee_email: string | null;
  assignee_phone: string | null;
  due_at: string | null;
  follow_up_at: string | null;
  follow_up_sent_at: string | null;
  owner_notified_at: string | null;
  status: "active" | "awaiting_response" | "completed" | "snoozed";
  created_at: string;
  updated_at: string;
}

export interface TaskResponse {
  id: string;
  task_id: string;
  channel: "sms" | "email";
  body: string;
  received_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export interface ParsedTaskResult {
  task: string;
  assignee: string;
  contact: string;
  due_at: string;
  follow_up_at: string;
  raw_input: string;
}
