# Docker Deployment Guide

This document explains how to deploy the Delegate App using Docker and Docker Compose on your VPS.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- A VPS with ports 3000 and 3001 exposed (or configure different ports)

## Quick Start

1. **Clone and navigate to the project:**
   ```bash
   git clone <your-repo-url>
   cd delegate-app
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.docker.example .env
   # Edit .env with your actual values from Convex, Clerk, and Resend
   ```

3. **Build and start the containers:**
   ```bash
   docker-compose up -d
   ```

4. **Verify the deployment:**
   - Frontend: http://your-vps-ip:3000
   - Backend: http://your-vps-ip:3001

## Environment Variables

### Required Variables

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `VITE_CONVEX_URL` | Your Convex deployment URL | Convex Dashboard → Settings → URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key for the frontend | Clerk Dashboard → API Keys |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk Frontend API URL for Convex JWT validation. Set this in Convex, not Docker. | Clerk Dashboard → Configure → Integrations → Convex |
| `RESEND_API_KEY` | Resend API key | Resend Dashboard → API Keys |
| `RESEND_DOMAIN` | Verified sending/receiving domain | Resend Dashboard → Domains |
| `RESEND_WEBHOOK_SECRET` | Webhook signing secret for inbound email events | Resend Dashboard → Webhooks |
| `CONVEX_HTTP_URL` | Convex HTTP actions URL | Convex HTTP Actions URL, typically your deployment URL with `.convex.site` instead of `.convex.cloud` |
| `CONVEX_ADMIN_KEY` | Convex admin key | Convex Dashboard → Settings → Deploy Key |

### VPS-Specific Configuration

When deploying to a VPS, update these URLs to use your domain or IP:

```env
VITE_BACKEND_URL=https://api.yourdomain.com
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
BACKEND_URL=https://api.yourdomain.com
```

Set `CLERK_JWT_ISSUER_DOMAIN` in Convex, not as a Docker build arg:

```bash
npx convex env set --prod CLERK_JWT_ISSUER_DOMAIN https://your-production-clerk-frontend-api-url
```

Set `BACKEND_URL` in Convex as well. The task email sender runs inside Convex,
so the Docker container's `BACKEND_URL` value is not visible to the Convex
action:

```bash
cd client
pnpm exec convex env set --prod BACKEND_URL https://delegateapi.sudocreate.app
```

Set `CONVEX_HTTP_URL` in Docker to the Convex HTTP Actions URL, not the frontend
client URL. For production Convex deployments this is usually:

```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_HTTP_URL=https://your-deployment.convex.site
```

## Docker Commands

```bash
# Build and start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Update only (no build)
docker-compose up -d

# View specific service logs
docker-compose logs -f frontend
docker-compose logs -f backend
```

## Production Considerations

### Using a Reverse Proxy (Recommended)

For production, use Nginx or Caddy as a reverse proxy with SSL:

```nginx
# Example Nginx configuration
server {
    listen 443 ssl http2;
    server_name app.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL/HTTPS

Use Let's Encrypt with Certbot or Caddy for automatic SSL certificates.

### Updating the Deployment

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## Troubleshooting

### Containers won't start
- Check logs: `docker-compose logs`
- Verify environment variables in `.env`
- Ensure ports 3000/3001 are not in use: `netstat -tlnp`

### Frontend can't reach backend
- Verify `VITE_BACKEND_URL` is accessible from browser
- Check backend is running: `docker-compose ps`
- Test backend directly: `curl http://localhost:3001/health`

### Webhook failures
- Ensure `BACKEND_URL` is publicly accessible
- Verify Convex can reach your backend
- Check Resend webhook configuration

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   User      │──────▶  Nginx/      │──────▶  Frontend   │
│  Browser    │      │  Reverse     │      │   (Port    │
│             │      │   Proxy      │      │    3000)    │
└─────────────┘      └──────────────┘      └─────────────┘
                                                  │
                                                  ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Convex    │◀─────│   Backend    │◀─────│  React App  │
│   Cloud     │      │  (Port 3001) │      │             │
│  (External) │─────▶              │      └─────────────┘
└─────────────┘      └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │    Resend    │
                     │  (External)  │
                     └──────────────┘
```

## Support

For issues related to:
- **Docker/Deployment**: Check this guide and Docker logs
- **Convex**: Visit https://docs.convex.dev
- **Clerk Auth**: Visit https://clerk.com/docs
- **Resend**: Visit https://resend.com/docs
