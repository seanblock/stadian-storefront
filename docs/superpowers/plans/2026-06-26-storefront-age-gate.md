# Storefront Age Gate — Implementation Plan

> Cross-repo feature. REQUIRED SUB-SKILL: subagent-driven-development.

**Goal:** A tenant-configurable, self-attestation age gate shown on storefront entry ("You must be 21+ to enter" → confirm enters / decline redirects away), configured in the Stadian admin.

**Approved design decisions:** trigger = on store entry (remembered via cookie); decline = redirect to a configurable URL (default `https://www.google.com`); minimum age = per-tenant configurable (default 21).

**Architecture:** Mirror the existing "store closed" gate exactly: tenant config field(s) → exposed on the `/branding` endpoint → storefront root layout checks it and renders a gate before any page. Self-attestation only (NOT identity verification — Persona stays as the separate per-product KYC path).

## Repos & key references (from investigation)
- Backend: `peptide-platform/apps/crm-api`
  - Tenant model `app/models/tenant.py` (has `storefront_enabled`, `storefront_closed_reason` @ ~L40)
  - Branding endpoint `app/routers/storefront/v1/branding.py` (returns StorefrontBranding incl. closed_reason)
  - Branding schema `app/schemas/storefront/v1/branding.py`
  - Tenant update schema `app/schemas/tenant.py` (UpdateTenantRequest ~L19); update endpoint `app/routers/tenants.py:147` (generic field merge)
  - Checkout flow `app/routers/storefront/v1/checkout_flow.py` (~L157-178 adds the `age_verification` DISCLAIMER fallback when no Persona)
- Admin: `peptide-platform/apps/crm-dashboard`
  - `src/pages/settings/GeneralSettingsPage.tsx` (toggle/dropdown for storefront_enabled/closed_reason); save via `src/hooks/useTenantSettings.ts` → PUT `/tenants/me`
- Storefront: `stadian-storefront`
  - Branding read: `src/lib/branding.ts` (getBranding → SDK `client.branding.get()`)
  - Closed gate: `src/app/layout.tsx` (~L80 `isClosed`), `src/components/store-closed.tsx`
  - SDK: `vendor/storefront-sdk/dist/types.d.ts` (StorefrontBranding), version in `vendor/storefront-sdk/package.json`
  - Dialog primitive: Base UI `@base-ui/react/dialog` (used by `src/components/ui/sheet.tsx`); no standalone dialog component yet

## Global Constraints
- Backend changes are ADDITIVE only (new nullable/defaulted columns). Migration must follow the `storefront_closed_reason` migration pattern; verify the alembic DAG (down_revision chains to current head). Run backend tests INSIDE the container.
- Vendored SDK edit MUST bump version + sync `package-lock.json` node version + reinstall (Vercel stale-cache lesson).
- Commit locally on each repo's `main`; NEVER `git push` (ship via `/ship` later).
- Default values: `age_gate_enabled` default False (off — existing stores unaffected); `age_gate_min_age` default 21; `age_gate_redirect_url` default NULL (storefront falls back to `https://www.google.com`).

---

### Task 1 (backend): Tenant age-gate fields + migration
**Files:** `app/models/tenant.py`; new alembic migration in `app/alembic/versions/`.
- Add columns: `age_gate_enabled: bool` (default False, not null), `age_gate_min_age: int` (default 21, not null), `age_gate_redirect_url: str | None` (nullable).
- New migration: `op.add_column` for the three, defaults applied; `down_revision` = current head; downgrade drops them. Verify with `alembic upgrade head` in container + `alembic check`.
- Acceptance: migration applies cleanly in container; model imports; `alembic check` clean.

### Task 2 (backend): expose on update schema + branding endpoint
**Files:** `app/schemas/tenant.py` (UpdateTenantRequest), `app/schemas/storefront/v1/branding.py` (StorefrontBranding response), `app/routers/storefront/v1/branding.py`.
- UpdateTenantRequest: add optional `age_gate_enabled: bool | None`, `age_gate_min_age: int | None`, `age_gate_redirect_url: str | None` (the generic merge in tenants.py picks them up).
- StorefrontBranding response schema + branding.py: include `age_gate_enabled`, `age_gate_min_age`, `age_gate_redirect_url` from the tenant.
- Acceptance: GET /branding returns the three fields; PUT /tenants/me accepts/persists them (test in container).

### Task 3 (backend): suppress broken guest disclaimer when age gate is on
**Files:** `app/routers/storefront/v1/checkout_flow.py`.
- When `tenant.age_gate_enabled` is True, do NOT add the `age_verification` DISCLAIMER fallback step (~L157-178) — the site-entry gate is the age mechanism, and that fallback is unsatisfiable for guests. Leave the Persona path (if `persona_api_key`+`template_id`) untouched.
- Acceptance: with age_gate_enabled, a guest checkout flow no longer returns the age_verification disclaimer step (so `ready_to_checkout` isn't blocked by it); without it, behavior unchanged. Add/adjust a flow test in container.

### Task 4 (admin): GeneralSettingsPage age-gate controls
**Files:** `apps/crm-dashboard/src/pages/settings/GeneralSettingsPage.tsx` (+ types/hook if needed).
- Add a "Storefront Age Gate" section: toggle (age_gate_enabled), number input min age (age_gate_min_age, default 21), text input decline-redirect URL (age_gate_redirect_url, placeholder `https://www.google.com`). Wire into the existing `save()` (PUT /tenants/me) + isDirty.
- Acceptance: toggling + saving persists to the local backend; reload reflects saved values; lint/tsc/build green.

### Task 5 (storefront SDK): StorefrontBranding age-gate fields + version bump
**Files:** `vendor/storefront-sdk/dist/types.d.ts`; `vendor/storefront-sdk/package.json` (+ `package-lock.json`).
- Add to `StorefrontBranding`: `age_gate_enabled?: boolean; age_gate_min_age?: number; age_gate_redirect_url?: string | null;`.
- Bump SDK version (current → next patch), sync lock node version, `rm -rf node_modules/@stadian/storefront-sdk && npm ci`.
- Acceptance: typecheck sees the new fields; version bumped + lock synced.

### Task 6 (storefront): AgeGate modal component
**Files:** new `src/components/age-gate.tsx` (client component).
- `<AgeGate minAge declineUrl branding />`: full-screen modal (reuse Base UI Dialog or a styled overlay matching `store-closed.tsx`), copy "You must be {minAge}+ to enter [store name]." Buttons: **"I am {minAge} or older"** → set a long-lived cookie (e.g. `age_confirmed=1`, 1yr) and dismiss (router.refresh or local state) ; **"Leave"** → `window.location.href = declineUrl || 'https://www.google.com'`. On-brand (logo + colors from branding), accessible (focus trap via Base UI Dialog, non-dismissible by backdrop/escape so it can't be bypassed).
- Acceptance: renders, confirm sets cookie + dismisses, decline redirects; typecheck/lint/build green; verify by temporarily forcing it on in dev.

### Task 7 (storefront): root-layout gate integration
**Files:** `src/app/layout.tsx` (+ read cookie server-side via `next/headers cookies()`).
- After the closed-state check, if `branding.age_gate_enabled` AND the `age_confirmed` cookie is absent (read server-side to avoid a content flash), render `<AgeGate minAge={branding.age_gate_min_age ?? 21} declineUrl={branding.age_gate_redirect_url ?? undefined} branding={branding} />` as a full-screen overlay INSTEAD of (or above) the normal children — mirror how `<StoreClosed>` short-circuits. Confirmed visitors (cookie present) see the normal site.
- Acceptance: with age_gate_enabled + no cookie → gate shown before any page; confirm → cookie set → site accessible on next render; decline → redirect. Verify live in Chrome by temporarily enabling (config or a forced flag) on :3003.

---

## Testing & rollout
- Backend: pytest in container; `alembic upgrade head` + `alembic check`.
- Admin: manual against local backend (:3004 admin → local API); lint/tsc/build.
- Storefront: typecheck/lint/build + e2e green; verify the gate live in Chrome (temporarily forced on, since :3003 reads the LIVE tenant which won't have the new branding fields until the backend deploys).
- Cross-repo note: full end-to-end (admin toggle → live storefront gate) only works after the backend deploys and the SDK/storefront deploys. Build + verify all locally; hold for one `/ship`.
