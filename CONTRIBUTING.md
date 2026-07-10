# Contributing to SKY LAB Forms

Thanks for your interest in contributing! This document covers the project architecture, codebase structure, and guidelines for contributing.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Design System & UI Conventions](#design-system--ui-conventions)
- [Authentication & Authorization](#authentication--authorization)
- [How to Contribute](#how-to-contribute)
- [Commit Convention](#commit-convention)

---

## Project Structure

```
src/
├── app/
│   ├── page.js                        # Landing page
│   ├── layout.js                      # Root layout (fonts, providers)
│   ├── providers.js                   # React Query + SessionProvider
│   ├── globals.css                    # Global styles & Tailwind
│   ├── not-found.jsx                  # Custom 404 page
│   │
│   ├── [id]/                          # Public form display
│   │   ├── page.jsx                   # Dynamic metadata + SSR
│   │   └── FormClient.jsx             # Client-side form renderer
│   │
│   ├── component-groups/[groupId]/    # Public shared group preview (tokenized)
│   ├── responses/[responseId]/        # Public shared response preview (tokenized)
│   │
│   ├── admin/                         # Protected admin panel
│   │   ├── page.js                    # Dashboard
│   │   ├── layout.js                  # Sidebar layout
│   │   ├── providers.js               # FormProvider context
│   │   │
│   │   ├── forms/                     # Form CRUD pages
│   │   │   ├── page.jsx               # Forms list
│   │   │   ├── new-form/              # Create form
│   │   │   └── [formId]/              # Form detail, edit, responses
│   │   │
│   │   ├── component-groups/          # Reusable component management
│   │   │   ├── page.jsx               # Groups list
│   │   │   ├── new-group/             # Create group
│   │   │   └── [groupId]/             # Group detail
│   │   │
│   │   ├── how-to-use/                # Built-in documentation
│   │   │
│   │   └── components/                # Admin UI components
│   │       ├── ShareOverlay.jsx       # Reusable share-link modal (group/response/form)
│   │       ├── form-editor/           # Form builder
│   │       │   └── hooks/             # Editor-specific hooks
│   │       ├── form-overview/         # Form analytics
│   │       ├── response-displayer/    # Response viewer
│   │       └── component-group-editor/# Group builder (incl. SharedGroupPreview, GroupEditorContext)
│   │
│   ├── components/                    # Shared components
│   │   ├── AuthLanding.jsx            # Sign-in gate for shared resources
│   │   ├── form-components/           # Field type components
│   │   ├── form-displayer/            # Public form renderer
│   │   │   └── hooks/                 # Displayer hooks
│   │   ├── landing/                   # Landing page sections
│   │   │   ├── Hero.jsx               # Schema + rendered form preview
│   │   │   ├── Features.jsx           # Feature rows
│   │   │   ├── Flow.jsx               # Scroll-driven pipeline
│   │   │   ├── SkylabLogo.jsx
│   │   │   ├── utils.jsx              # Spotlight, Magnetic, scroll reveal
│   │   │   └── components/            # Per-feature interactive demos
│   │   └── form-registry.js           # Field type registry
│   │
│   └── api/
│       └── auth/[...nextauth]/        # NextAuth route handler
│
├── lib/
│   ├── apiClient.js                   # Authenticated HTTP client
│   └── hooks/                         # React Query hooks
│       ├── useFormAdmin.js            # Form CRUD mutations
│       ├── useResponse.js             # Response management
│       ├── useResponseShare.js        # Response share token create/revoke/preview
│       ├── useGroupAdmin.js           # Component group operations
│       ├── useGroupShare.js           # Group share token create + preview + clone
│       ├── useForm.js                 # Public form display & submission
│       ├── useFormContext.js          # Form editor context helper
│       ├── useDraft.js                # Draft queries & mutations
│       ├── useReliableSave.js         # Debounced auto-save primitive (in-flight ordering, retry, unload flush)
│       ├── useUser.js                 # User session
│       └── useMedia.js                # Responsive breakpoints
│
├── auth.js                            # NextAuth Keycloak config (buffered token refresh, federated logout)
└── middleware.js                      # Route protection & role checks
```

> Outside `src/`, the repository root also holds [`mail-templates/`](mail-templates/) — standalone transactional email templates that are **not imported by the app**; they are rendered by a separate notification service and kept here for version control and design consistency (see the README's *Email Templates* section).

---

## Architecture

### Data Flow

```
User ──▶ Next.js (App Router) ──▶ React Query ──▶ apiClient.js ──▶ Backend API
                                       │
                                  Cache Layer
                                  (staleTime, gcTime)
```

### Key Patterns

- **Server Components** for initial page loads and SEO metadata
- **Client Components** for interactive features (form editor, responses)
- **React Query** for all server state — caching, background refetching, optimistic updates
- **Context Providers** for form editor and group editor local state
- **Custom Hooks** (`useFormAdmin`, `useResponse`, `useGroupAdmin`, `useGroupShare`, `useResponseShare`) encapsulate all API logic
- **Component Registry** pattern for extensible field types
- **Tokenized share links** for component groups and responses — the public preview pages (`/component-groups/[groupId]`, `/responses/[responseId]`) read the `?token=` query param, fetch metadata server-side for SEO, and fall back to `AuthLanding` when the token is missing or expired
- **Reliable auto-save** — both the form editor and respondent drafts share `useReliableSave`, a debounced primitive that serializes in-flight requests (no out-of-order writes), retries transient failures, and flushes the latest pending change on unmount / tab close via a `keepalive` request

---

## Design System & UI Conventions

All design tokens live in [`src/app/globals.css`](src/app/globals.css) under `@theme`. The rules below are enforced by convention, not tooling; if you catch yourself typing an arbitrary value (`text-[11px]`, a hex accent, a new ease curve), stop: there is a token or a rule for it.

### Identity

- **Dark theme** on a `neutral-900` canvas with the shared animated `Background` layer
- **Space Grotesk** (sans) + **JetBrains Mono** (mono), declared as `--font-sans` / `--font-mono` in the theme
- **Shimmer skeletons** (`.shimmer`) for async content; all motion respects `prefers-reduced-motion`
- Responsive breakpoints via the `useMedia` hook

### Color

- **One accent: `skylab`** (`skylab-300` → `skylab-900`). No `indigo`, `pink`, `blue` or hex accents anywhere; emphasis is either skylab or a status color. The canonical interactive pattern is a translucent wash: `border-skylab-400/40 bg-skylab-500/10 text-skylab-300` (see `ActionButton`'s primary variant).
- **Grays are `neutral` only.** A `zinc-`/`gray-`/`slate-` class is a copy-paste leftover; replace it.
- **Borders and hairlines step through `white/5`, `white/10` (default) and `white/15`/`white/20` (emphasis).** Surface fills use `white/3`, `white/5`, `white/10`; opaque panels use `bg-neutral-900` at 40–80% opacity. Off-step values (`white/6`, `white/8`, `white/12`) blur the hierarchy; snap to the ladder.
- **Status colors**: `emerald` = success/active, `amber` = pending, `red` = error/destructive. Error focus states stay red.

### Typography

| Token      | Size | Use                                                       |
| ---------- | ---- | --------------------------------------------------------- |
| `text-4xs` | 8px  | Inline role chips next to titles (Sahip/Editör)           |
| `text-3xs` | 10px | Status badges, counters, uppercase section labels         |
| `text-2xs` | 11px | Meta rows: IDs, timestamps, helper text                   |
| `text-xs`+ | 12px | Standard Tailwind scale from here up                      |

- **Never use arbitrary sizes** (`text-[Npx]`); every size in the UI maps to a token above or the standard scale.
- **Uppercase micro labels**: `tracking-[0.18em]` in the admin panel; public form components deliberately keep the tighter `tracking-wide`.
- **Weights**: `font-medium` and `font-semibold` only; `font-bold` is reserved for landing/demo content.

### Radius

| Element                                        | Radius       |
| ---------------------------------------------- | ------------ |
| Controls `h-8` and smaller                     | `rounded-md` |
| `h-9` header controls, cards, icon tiles, avatars | `rounded-lg` |
| Overlay panels (popovers, filter shells)       | `rounded-xl` |

### Motion

- **Framer Motion**: `duration: 0.2` standard, `0.15` for exits, `0.3` for large surfaces (drawers, page-level panels); single ease `[0.22, 1, 0.36, 1]`
- **CSS transitions**: `duration-150/200/300` tiers; prefer `transition-colors` over `transition-all` unless geometry actually animates
- Some components repeat colors as hex inside framer `animate` props; when changing a class, grep the file for the matching hex

### Focus

- **Buttons**: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40`
- **Text inputs**: `focus:border-skylab-400/50`, plus a soft `focus:ring-skylab-400/20` where the input already renders a ring

### Shared primitives

Reach for these before hand-rolling a new variant:

| Primitive      | Location                                      | Use for                                            |
| -------------- | --------------------------------------------- | -------------------------------------------------- |
| `Avatar`       | `src/app/components/utils/Avatar.jsx`         | Any user photo/initials box (`sm`/`md`/`lg`)       |
| `ActionButton` | `src/app/admin/components/utils/ActionButton.jsx` | Admin icon buttons; `primary` is the accent reference |
| `ROLE_BADGE`   | `src/app/admin/components/ListItem.jsx`       | Role chip labels and styles                        |
| `StateCard`    | `src/app/components/StateCard.jsx`            | Empty/error states in lists                        |

> **Exempt on purpose:** the landing family (`components/landing/`, `Landing.jsx`, `Headers.jsx`, `Footer.jsx`) and miniature demo mockups (`admin/how-to-use/components/Demo.jsx`) keep their own sizes, colors and choreography (`Magnetic` + `Spotlight` helpers, scroll reveals). Do not normalize them.

---

## Authentication & Authorization

### Authentication Flow

The platform uses **Keycloak** as an identity provider through **NextAuth.js v5**:

1. User clicks "Sign In" and is redirected to the Keycloak login page
2. After successful authentication, Keycloak returns an access token, refresh token and ID token (all stored in the encrypted JWT session)
3. NextAuth refreshes the access token **ahead of expiry** (60s buffer) so requests never go out with a just-expired token; a failed refresh flags the session with `RefreshAccessTokenError` and stops retrying, and `middleware.js` redirects the user to re-authenticate
4. The API client attaches the Bearer token to all backend requests
5. **Logout is federated** — the `events.signOut` handler in `auth.js` calls Keycloak's end-session endpoint server-side with the stored `id_token_hint`, terminating the SSO session (the `id_token` never leaves the server)

### Role-Based Access Control

| Role      | Access Level                          |
| --------- | ------------------------------------- |
| `ADMIN`   | Full platform access                  |
| `YK`      | Administrative privileges             |
| `DK`      | Standard team management access       |
| `EKIP`    | Team member access                    |

The middleware at `src/middleware.js` protects all `/admin/*` routes and validates user roles before granting access.

---

## How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Commit Convention

This project follows conventional commits:

| Prefix       | Usage              |
| ------------ | ------------------ |
| `feat:`      | New features       |
| `fix:`       | Bug fixes          |
| `refactor:`  | Code refactoring   |
| `restyle:`   | UI/styling changes |
| `docs:`      | Documentation      |
