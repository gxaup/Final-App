# replit.md

## Overview

Full Loop Report is a mobile-first web application for logging bus violations in real-time. The system allows transit inspectors to start monitoring sessions, record various violation types with timestamps and notes, and generate reports. It's designed as a simple, practical field tool for tracking driver infractions on public transit.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled via Vite
- **Routing**: Wouter for lightweight client-side routing (two routes: home and session dashboard)
- **State Management**: TanStack React Query for server state, local React state for UI
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming, supporting light/dark modes
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript compiled with tsx for development, esbuild for production
- **API Design**: RESTful endpoints under `/api/*` prefix with typed route definitions in `shared/routes.ts`
- **Request Validation**: Zod schemas for input validation, shared between client and server

### Data Storage
- **Database**: PostgreSQL via `pg` driver
- **ORM**: Drizzle ORM with schema defined in `shared/schema.ts`
- **Migrations**: Drizzle Kit for schema management (`db:push` command)
- **Schema**: Three tables - `sessions` (monitoring sessions), `violations` (recorded infractions), `violation_types` (configurable violation categories)

### Shared Code Pattern
- The `shared/` directory contains schemas, types, and route definitions used by both client and server
- Zod schemas created with `drizzle-zod` ensure type-safe data validation across the stack
- Path aliases: `@shared/*` maps to `shared/*`, `@/*` maps to `client/src/*`

### Build System
- **Development**: Vite dev server with HMR, tsx for server execution
- **Production**: Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Server Static Serving**: Express serves built client assets in production, falls back to `index.html` for SPA routing

## External Dependencies

### Database
- PostgreSQL database (connection via `DATABASE_URL` environment variable)
- `connect-pg-simple` for session storage capability (available but not currently active)

### Core Libraries
- **drizzle-orm** + **drizzle-kit**: Database ORM and migration tooling
- **zod**: Runtime type validation
- **date-fns** + **date-fns-tz**: Date manipulation with timezone support (configured for America/New_York)

### UI Dependencies
- Full Shadcn/ui component set (accordion, dialog, form, toast, etc.)
- Radix UI primitives for accessible component foundations
- Lucide React for icons
- Embla Carousel, Vaul (drawer), cmdk (command palette)

### Development Tools
- Replit-specific Vite plugins for development experience (`@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`)