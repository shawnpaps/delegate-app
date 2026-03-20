# Delegate

A task delegation and follow-up assistant for busy small business owners. Create tasks by voice or text, assign them to team members or contractors, and let Delegate handle the follow-up reminders so nothing falls through the cracks.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React (TypeScript), Tailwind CSS v4 |
| Backend | Supabase Edge Functions (Deno/TypeScript) |
| Database | Supabase Postgres with Row Level Security |
| Auth | Supabase Auth (email/password + magic link) |
| Payments | Stripe (REST API) |
| LLM | OpenAI GPT-4o for task parsing |
| Voice | OpenAI Whisper (transcription) + ElevenLabs (TTS) |
| Notifications | Resend (email), Twilio (SMS), Web Push (VAPID) |
| Scheduler | pg_cron + pg_net |

## Project Structure

```
/delegate
├── client/                          # Vite + React frontend
│   ├── src/
│   │   ├── pages/                   # Home, Dashboard, TaskDetail, Onboarding, Settings
│   │   ├── components/              # TaskCard, MicButton, VoiceConfirmModal, SubscriptionGate
│   │   ├── hooks/                   # useTask, useVoice, useAuth, useSubscription
│   │   ├── lib/                     # supabase.ts, api.ts, stripe.ts
│   │   ├── router/                  # React Router v6 route definitions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── .env.example
│   └── package.json
├── supabase/
│   ├── functions/                   # Edge Functions
│   │   ├── _shared/                 # auth.ts, cors.ts, supabase.ts, types.ts
│   │   ├── parse-task/             # GPT-4o task parser
│   │   ├── transcribe/             # Whisper transcription
│   │   ├── speak/                  # ElevenLabs TTS streaming
│   │   ├── tasks/                  # Task CRUD
│   │   ├── follow-up/             # pg_cron handler
│   │   ├── notify-owner/          # Push + email to owner
│   │   ├── contact-assignee/      # SMS/email to assignee
│   │   ├── webhooks-stripe/       # Stripe webhook handler
│   │   ├── webhooks-twilio/       # Inbound SMS handler
│   │   ├── webhooks-resend/       # Inbound email handler
│   │   ├── subscriptions-checkout/
│   │   ├── subscriptions-portal/
│   │   ├── push-subscribe/
│   │   └── me/                     # Profile + subscription status
│   ├── migrations/
│   └── config.toml
└── README.md
```

## Local Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Deno](https://deno.land/) 1.x
- [Docker](https://www.docker.com/) (for Supabase local development)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Stripe CLI](https://stripe.com/docs/stripe-cli) (for webhook testing)

### 1. Clone and Install

```bash
git clone <repo-url> delegate
cd delegate

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Start Supabase Locally

```bash
# From the project root
supabase start
```

This starts the Supabase stack (Postgres, Auth, Edge Functions, etc.) in Docker. After it finishes, you'll see output with:
- **API URL**: `http://127.0.0.1:54321`
- **Anon Key**: `eyJ...`
- **Service Role Key**: `eyJ...`

### 3. Set Up Environment Variables

#### Client

```bash
cp client/.env.example client/.env
```

Edit `client/.env` and fill in:
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_VAPID_PUBLIC_KEY=<your-vapid-public-key>
```

#### Edge Functions (Supabase Secrets)

```bash
# Set secrets for Edge Functions
supabase secrets set \
  OPENAI_API_KEY=sk-... \
  ELEVENLABS_API_KEY=... \
  ELEVENLABS_VOICE_ID=... \
  STRIPE_SECRET_KEY=sk_test_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  STRIPE_STARTER_PRICE_ID=price_... \
  STRIPE_PRO_PRICE_ID=price_... \
  TWILIO_ACCOUNT_SID=AC... \
  TWILIO_AUTH_TOKEN=... \
  TWILIO_PHONE_NUMBER=+1... \
  RESEND_API_KEY=re_... \
  RESEND_FROM_EMAIL=noreply@yourdomain.com \
  VAPID_PUBLIC_KEY=... \
  VAPID_PRIVATE_KEY=... \
  VAPID_SUBJECT=mailto:you@yourdomain.com
```

### 4. Run Database Migrations

```bash
supabase db reset
```

This applies all migrations in `supabase/migrations/`.

### 5. Start the Frontend

```bash
cd client
npm run dev
```

The app will be available at `http://localhost:3000`.

### 6. Deploy Edge Functions

For local development, functions are served automatically by `supabase start`.

To deploy to production:

```bash
# Deploy all functions
supabase functions deploy

# Deploy a single function
supabase functions deploy parse-task
```

### 7. Stripe Webhook Testing (Local)

Install and run the Stripe CLI to forward webhooks to your local Edge Function:

```bash
stripe listen --forward-to http://127.0.0.1:54321/functions/v1/webhooks-stripe
```

Copy the webhook signing secret (`whsec_...`) from the CLI output and set it:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### 8. Generate VAPID Keys

For web push notifications, generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

Set the public and private keys in both `client/.env` and `supabase secrets`.

## Architecture

### Edge Function Conventions

- Every function exports `Deno.serve(async (req) => { ... })`
- All functions import CORS headers from `_shared/cors.ts` and handle OPTIONS preflight
- User-facing functions authenticate via `requireUser(req)` from `_shared/auth.ts`
- Webhook functions validate their respective signatures before processing
- Cron/internal functions use the service-role client from `_shared/supabase.ts`
- No Node-specific modules — use Deno-native APIs and `fetch` for all HTTP calls

### Database

- All tables have RLS enabled
- Users can only access their own data
- The `tasks` table has an `updated_at` trigger that fires on every update
- `pg_cron` runs the follow-up check every 15 minutes via `pg_net`

### Authentication Flow

1. User signs up/in via Supabase Auth (email/password or magic link)
2. Client stores session JWT in Supabase client
3. API calls auto-attach JWT via the `api.ts` wrapper
4. Edge Functions validate JWT via `requireUser()`
5. After first login, client checks `/me` — redirects to onboarding if no profile

### Subscription Flow

1. User selects a plan → `POST /subscriptions-checkout` → Stripe Checkout redirect
2. On success, Stripe sends `checkout.session.completed` webhook
3. `webhooks-stripe` validates signature and upserts the `subscriptions` table
4. Client checks subscription status via `/me` and gates Pro features with `<SubscriptionGate>`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `supabase start` | Start local Supabase |
| `supabase db reset` | Reset DB and apply migrations |
| `supabase functions deploy` | Deploy all Edge Functions |
| `supabase secrets set KEY=VALUE` | Set Edge Function secrets |
| `stripe listen --forward-to ...` | Forward Stripe webhooks locally |
