# Contributing to SKY LAB Forms

Thanks for your interest in contributing! This document covers the project architecture, codebase structure, and guidelines for contributing.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Architecture](#architecture)
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
│       ├── useUser.js                 # User session
│       └── useMedia.js                # Responsive breakpoints
│
├── auth.js                            # NextAuth Keycloak config
└── middleware.js                      # Route protection & role checks
```

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

### Design System

- **Dark theme** built on a `neutral-950` canvas with a shared animated `Background` layer
- **Skylab accent palette** (`skylab-300` → `skylab-700`) used consistently across the landing page, form editor, form displayer, response viewer and component-group editor
- **Space Grotesk** (sans-serif) + **JetBrains Mono** (monospace); mono is used for eyebrows, labels and status chips to reinforce the "schema" feel
- Subtle glass-morphism, thin `white/8` borders and `bg-linear-to-*` gradients over solid fills
- Framer Motion for entrance and scroll-reveal animations; `Magnetic` + `Spotlight` helpers in `landing/utils.jsx`; all motion respects `prefers-reduced-motion`
- Shimmer loading skeletons for async content
- Responsive breakpoints via `useMedia` hook; layouts and typography tuned for mobile in the recent UI/UX pass

---

## Authentication & Authorization

### Authentication Flow

The platform uses **Keycloak** as an identity provider through **NextAuth.js v5**:

1. User clicks "Sign In" and is redirected to the Keycloak login page
2. After successful authentication, Keycloak returns an access token
3. NextAuth manages the session with automatic **token refresh rotation**
4. The API client attaches the Bearer token to all backend requests

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
