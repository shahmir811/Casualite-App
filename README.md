# Casualite

Customer-facing iOS and Android app for **Casualite**, a Pakistani clothing brand. Built by
The Techmint Ltd on top of **CasualOS**, the Laravel business operations system already
running for the same client (sibling repo: `../casualos/`).

Customers sign in with a permanent portal link (sent once over WhatsApp) plus their email —
no passwords, no OTP — then view their orders, balance, and place new orders against open
catalogues using CasualOS's existing collective-quantity pricing.

For the full project brief (scope, API contract, design tokens, domain rules) see
[`CLAUDE.md`](./CLAUDE.md) — read it before making any non-trivial change.

## Stack

- Expo **SDK 54**, React Native 0.81, React 19, New Architecture
- [Expo Router](https://docs.expo.dev/router/introduction) — file-based routing, typed routes
- TypeScript, strict mode
- Laravel 13 JSON API (CasualOS) with Sanctum token auth
- `expo-secure-store` for token storage

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Point the app at the backend

   ```bash
   cp .env.example .env
   ```

   Fill in `EXPO_PUBLIC_API_BASE_URL` with the current API URL — during development this is
   an ngrok tunnel that changes on restart, so this value goes stale often.

3. Start the dev server

   ```bash
   npx expo start
   ```

   Scan the QR code with **Expo Go** on a physical Android or iOS device. Push notifications
   don't work in Expo Go at any SDK version, but everything else does.

   After editing `.env`, restart with `npx expo start --clear` — `EXPO_PUBLIC_*` values are
   baked in at bundle time, so a plain reload won't pick up the change.

## Project structure

```
app/
  (auth)/         Signed-out screens — login
  (app)/          Signed-in screens
  _layout.tsx     Root layout — gates (auth) vs (app) on auth status
lib/
  api-client.ts   Fetch wrapper, attaches Authorization: Bearer automatically
  auth-context.tsx  Auth state, login/logout, session restore on launch
  secure-storage.ts Token persistence (expo-secure-store)
  types.ts        Shared API types
constants/
  theme.ts        Design tokens ported from the CasualOS customer portal
```

## Status

- **Module 01 — Authentication:** done. Portal link + email sign-in, persistent session,
  sign out.
- **Modules 02–05 — Account & Orders, Catalogue & Ordering, Announcements, Settings:** not
  started.

See `CLAUDE.md` §11 for the full phase-by-phase status.

## Commands

```bash
npx expo start              # dev server + QR code
npx expo start --clear      # same, wiping the bundler cache (use after .env changes)
npx expo install <pkg>      # add a package at an SDK-54-compatible version
npx expo install --check    # check for dependency version mismatches
npx expo-doctor@latest      # project health check, read-only
npm run lint                # eslint
```
