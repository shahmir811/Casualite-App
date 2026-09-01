# Casualite Mobile App — Claude Project Context

This file gives Claude the context needed to work on the Casualite customer app correctly.
**Read this entire file before writing any code.**

Expo has changed a lot between versions. This project is on **SDK 54** — read the exact
versioned docs at <https://docs.expo.dev/versions/v54.0.0/>, not `/latest/`. Answers found
online for SDK 50 or below are frequently wrong for this project.

---

## 0. Golden rules

Six things that cause real damage if broken. Everything else in this file is detail.

1. **Never calculate order prices in this app.** The collective-quantity pricing lives in
   `OrderPlacementService` on the Laravel side and is called through the API. See §4.
2. **Never add a feature outside the five modules in §3.** Anything else is a paid change
   request at Rs. 20,000. The margin on this contract is thin; scope discipline is the project.
3. **No SMTP anywhere in the auth path.** Email is never used to send anything. See §5.
4. **The bundle ID is `com.techmint.casualite` and never changes.** Changing it after a
   store submission means a new app listing and losing every installed user.
5. **Do not redesign the UI.** Port the existing customer portal's visual language. Customers
   already know that interface. See §7.
6. **Do not touch the CasualOS web portal or public order form.** They keep working exactly
   as they do today, on `portal_token` and `order_token`. This app is additive.

---

## 1. What this project is

A customer-facing iOS and Android app for **Casualite** (also written "Casual Lite"), a
Pakistani clothing brand. Built by **The Techmint Ltd** (UK, company no. 16834286).

It sits on top of **CasualOS**, the Laravel business operations system already delivered to
the same client. CasualOS lives in the sibling folder `../casualos/` and its own `CLAUDE.md`
holds the full domain model — read it whenever a question touches business rules, database
enums or the existing portal.

**Commercials:** PKR 250,000 one-time, PKR 15,000/month maintenance from go-live.
Timeline 4–5 weeks from signing (signed 7 August 2026).

**The developer is new to React Native** and experienced in Laravel, Blade and Alpine.js.
Explain React Native concepts when they come up rather than assuming them. Prefer one
concrete next step over a comprehensive plan.

---

## 2. Stack

| | |
|---|---|
| Framework | Expo **SDK 54** (`expo ~54.0.35`) |
| React Native | 0.81.5 · New Architecture enabled (`newArchEnabled: true`) |
| React | 19.1.0 |
| Routing | `expo-router` ~6.0.24 — file-based, typed routes enabled |
| Language | TypeScript (`~5.9.2`), strict |
| Backend | Laravel 13 JSON API on the existing CasualOS app, Sanctum token auth |
| Push | `expo-notifications` (APNs + FCM) — **Phase 4, requires a development build** |
| Token storage | `expo-secure-store` |

**React Compiler is enabled** (`experiments.reactCompiler: true`). Do not add manual
`useMemo` / `useCallback` for performance; the compiler handles memoisation. Only reach for
them when a value's referential identity is semantically required.

### Why SDK 54 and not 57

Expo Go in the App Store and Play Store is stuck on SDK 54 — Apple has been sitting on
Expo's update submissions since ~SDK 55. Projects on newer SDKs refuse to open in it.

This is a deliberate temporary trade for zero-setup testing on real phones during weeks 1–3.
**SDK 54 reaches end-of-life around September/October 2026.** The bump to a current SDK
happens in Phase 4 alongside the development-build migration (both are required for push
notifications anyway). Do not launch on SDK 54.

---

## 3. Scope — the five modules

This is the agreed contract scope. Nothing outside it gets built without a change request.

| # | Module | Covers |
|---|---|---|
| 01 | **Authentication** | Portal link + email sign-in (no password), persistent session, sign out |
| 02 | **Account & Orders** | Payment status, outstanding balance, advance credit, order history with expandable detail — activity trail, pieces with photos and sizes, dispatch batches, shipping address |
| 03 | **Catalogue & Ordering** | Browse open catalogues with cover photos and designs, size-wise quantity entry, live order value, place order with confirmation |
| 04 | **Announcements** | Push notifications, in-app announcement history. (The admin sending interface is built in CasualOS, not here.) |
| 05 | **Settings** | Notification preferences, sign out, app version |

**Module 02 is one scrolling screen with expandable order cards**, mirroring
`../casualos/resources/views/portal/dashboard.blade.php`. Do not split it into four screens.

**No account deletion request in Settings.** An earlier draft of this scope called for one
as Apple-rejection insurance; the Casualite owner has since confirmed there is no path to
delete an account and none is wanted. Do not add one without the owner reopening this.

---

## 4. The collective-quantity model — read this twice

This is the single easiest thing in the whole project to get wrong.

A **catalogue** is a season (e.g. ISHQIA) containing several **designs**. The customer enters
**one** set of XS/S/M/L/XL quantities for the whole catalogue, and that same set applies to
**every design in it**.

```
Catalogue with 7 designs. Customer enters: XS=1
→ 1 piece per design × 7 designs = 7 pieces total
```

`piecesPerDesign` is the sum of the five size inputs. The order total is
`piecesPerDesign × unitPrice`, summed across every design.

**Pricing tier:** when the catalogue has a `quantity_benchmark` and `piecesPerDesign` is
**strictly greater** than it, each design's `discount_price` is used instead of
`selling_price`. Designs with a null `discount_price` stay on selling price. Prices are
rounded to whole rupees per design *before* multiplying.

> Note: `../casualos/CLAUDE.md` describes this threshold as "meets or exceeds". That is
> wrong — the shipped behaviour in both the Laravel controller and the Alpine `orderCalc()`
> is strictly greater-than. The code is right, the doc is wrong.

### Do not implement any of the above in this app

It already exists once, in `../casualos/app/Services/OrderPlacementService.php`, and it is
reachable through the API:

- `OrderPlacementService::quote()` prices an order and **writes nothing** — this is what the
  live running total on the order screen should call.
- `OrderPlacementService::place()` creates the order.

Reimplementing the maths in TypeScript means a customer can be quoted one price in the app
and invoiced another. That is the highest-impact failure mode in this project.

Regression tests live at `../casualos/tests/Unit/OrderPlacementServiceTest.php`.

---

## 5. Authentication design (decided — do not re-litigate)

**Portal link + email. Not a password, not OTP. No email sending, ever.**

- Each customer has a permanent, never-changing `portal_token` (a UUID), generated once and
  sent to them over WhatsApp by the admin. It does not expire and does not rotate.
- Logging in proves two factors: something you have (the portal link) and something you know
  (the email on file) — there is no password anywhere in this flow.
- `POST /api/auth/verify` takes `portal_token` (bare token or a full pasted URL — the server
  extracts the token; the client never pre-parses it) and `email`. On success it returns a
  **long-lived Sanctum token**, stored in `expo-secure-store` (never `AsyncStorage` — that's
  unencrypted).
- The session persists. Customers should not be asked to log in repeatedly.
- There is nothing to change in Settings — no password exists to change.
- **Access recovery is owner-side.** If a customer loses the WhatsApp message, the admin
  just resends the same never-changing portal link. There is no "forgot password" flow
  because there is no password.

OTP was explicitly rejected: it would make every login depend on email delivery, and the
owner already onboards customers manually over WhatsApp. There is no `password` column on
`customers` (Laravel side).

**On sign-out:** revoke the token via `POST /api/auth/logout`, deregister the push token via
`DELETE /api/push-tokens`, and clear secure storage. All three, or the user keeps getting pushes.

---

## 6. API contract

Base URL comes from an environment variable — never hardcode a host. All authenticated
requests send `Authorization: Bearer <token>` and `Accept: application/json`.

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/verify` | portal_token (bare or full URL) + email → token |
| POST | `/api/auth/logout` | Revoke current token |
| GET | `/api/me` | Profile, balance, advance credit |
| GET | `/api/catalogues` | Open catalogues with covers |
| GET | `/api/catalogues/{id}` | Designs, photos, pricing |
| POST | `/api/catalogues/{id}/quote` | Price a prospective order without writing it — calls `OrderPlacementService::quote()` |
| POST | `/api/orders` | Place order (collective quantity model) |
| GET | `/api/orders` | Order history with status |
| GET | `/api/orders/{id}` | Full breakdown, activity, dispatch |
| GET | `/api/ledger` | Dated statement |
| GET | `/api/announcements` | Announcement history |
| POST | `/api/announcements/{id}/read` | Mark one announcement read |
| POST | `/api/push-tokens` | Register Expo push token |
| DELETE | `/api/push-tokens` | Deregister on sign-out |

Note: earlier drafts of this doc called the last two `/api/devices` — the shipped Laravel
route and the RN client (`lib/push-notifications.ts`) both use `/api/push-tokens`. Use that
name.

### Order placement error codes

`POST /api/orders` can fail for business reasons, surfaced as stable string codes from
`OrderPlacementException`. Handle all four with specific messages — never a generic failure:

| Code | Meaning |
|---|---|
| `catalogue_closed` | Admin closed the catalogue; it no longer accepts orders |
| `no_quantity` | Every size was zero |
| `customer_not_found` | No customer registered with that email |
| `duplicate_order` | One order per customer per catalogue — they already ordered |

### Enum values the app must match exactly

```
orders.status         received | confirmed | stitching | partially_dispatched | dispatched | cancelled
catalogues.status     open | closed
sizes                 xs | s | m | l | xl
```

Full enum reference is in `../casualos/CLAUDE.md` §4.

### Every screen has three states

There is no server-rendered page here. Every screen that fetches must handle **loading**,
**loaded** and **failed**, plus empty-list cases. Customers are on mobile data in Pakistan;
slow and flaky connections are the normal case, not the edge case.

---

## 7. Design system

Port the existing portal's visual language. Do not redesign.

| Token | Value |
|---|---|
| Primary / accent | `#0071E3` |
| Background (app chrome) | `#F5F5F7` |
| Background (surfaces) | `#FFFFFF` |
| Text primary | `#1D1D1F` |
| Text secondary | `#86868B` |
| Link | `#0066CC` |
| Border / divider | `#F2F2F7` |
| Base spacing unit | 4px |
| Card radius | 12–16px |

- **Primary button:** `#0071E3` background, white text, pill-shaped (`borderRadius: 980`)
- **Secondary button:** `#F5F5F7` background, `#0066CC` text, pill-shaped
- **Typography:** system font (San Francisco on iOS, Roboto on Android). Do not ship a
  custom font — it costs bundle size for no benefit here.

The app is **light mode only**. The scaffold shipped with a light/dark theme system
(`constants/theme.ts`, `hooks/use-color-scheme.ts`); the portal is light-only and the design
brief doesn't call for dark mode. Strip it rather than maintaining two palettes.

Currency is always displayed as `PKR 12,345` — whole rupees, thousands separators, no decimals.

---

## 8. Project structure and conventions

```
app/                 Screens. File-based routes — app/login.tsx is /login
  _layout.tsx        Root layout, auth gate, providers
components/          Reusable UI. kebab-case filenames
constants/           Theme tokens, config
hooks/               Custom hooks, use- prefix
lib/ or services/    API client, secure storage, formatters
```

- **Filenames are kebab-case** (`order-card.tsx`), matching the Expo template's convention.
  Components inside are PascalCase.
- **Route groups** use parentheses: `app/(auth)/login.tsx` — the folder name doesn't appear
  in the URL. Use `(auth)` and `(app)` groups to separate signed-out from signed-in screens.
- **Styling is `StyleSheet.create`**, defined at the bottom of the file. No inline style
  objects in JSX except for genuinely dynamic values. There is no Tailwind here.
- **Every string shown to a customer** should read as the portal reads — plain, calm, no
  developer jargon in error messages.

Expo's demo scaffolding (`app/(tabs)/`, `hello-wave.tsx`, `parallax-scroll-view.tsx`,
`themed-text.tsx` and friends) has already been removed. If it ever reappears from a
template regeneration, delete it rather than building around it.

---

## 9. Known gotchas

- **Never run `npm` under `sudo`.** It leaves root-owned files in `~/.npm` that break every
  later install. If permissions fail, fix ownership: `sudo chown -R $(whoami) ~/.npm`.
- **Do not run `npm audit fix --force`.** It installs breaking major versions and destroys
  Expo's tested dependency set. A fresh Expo install reporting ~22 vulnerabilities is normal;
  nearly all are in build tooling that never ships in the binary. Use `npx expo install --check`.
- **Install packages with `npx expo install`, not `npm install`.** It picks versions
  compatible with SDK 54. `npm install` will happily give you a version that breaks the build.
- **Push notifications do not work in Expo Go** at any SDK version — Expo Go has Expo's own
  bundle identifier, so notifications addressed to `com.techmint.casualite` can't reach it.
  This is structural. Module 04 requires a development build.
- **`localhost` does not exist on a phone.** Point the API base URL at the Mac's LAN IP or
  an ngrok tunnel during development.
- **Images from CasualOS** come through `Storage::url()`. If `php artisan storage:link`
  hasn't been run on the server, every image 404s and it looks like an app bug.

---

## 10. Commands

```bash
npx expo start              # dev server + QR code
npx expo start --clear      # same, wiping the bundler cache (use after dependency changes)
npx expo install <pkg>      # add a package at an SDK-54-compatible version
npx expo install --check    # check for dependency version mismatches
npx expo-doctor@latest      # project health check, read-only
npm run lint                # eslint
npm run reset-project       # remove the template's demo screens
```

---

## 11. Status

- **Phase 1 — environment:** done. Scaffolded on SDK 54, running on a physical Android
  phone and iPhone via Expo Go. EAS project linked (`casualiteos`), `app.json` carries the
  final bundle identifiers, and an Android development build has been built and installed
  on a physical device.
- **Phase 2 — backend API:** done. `OrderPlacementService` extracted; `/api/auth/verify`,
  `/api/auth/logout`, `/api/me`, `/api/catalogues`, `/api/catalogues/{id}`,
  `/api/catalogues/{id}/quote`, `/api/orders`, `/api/orders/{id}`, `/api/ledger`,
  `/api/announcements` + `/api/announcements/{id}/read`, and `/api/push-tokens`
  (POST + DELETE) are all built and consumed by the app.
- **Phase 3 — app build:** done. All five modules have screens: 01 Authentication,
  02 Account & Orders, 03 Catalogue & Ordering, 04 Announcements (list, detail with
  swipeable image gallery, unread indicator on Home, mark-as-read on open), and
  05 Settings (notification status with a link to system settings, sign out, app version —
  no account deletion item, see §3).
- **Phase 4 — push + development build + SDK bump:** push notifications are fully working
  on Android — permission request, token registration/deregistration, foreground handling,
  tap-to-deep-link (both order and announcement pushes), silent resync on cold start/
  foreground — verified end-to-end on a physical device, with FCM V1 credentials uploaded
  via `eas credentials`. **Apple Developer Program organization enrolment is now approved**
  (confirmed via Apple's welcome email) — the enrolment blocker is cleared. iOS work itself
  has not started yet: no APNs key generated, no iOS development build produced, no iOS
  device testing done. The SDK 54 → current bump has not started either. Next concrete steps
  are §4.0/§4.1 in `../Mobile-App-Development-Plan.md` — iOS development build via
  `eas build --profile development --platform ios`, then generating and uploading the APNs
  key.

**Sign-out revokes the token.** `POST /api/auth/logout` (Sanctum-guarded) exists on the
Laravel side and deletes only the token used for that request — other devices stay signed
in. `lib/auth-context.tsx`'s `logout()` calls it before clearing local state, best-effort
(a network failure logs and still clears local state rather than trapping the customer in a
signed-in view). Covered by `casualos/tests/Feature/Api/AuthTest.php`.

The full six-phase checklist is `../Mobile-App-Development-Plan.md`. Keep it current.
