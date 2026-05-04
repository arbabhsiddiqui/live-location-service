# Live Location App

A TypeScript Express application for authenticated live location updates. The app uses Socket.IO for realtime browser updates, Kafka for location event streaming, PostgreSQL with Drizzle for persistence support, and an OIDC provider for authentication.

## Features

- Express 5 HTTP server
- Socket.IO realtime location broadcasts
- Kafka producer and consumer for `location-updates`
- PostgreSQL and Drizzle ORM setup
- OIDC login callback, logout, protected profile, and protected dashboard routes
- Docker Compose services for the app, PostgreSQL, and Kafka

## Auth Provider

This project is designed to use [oidc-auth-ts](https://github.com/arbabhsiddiqui/oidc-auth-ts) as the OIDC authentication provider.

Run the auth provider alongside this app and make sure it is reachable from both:

- the host/browser, through `OIDC_ISSUER_URL`
- this app container or local process, through `OIDC_INTERNAL_URL`

The included Docker Compose file expects the auth provider to expose or share the external Docker network named:

```text
oidc-auth-ts_app_network
```

## Requirements

- Node.js 20+
- pnpm 10+
- Docker and Docker Compose, if running the service stack in containers
- A running `oidc-auth-ts` provider

## Environment Variables

Copy the example file and fill in values for your environment:

```bash
cp .env.example .env
```

Available variables:

| Variable            | Description                                                  | Example                                                        |
| ------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| `NODE_ENV`          | Runtime environment                                          | `development`                                                  |
| `PORT`              | HTTP server port                                             | `4000`                                                         |
| `DATABASE_URI`      | PostgreSQL connection string                                 | `postgresql://admin:admin@localhost:5446/live_location_app_db` |
| `OIDC_INTERNAL_URL` | Provider URL used by the backend for token and JWKS requests | `http://oidc_app:6001`                                         |
| `OIDC_ISSUER_URL`   | Issuer URL expected in JWT validation                        | `http://localhost:6001`                                        |

## Install

```bash
pnpm install
```

## Run Locally

Start the app in development mode:

```bash
pnpm dev
```

Build and run the compiled app:

```bash
pnpm build
pnpm start
```

By default, the app starts on the configured `PORT`. Open:

```text
http://localhost:4000
```

## Run With Docker Compose

Start the supporting services:

```bash
docker compose up -d
```

The compose setup includes:

- `app`
- `postgres`
- `kafka`

The app container currently runs `tail -f /dev/null`, so it is ready for interactive development. You can enter it and run commands manually:

```bash
docker compose exec app bash
pnpm install
pnpm dev
```

## Database Commands

Generate Drizzle migrations:

```bash
pnpm db:generate
```

Run migrations:

```bash
pnpm db:migrate
```

Open Drizzle Studio:

```bash
pnpm studio
```

## Auth Flow

1. Visit `/`.
2. Click the login link, which redirects to the `oidc-auth-ts` authorization endpoint.
3. The provider redirects back to `/callback` with an authorization code.
4. The app exchanges the code for an access token.
5. The token is stored as an HTTP-only cookie.
6. Protected routes such as `/profile` and `/dashboard` verify the token using the provider JWKS endpoint.

## Useful Routes

| Route        | Description                         |
| ------------ | ----------------------------------- |
| `/`          | Public landing page with login link |
| `/callback`  | OIDC callback route                 |
| `/logout`    | Clears the auth cookie              |
| `/profile`   | Protected profile/debug route       |
| `/dashboard` | Protected dashboard page            |

## Project Structure

```text
src/
  common/
    config/
    db/
    middleware/
    utils/
  modules/
    auth/
  database-processor.ts
  index.ts
  kafka-admin.ts
  kafka-client.ts
public/
  index.html
```

## Notes

- Kafka messages are published to and consumed from the `location-updates` topic.
- Token verification uses RS256 and the JWKS endpoint from `OIDC_INTERNAL_URL`.
- The JWT issuer must match `OIDC_ISSUER_URL`.
