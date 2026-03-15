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
│   │
│   ├── [id]/                          # Public form display
│   │   ├── page.jsx                   # Dynamic metadata + SSR
│   │   └── FormClient.jsx             # Client-side form renderer
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
│   │   ├── how-to-use/               # Built-in documentation
│   │   │
│   │   └── components/                # Admin UI components
│   │       ├── form-editor/           # Form builder
│   │       ├── form-overview/         # Form analytics
│   │       ├── response-displayer/    # Response viewer
│   │       └── component-group-editor/# Group builder
│   │
│   ├── components/                    # Shared components
│   │   ├── form-components/           # Field type components
│   │   ├── form-displayer/            # Public form renderer
│   │   ├── landing/                   # Landing page sections
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
│       ├── useGroupAdmin.js           # Component group operations
│       ├── useForm.js                 # Public form submission
│       ├── useUser.js                 # User session
│       └── useMedia.js               # Responsive breakpoints
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
- **Custom Hooks** (`useFormAdmin`, `useResponse`, `useGroupAdmin`) encapsulate all API logic
- **Component Registry** pattern for extensible field types

### Design System

- **Dark theme** with glass-morphism effects
- **Space Grotesk** (sans-serif) + **JetBrains Mono** (monospace)
- Custom Tailwind color palette (`skylab-500`, `skylab-400`, `skylab-300`)
- Shimmer loading skeletons for async content
- Responsive breakpoints via `useMedia` hook

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
