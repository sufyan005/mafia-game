# Cloudflare deployment

This deployment is separate from the existing Node/Socket.IO deployment.

## Cloudflare Worker

1. Install dependencies with `npm install`.
2. Set the build environment variable `VITE_CLOUDFLARE=true`.
3. Build the frontend with `npm run build:cloudflare`.
4. Deploy with `npx wrangler deploy`.

Wrangler serves the frontend from `dist/public` and routes `/ws/room1` and `/ws/room2` to Durable Objects. The Durable Object stores room state and uses alarms for game phases.

## Existing deployments

Do not set `VITE_CLOUDFLARE` for localhost or Railway. The default remains Socket.IO and uses the existing `npm run dev`, `npm run build`, and `npm start` commands.

## Local Cloudflare test

Use Wrangler's local runtime after building:

```text
npm run build:cloudflare
npx wrangler dev
```

The local Worker URL should connect through native WebSockets when `VITE_CLOUDFLARE=true` was present during the frontend build.
