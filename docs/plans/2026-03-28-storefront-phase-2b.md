# Stadian Storefront Phase 2b — Auth + Account + Affiliate + Intake

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add customer authentication, account management, affiliate portal, and intake forms to the storefront template.

**Architecture:** Auth state managed via React context with JWT in httpOnly cookies (set via Next.js route handlers). Protected routes redirect to login. Affiliate portal conditionally visible based on customer profile fields.

**Tech Stack:** Next.js 16, React 19, shadcn/ui, @stadian/storefront-sdk

---

## Tasks

### Task 1: Auth Provider + Login/Register Pages
### Task 2: Forgot Password + Email Verification Pages
### Task 3: Account Layout + Order History
### Task 4: Account Settings Page
### Task 5: Intake Form + Status Pages
### Task 6: Affiliate Dashboard + Payouts

---

## Execution Order

1. Task 1 (auth provider + login/register) — foundational
2. Task 2 (forgot password + verify email) — extends auth
3. Tasks 3+4 parallel (account layout/orders + settings — different files)
4. Tasks 5+6 parallel (intake + affiliate — different route groups)
