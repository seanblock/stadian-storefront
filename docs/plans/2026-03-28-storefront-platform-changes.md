# Storefront Platform Changes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the missing API endpoints, SDK methods, and CRM dashboard UI needed to support the standalone storefront template.

**Architecture:** New storefront API endpoints for branding, customer auth improvements (forgot/reset password, email verification), and affiliate data (commissions, payouts). SDK updated with corresponding methods. CRM dashboard gets expanded branding settings. All changes follow existing patterns in the codebase.

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, TypeScript (SDK), React (CRM dashboard)

**Spec:** `docs/superpowers/specs/2026-03-28-stadian-storefront-design.md`

---

### Task 1: Storefront Branding Endpoint

**Files:**
- Create: `apps/crm-api/app/schemas/storefront/v1/branding.py`
- Modify: `apps/crm-api/app/routers/storefront/__init__.py`
- Create: `apps/crm-api/app/routers/storefront/v1/branding.py`
- Create: `apps/crm-api/tests/test_storefront_branding.py`

- [ ] **Step 1: Write the failing test**

```python
# apps/crm-api/tests/test_storefront_branding.py
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tenant import Tenant
from tests.helpers import create_storefront_key


@pytest.mark.asyncio
async def test_get_branding_returns_tenant_branding(
    client: AsyncClient, db: AsyncSession, test_tenant: Tenant
):
    """GET /v1/storefront/branding returns the tenant's branding config."""
    test_tenant.branding = {
        "store_name": "Apex Peptide Labs",
        "tagline": "Research-grade peptides",
        "logo_url": "https://example.com/logo.png",
        "primary_color": "#2563eb",
        "accent_color": "#10b981",
        "mode": "light",
        "social_links": {"instagram": "https://instagram.com/apex"},
        "footer_text": "2026 Apex Peptide Labs",
    }
    await db.flush()

    raw_key = await create_storefront_key(db, test_tenant.id)
    resp = await client.get(
        "/v1/storefront/branding",
        headers={"X-API-Key": raw_key},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["store_name"] == "Apex Peptide Labs"
    assert data["primary_color"] == "#2563eb"
    assert data["social_links"]["instagram"] == "https://instagram.com/apex"


@pytest.mark.asyncio
async def test_get_branding_returns_defaults_when_empty(
    client: AsyncClient, db: AsyncSession, test_tenant: Tenant
):
    """GET /v1/storefront/branding returns empty/default values when branding not configured."""
    test_tenant.branding = {}
    await db.flush()

    raw_key = await create_storefront_key(db, test_tenant.id)
    resp = await client.get(
        "/v1/storefront/branding",
        headers={"X-API-Key": raw_key},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["store_name"] is None
    assert data["primary_color"] is None


@pytest.mark.asyncio
async def test_get_branding_requires_api_key(client: AsyncClient):
    """GET /v1/storefront/branding without API key returns 401."""
    resp = await client.get("/v1/storefront/branding")
    assert resp.status_code == 401
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker compose exec crm-api pytest tests/test_storefront_branding.py -v`
Expected: FAIL — route not found (404)

- [ ] **Step 3: Create the branding schema**

```python
# apps/crm-api/app/schemas/storefront/v1/branding.py
from pydantic import BaseModel


class StorefrontBranding(BaseModel):
    store_name: str | None = None
    tagline: str | None = None
    logo_url: str | None = None
    primary_color: str | None = None
    accent_color: str | None = None
    mode: str | None = None
    social_links: dict | None = None
    footer_text: str | None = None
```

- [ ] **Step 4: Create the branding router**

```python
# apps/crm-api/app/routers/storefront/v1/branding.py
from typing import Annotated

from fastapi import APIRouter, Depends

from app.models.tenant import Tenant
from app.routers.storefront.deps import require_api_key
from app.schemas.storefront.v1.branding import StorefrontBranding

router = APIRouter(tags=["storefront-branding"])


@router.get("/branding", response_model=StorefrontBranding)
async def get_branding(
    tenant: Annotated[Tenant, Depends(require_api_key)],
):
    """Return the tenant's storefront branding configuration."""
    branding = tenant.branding or {}
    return StorefrontBranding(
        store_name=branding.get("store_name") or branding.get("business_name"),
        tagline=branding.get("tagline"),
        logo_url=branding.get("logo_url"),
        primary_color=branding.get("primary_color"),
        accent_color=branding.get("accent_color"),
        mode=branding.get("mode"),
        social_links=branding.get("social_links"),
        footer_text=branding.get("footer_text"),
    )
```

- [ ] **Step 5: Mount the branding router**

In `apps/crm-api/app/routers/storefront/__init__.py`, add:

```python
from app.routers.storefront.v1 import branding as v1_branding

storefront_router.include_router(v1_branding.router)
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `docker compose exec crm-api pytest tests/test_storefront_branding.py -v`
Expected: 3 passed

- [ ] **Step 7: Commit**

```bash
git add apps/crm-api/app/schemas/storefront/v1/branding.py apps/crm-api/app/routers/storefront/v1/branding.py apps/crm-api/app/routers/storefront/__init__.py apps/crm-api/tests/test_storefront_branding.py
git commit -m "feat(storefront): add GET /v1/storefront/branding endpoint"
```

---

### Task 2: Customer Forgot Password & Reset

**Files:**
- Modify: `apps/crm-api/app/schemas/storefront/v1/customers.py`
- Modify: `apps/crm-api/app/routers/storefront/v1/customers.py`
- Modify: `apps/crm-api/tests/test_storefront_customers.py`

- [ ] **Step 1: Write the failing tests**

Add to `apps/crm-api/tests/test_storefront_customers.py`:

```python
@pytest.mark.asyncio
async def test_forgot_password_returns_ok(
    client: AsyncClient, db: AsyncSession, test_tenant: Tenant
):
    """POST /v1/storefront/customers/forgot-password returns 200 even if email not found (no enumeration)."""
    raw_key = await create_storefront_key(db, test_tenant.id)
    resp = await client.post(
        "/v1/storefront/customers/forgot-password",
        json={"email": "nonexistent@example.com"},
        headers={"X-API-Key": raw_key},
    )
    assert resp.status_code == 200
    assert resp.json()["ok"] is True


@pytest.mark.asyncio
async def test_forgot_password_stores_token_for_existing_user(
    client: AsyncClient, db: AsyncSession, test_tenant: Tenant
):
    """POST forgot-password for existing customer stores a reset token in Redis."""
    raw_key = await create_storefront_key(db, test_tenant.id)
    # Register a customer first
    await client.post(
        "/v1/storefront/customers/register",
        json={
            "email": "reset@example.com",
            "password": "Password123",
            "first_name": "Reset",
            "last_name": "User",
        },
        headers={"X-API-Key": raw_key},
    )
    resp = await client.post(
        "/v1/storefront/customers/forgot-password",
        json={"email": "reset@example.com"},
        headers={"X-API-Key": raw_key},
    )
    assert resp.status_code == 200
    assert resp.json()["ok"] is True


@pytest.mark.asyncio
async def test_reset_password_with_valid_token(
    client: AsyncClient, db: AsyncSession, test_tenant: Tenant
):
    """POST /v1/storefront/customers/reset-password with valid token updates password."""
    raw_key = await create_storefront_key(db, test_tenant.id)
    # Register customer
    await client.post(
        "/v1/storefront/customers/register",
        json={
            "email": "resetpw@example.com",
            "password": "OldPassword123",
            "first_name": "Reset",
            "last_name": "PW",
        },
        headers={"X-API-Key": raw_key},
    )
    # Request reset
    await client.post(
        "/v1/storefront/customers/forgot-password",
        json={"email": "resetpw@example.com"},
        headers={"X-API-Key": raw_key},
    )
    # Get token from Redis (test helper)
    from app.redis import redis_client

    keys = await redis_client.keys("storefront_reset:*")
    assert len(keys) == 1
    token = keys[0].split(":")[-1]

    # Reset password
    resp = await client.post(
        "/v1/storefront/customers/reset-password",
        json={"token": token, "new_password": "NewPassword456"},
        headers={"X-API-Key": raw_key},
    )
    assert resp.status_code == 200
    assert resp.json()["ok"] is True

    # Verify can login with new password
    resp = await client.post(
        "/v1/storefront/customers/login",
        json={"email": "resetpw@example.com", "password": "NewPassword456"},
        headers={"X-API-Key": raw_key},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_reset_password_with_invalid_token(
    client: AsyncClient, db: AsyncSession, test_tenant: Tenant
):
    """POST reset-password with invalid token returns 400."""
    raw_key = await create_storefront_key(db, test_tenant.id)
    resp = await client.post(
        "/v1/storefront/customers/reset-password",
        json={"token": "invalid-token", "new_password": "NewPassword456"},
        headers={"X-API-Key": raw_key},
    )
    assert resp.status_code == 400
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker compose exec crm-api pytest tests/test_storefront_customers.py -k "forgot_password or reset_password" -v`
Expected: FAIL — routes not found

- [ ] **Step 3: Add schemas**

Add to `apps/crm-api/app/schemas/storefront/v1/customers.py`:

```python
class StorefrontForgotPasswordRequest(BaseModel):
    email: EmailStr


class StorefrontResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)
```

- [ ] **Step 4: Implement the endpoints**

Add to `apps/crm-api/app/routers/storefront/v1/customers.py`:

```python
from app.redis import redis_client
from app.services.auth import generate_reset_token, hash_password

RESET_TOKEN_TTL = 3600  # 1 hour


@router.post("/forgot-password")
async def forgot_password(
    body: StorefrontForgotPasswordRequest,
    tenant: Annotated[Tenant, Depends(require_api_key)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Request a password reset. Always returns 200 to prevent email enumeration."""
    result = await db.execute(
        select(User).where(
            User.tenant_id == tenant.id,
            User.email == body.email,
            User.role == "customer",
        )
    )
    user = result.scalar_one_or_none()

    if user:
        token = generate_reset_token()
        await redis_client.set(
            f"storefront_reset:{token}",
            f"{tenant.id}:{user.id}",
            ex=RESET_TOKEN_TTL,
        )
        # TODO: In production, the storefront sends the reset email via Resend.
        # This endpoint just creates the token. The storefront calls this endpoint,
        # then sends the email itself using the token returned in a future iteration,
        # OR the tenant configures a webhook to send the email.

    return {"ok": True}


@router.post("/reset-password")
async def reset_password(
    body: StorefrontResetPasswordRequest,
    tenant: Annotated[Tenant, Depends(require_api_key)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Reset password using a valid token."""
    stored = await redis_client.get(f"storefront_reset:{body.token}")
    if not stored:
        raise AppError("BAD_REQUEST", "Invalid or expired reset token", 400)

    stored_tenant_id, stored_user_id = stored.split(":")
    if stored_tenant_id != str(tenant.id):
        raise AppError("BAD_REQUEST", "Invalid or expired reset token", 400)

    result = await db.execute(
        select(User).where(User.id == stored_user_id, User.tenant_id == tenant.id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise AppError("BAD_REQUEST", "Invalid or expired reset token", 400)

    user.password_hash = hash_password(body.new_password)
    await redis_client.delete(f"storefront_reset:{body.token}")

    return {"ok": True}
```

Update imports at the top of the file:

```python
from app.errors import AppError, ConflictError
from app.redis import redis_client
from app.schemas.storefront.v1.customers import (
    StorefrontCustomerProfile,
    StorefrontForgotPasswordRequest,
    StorefrontLoginRequest,
    StorefrontLoginResponse,
    StorefrontRegisterRequest,
    StorefrontResetPasswordRequest,
)
from app.services.auth import (
    create_access_token,
    generate_refresh_token,
    generate_reset_token,
    hash_password,
    verify_password,
)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `docker compose exec crm-api pytest tests/test_storefront_customers.py -k "forgot_password or reset_password" -v`
Expected: 4 passed

- [ ] **Step 6: Commit**

```bash
git add apps/crm-api/app/schemas/storefront/v1/customers.py apps/crm-api/app/routers/storefront/v1/customers.py apps/crm-api/tests/test_storefront_customers.py
git commit -m "feat(storefront): add forgot-password and reset-password endpoints"
```

---

### Task 3: Customer Email Verification

**Files:**
- Modify: `apps/crm-api/app/schemas/storefront/v1/customers.py`
- Modify: `apps/crm-api/app/routers/storefront/v1/customers.py`
- Modify: `apps/crm-api/tests/test_storefront_customers.py`

- [ ] **Step 1: Write the failing tests**

Add to `apps/crm-api/tests/test_storefront_customers.py`:

```python
@pytest.mark.asyncio
async def test_verify_email_with_valid_token(
    client: AsyncClient, db: AsyncSession, test_tenant: Tenant
):
    """POST /v1/storefront/customers/verify-email with valid token marks user as verified."""
    raw_key = await create_storefront_key(db, test_tenant.id)
    # Register customer (which should store a verification token)
    register_resp = await client.post(
        "/v1/storefront/customers/register",
        json={
            "email": "verify@example.com",
            "password": "Password123",
            "first_name": "Verify",
            "last_name": "Me",
        },
        headers={"X-API-Key": raw_key},
    )
    assert register_resp.status_code == 201

    # Get token from Redis
    from app.redis import redis_client

    keys = await redis_client.keys("storefront_verify:*")
    assert len(keys) >= 1
    token = keys[-1].split(":")[-1]

    resp = await client.post(
        "/v1/storefront/customers/verify-email",
        json={"token": token},
        headers={"X-API-Key": raw_key},
    )
    assert resp.status_code == 200
    assert resp.json()["ok"] is True


@pytest.mark.asyncio
async def test_verify_email_with_invalid_token(
    client: AsyncClient, db: AsyncSession, test_tenant: Tenant
):
    """POST verify-email with invalid token returns 400."""
    raw_key = await create_storefront_key(db, test_tenant.id)
    resp = await client.post(
        "/v1/storefront/customers/verify-email",
        json={"token": "bad-token"},
        headers={"X-API-Key": raw_key},
    )
    assert resp.status_code == 400
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker compose exec crm-api pytest tests/test_storefront_customers.py -k "verify_email" -v`
Expected: FAIL — route not found

- [ ] **Step 3: Add schema**

Add to `apps/crm-api/app/schemas/storefront/v1/customers.py`:

```python
class StorefrontVerifyEmailRequest(BaseModel):
    token: str
```

- [ ] **Step 4: Modify register to store verification token**

In `apps/crm-api/app/routers/storefront/v1/customers.py`, update `register_customer` to store a verification token after creating the user:

```python
from app.services.auth import (
    create_access_token,
    generate_refresh_token,
    generate_reset_token,
    generate_verification_token,
    hash_password,
    verify_password,
)

VERIFY_TOKEN_TTL = 86400  # 24 hours


@router.post("/register", response_model=StorefrontCustomerProfile, status_code=201)
async def register_customer(
    body: StorefrontRegisterRequest,
    tenant: Annotated[Tenant, Depends(require_api_key)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Register a new customer for this tenant's storefront."""
    result = await db.execute(
        select(User).where(
            User.tenant_id == tenant.id,
            User.email == body.email,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise ConflictError("A customer with this email already exists")

    full_name = f"{body.first_name} {body.last_name}".strip()

    user = User(
        tenant_id=tenant.id,
        email=body.email,
        name=full_name,
        password_hash=hash_password(body.password),
        role="customer",
        phone=body.phone,
    )
    db.add(user)
    await db.flush()

    # Store email verification token
    token = generate_verification_token()
    await redis_client.set(
        f"storefront_verify:{token}",
        f"{tenant.id}:{user.id}",
        ex=VERIFY_TOKEN_TTL,
    )

    return _build_profile(user)
```

- [ ] **Step 5: Add verify-email endpoint**

Add to `apps/crm-api/app/routers/storefront/v1/customers.py`:

```python
@router.post("/verify-email")
async def verify_email(
    body: StorefrontVerifyEmailRequest,
    tenant: Annotated[Tenant, Depends(require_api_key)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Verify a customer's email address using the token from registration."""
    stored = await redis_client.get(f"storefront_verify:{body.token}")
    if not stored:
        raise AppError("BAD_REQUEST", "Invalid or expired verification token", 400)

    stored_tenant_id, stored_user_id = stored.split(":")
    if stored_tenant_id != str(tenant.id):
        raise AppError("BAD_REQUEST", "Invalid or expired verification token", 400)

    result = await db.execute(
        select(User).where(User.id == stored_user_id, User.tenant_id == tenant.id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise AppError("BAD_REQUEST", "Invalid or expired verification token", 400)

    user.email_verified = True
    await redis_client.delete(f"storefront_verify:{body.token}")

    return {"ok": True}
```

Update imports to include `StorefrontVerifyEmailRequest`.

- [ ] **Step 6: Check if User model has email_verified field**

Run: `docker compose exec crm-api grep -n "email_verified" apps/crm-api/app/models/user.py`

If the field doesn't exist, add to `apps/crm-api/app/models/user.py`:

```python
email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
```

And create a migration:

```bash
docker compose exec crm-api alembic revision --autogenerate -m "add email_verified to users"
docker compose exec crm-api alembic upgrade head
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `docker compose exec crm-api pytest tests/test_storefront_customers.py -k "verify_email" -v`
Expected: 2 passed

- [ ] **Step 8: Run all storefront customer tests to verify no regressions**

Run: `docker compose exec crm-api pytest tests/test_storefront_customers.py -v`
Expected: All passed

- [ ] **Step 9: Commit**

```bash
git add apps/crm-api/app/schemas/storefront/v1/customers.py apps/crm-api/app/routers/storefront/v1/customers.py apps/crm-api/app/models/user.py apps/crm-api/tests/test_storefront_customers.py
git add apps/crm-api/alembic/versions/  # include migration if created
git commit -m "feat(storefront): add email verification on registration"
```

---

### Task 4: Add Affiliate Fields to Customer Profile

**Files:**
- Modify: `apps/crm-api/app/schemas/storefront/v1/customers.py`
- Modify: `apps/crm-api/app/routers/storefront/v1/customers.py`
- Modify: `apps/crm-api/tests/test_storefront_customers.py`

- [ ] **Step 1: Write the failing test**

Add to `apps/crm-api/tests/test_storefront_customers.py`:

```python
@pytest.mark.asyncio
async def test_customer_me_includes_affiliate_fields(
    client: AsyncClient, db: AsyncSession, test_tenant: Tenant
):
    """GET /v1/storefront/customers/me includes affiliate fields when present."""
    raw_key = await create_storefront_key(db, test_tenant.id)
    # Register and login
    await client.post(
        "/v1/storefront/customers/register",
        json={
            "email": "affiliate@example.com",
            "password": "Password123",
            "first_name": "Affiliate",
            "last_name": "User",
        },
        headers={"X-API-Key": raw_key},
    )
    login_resp = await client.post(
        "/v1/storefront/customers/login",
        json={"email": "affiliate@example.com", "password": "Password123"},
        headers={"X-API-Key": raw_key},
    )
    token = login_resp.json()["access_token"]

    # Set affiliate fields on the user
    from sqlalchemy import select as sa_select

    from app.models.user import User

    result = await db.execute(
        sa_select(User).where(User.email == "affiliate@example.com", User.tenant_id == test_tenant.id)
    )
    user = result.scalar_one()
    user.affiliate_code = "AFF123"
    user.commission_rate = 0.20
    user.affiliate_link_slug = "affiliate-user"
    user.affiliate_status = "active"
    await db.flush()

    resp = await client.get(
        "/v1/storefront/customers/me",
        headers={"X-API-Key": raw_key, "Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["affiliate_code"] == "AFF123"
    assert data["commission_rate"] == 0.20
    assert data["affiliate_link_slug"] == "affiliate-user"
    assert data["affiliate_status"] == "active"


@pytest.mark.asyncio
async def test_customer_me_affiliate_fields_null_when_not_affiliate(
    client: AsyncClient, db: AsyncSession, test_tenant: Tenant
):
    """GET /v1/storefront/customers/me returns null affiliate fields for non-affiliates."""
    raw_key = await create_storefront_key(db, test_tenant.id)
    await client.post(
        "/v1/storefront/customers/register",
        json={
            "email": "regular@example.com",
            "password": "Password123",
            "first_name": "Regular",
            "last_name": "User",
        },
        headers={"X-API-Key": raw_key},
    )
    login_resp = await client.post(
        "/v1/storefront/customers/login",
        json={"email": "regular@example.com", "password": "Password123"},
        headers={"X-API-Key": raw_key},
    )
    token = login_resp.json()["access_token"]

    resp = await client.get(
        "/v1/storefront/customers/me",
        headers={"X-API-Key": raw_key, "Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["affiliate_code"] is None
    assert data["commission_rate"] is None
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker compose exec crm-api pytest tests/test_storefront_customers.py -k "affiliate_fields" -v`
Expected: FAIL — response missing affiliate fields

- [ ] **Step 3: Update the customer profile schema**

In `apps/crm-api/app/schemas/storefront/v1/customers.py`, update `StorefrontCustomerProfile`:

```python
class StorefrontCustomerProfile(BaseModel):
    id: uuid.UUID
    email: str
    first_name: str | None
    last_name: str | None
    phone: str | None
    created_at: datetime
    # Affiliate fields
    affiliate_code: str | None = None
    affiliate_link_slug: str | None = None
    commission_rate: float | None = None
    affiliate_status: str | None = None
    model_config = {"from_attributes": True}
```

- [ ] **Step 4: Update _build_profile to include affiliate fields**

In `apps/crm-api/app/routers/storefront/v1/customers.py`, update `_build_profile`:

```python
def _build_profile(user: User) -> StorefrontCustomerProfile:
    """Build a customer profile response from a User model."""
    parts = (user.name or "").split(" ", 1)
    first_name = parts[0] if parts else ""
    last_name = parts[1] if len(parts) > 1 else ""
    return StorefrontCustomerProfile(
        id=user.id,
        email=user.email,
        first_name=first_name,
        last_name=last_name,
        phone=user.phone,
        created_at=user.created_at,
        affiliate_code=user.affiliate_code,
        affiliate_link_slug=user.affiliate_link_slug,
        commission_rate=float(user.commission_rate) if user.commission_rate is not None else None,
        affiliate_status=user.affiliate_status if user.affiliate_code else None,
    )
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `docker compose exec crm-api pytest tests/test_storefront_customers.py -k "affiliate_fields" -v`
Expected: 2 passed

- [ ] **Step 6: Run all storefront customer tests**

Run: `docker compose exec crm-api pytest tests/test_storefront_customers.py -v`
Expected: All passed

- [ ] **Step 7: Commit**

```bash
git add apps/crm-api/app/schemas/storefront/v1/customers.py apps/crm-api/app/routers/storefront/v1/customers.py apps/crm-api/tests/test_storefront_customers.py
git commit -m "feat(storefront): include affiliate fields in customer profile"
```

---

### Task 5: Storefront Customer Commissions Endpoint

**Files:**
- Modify: `apps/crm-api/app/routers/storefront/v1/customers.py`
- Modify: `apps/crm-api/tests/test_storefront_customers.py`

- [ ] **Step 1: Write the failing tests**

Add to `apps/crm-api/tests/test_storefront_customers.py`:

```python
@pytest.mark.asyncio
async def test_get_commissions_returns_list(
    client: AsyncClient, db: AsyncSession, test_tenant: Tenant
):
    """GET /v1/storefront/customers/commissions returns commission history."""
    raw_key = await create_storefront_key(db, test_tenant.id)
    # Register, login, set as affiliate
    await client.post(
        "/v1/storefront/customers/register",
        json={
            "email": "commissions@example.com",
            "password": "Password123",
            "first_name": "Commission",
            "last_name": "User",
        },
        headers={"X-API-Key": raw_key},
    )
    login_resp = await client.post(
        "/v1/storefront/customers/login",
        json={"email": "commissions@example.com", "password": "Password123"},
        headers={"X-API-Key": raw_key},
    )
    token = login_resp.json()["access_token"]

    resp = await client.get(
        "/v1/storefront/customers/commissions",
        headers={"X-API-Key": raw_key, "Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_get_commissions_requires_auth(
    client: AsyncClient, db: AsyncSession, test_tenant: Tenant
):
    """GET /v1/storefront/customers/commissions without JWT returns 401."""
    raw_key = await create_storefront_key(db, test_tenant.id)
    resp = await client.get(
        "/v1/storefront/customers/commissions",
        headers={"X-API-Key": raw_key},
    )
    assert resp.status_code == 401
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker compose exec crm-api pytest tests/test_storefront_customers.py -k "commissions" -v`
Expected: FAIL — route not found

- [ ] **Step 3: Implement the commissions endpoint**

Add to `apps/crm-api/app/routers/storefront/v1/customers.py`:

```python
from app.models.affiliate import Commission
from app.schemas.affiliate import CommissionResponse


@router.get("/commissions")
async def get_customer_commissions(
    customer: Annotated[User, Depends(require_storefront_customer)],
    db: Annotated[AsyncSession, Depends(get_db)],
    status: str | None = None,
    limit: int = Query(default=25, le=100),
    offset: int = Query(default=0, ge=0),
):
    """List commissions for the authenticated customer."""
    query = (
        select(Commission)
        .where(Commission.affiliate_id == customer.id)
        .order_by(Commission.created_at.desc())
    )
    if status:
        query = query.where(Commission.status == status)

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    commissions = result.scalars().all()

    return {
        "items": [CommissionResponse.model_validate(c) for c in commissions],
    }
```

Add `Query` to FastAPI imports at the top of the file.

- [ ] **Step 4: Run tests to verify they pass**

Run: `docker compose exec crm-api pytest tests/test_storefront_customers.py -k "commissions" -v`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add apps/crm-api/app/routers/storefront/v1/customers.py apps/crm-api/tests/test_storefront_customers.py
git commit -m "feat(storefront): add customer commissions endpoint"
```

---

### Task 6: Storefront Customer Payouts Endpoint

**Files:**
- Modify: `apps/crm-api/app/routers/storefront/v1/customers.py`
- Modify: `apps/crm-api/tests/test_storefront_customers.py`

- [ ] **Step 1: Write the failing tests**

Add to `apps/crm-api/tests/test_storefront_customers.py`:

```python
@pytest.mark.asyncio
async def test_get_payouts_returns_list(
    client: AsyncClient, db: AsyncSession, test_tenant: Tenant
):
    """GET /v1/storefront/customers/payouts returns payout history."""
    raw_key = await create_storefront_key(db, test_tenant.id)
    await client.post(
        "/v1/storefront/customers/register",
        json={
            "email": "payouts@example.com",
            "password": "Password123",
            "first_name": "Payout",
            "last_name": "User",
        },
        headers={"X-API-Key": raw_key},
    )
    login_resp = await client.post(
        "/v1/storefront/customers/login",
        json={"email": "payouts@example.com", "password": "Password123"},
        headers={"X-API-Key": raw_key},
    )
    token = login_resp.json()["access_token"]

    resp = await client.get(
        "/v1/storefront/customers/payouts",
        headers={"X-API-Key": raw_key, "Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_get_payouts_requires_auth(
    client: AsyncClient, db: AsyncSession, test_tenant: Tenant
):
    """GET /v1/storefront/customers/payouts without JWT returns 401."""
    raw_key = await create_storefront_key(db, test_tenant.id)
    resp = await client.get(
        "/v1/storefront/customers/payouts",
        headers={"X-API-Key": raw_key},
    )
    assert resp.status_code == 401
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker compose exec crm-api pytest tests/test_storefront_customers.py -k "payouts" -v`
Expected: FAIL — route not found

- [ ] **Step 3: Implement the payouts endpoint**

Add to `apps/crm-api/app/routers/storefront/v1/customers.py`:

```python
from app.models.affiliate import Commission, Payout
from app.schemas.affiliate import CommissionResponse, PayoutResponse


@router.get("/payouts")
async def get_customer_payouts(
    customer: Annotated[User, Depends(require_storefront_customer)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=25, le=100),
    offset: int = Query(default=0, ge=0),
):
    """List payouts for the authenticated customer."""
    query = (
        select(Payout)
        .where(Payout.affiliate_id == customer.id)
        .order_by(Payout.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    payouts = result.scalars().all()

    return {
        "items": [PayoutResponse.model_validate(p) for p in payouts],
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `docker compose exec crm-api pytest tests/test_storefront_customers.py -k "payouts" -v`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add apps/crm-api/app/routers/storefront/v1/customers.py apps/crm-api/tests/test_storefront_customers.py
git commit -m "feat(storefront): add customer payouts endpoint"
```

---

### Task 7: Add payment_method and payment_reference to Checkout Schema

**Files:**
- Modify: `apps/crm-api/app/schemas/storefront/v1/checkout.py`
- Modify: `apps/crm-api/app/routers/storefront/v1/checkout.py`
- Modify: `apps/crm-api/tests/test_storefront_checkout.py`

- [ ] **Step 1: Write the failing test**

Add to `apps/crm-api/tests/test_storefront_checkout.py`:

```python
@pytest.mark.asyncio
async def test_checkout_accepts_payment_fields(
    client: AsyncClient, db: AsyncSession, test_tenant: Tenant
):
    """POST /v1/storefront/checkout accepts payment_method and payment_reference."""
    raw_key = await create_storefront_key(db, test_tenant.id)
    product = await create_product_with_price(db, test_tenant.id, slug="pay-test", price=49.99)
    session_id = "payment-test-session"

    # Add item to cart
    await client.post(
        "/v1/storefront/cart/items",
        json={"product_id": str(product.id), "quantity": 1},
        headers={"X-API-Key": raw_key, "X-Session-ID": session_id},
    )

    # Checkout with payment fields
    resp = await client.post(
        "/v1/storefront/checkout",
        json={
            "session_token": session_id,
            "customer_email": "payment@example.com",
            "shipping_address": {"line1": "123 Main St", "city": "Austin", "state": "TX", "zip": "78701"},
            "payment_method": "zelle",
            "payment_reference": "zelle-txn-12345",
        },
        headers={"X-API-Key": raw_key},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["id"] is not None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker compose exec crm-api pytest tests/test_storefront_checkout.py -k "payment_fields" -v`
Expected: FAIL — validation error on unknown fields or fields not persisted

- [ ] **Step 3: Update checkout schema**

In `apps/crm-api/app/schemas/storefront/v1/checkout.py`, update `StorefrontCreateOrderRequest`:

```python
class StorefrontCreateOrderRequest(BaseModel):
    session_token: str
    customer_email: EmailStr | None = None
    shipping_address: dict | None = None
    billing_address: dict | None = None
    notes: str | None = None
    payment_method: str | None = None
    payment_reference: str | None = None
```

- [ ] **Step 4: Update checkout router to persist payment fields**

In `apps/crm-api/app/routers/storefront/v1/checkout.py`, find where the Order is created and add:

```python
order.payment_method = body.payment_method
order.payment_reference = body.payment_reference
```

(The exact location depends on the existing code — look for where `Order(...)` is constructed or where fields are assigned before `db.flush()`.)

- [ ] **Step 5: Run test to verify it passes**

Run: `docker compose exec crm-api pytest tests/test_storefront_checkout.py -k "payment_fields" -v`
Expected: PASS

- [ ] **Step 6: Run all checkout tests**

Run: `docker compose exec crm-api pytest tests/test_storefront_checkout.py -v`
Expected: All passed

- [ ] **Step 7: Commit**

```bash
git add apps/crm-api/app/schemas/storefront/v1/checkout.py apps/crm-api/app/routers/storefront/v1/checkout.py apps/crm-api/tests/test_storefront_checkout.py
git commit -m "feat(storefront): add payment_method and payment_reference to checkout"
```

---

### Task 8: Update Storefront SDK — New Methods and Types

**Files:**
- Modify: `packages/storefront-sdk/src/types.ts`
- Modify: `packages/storefront-sdk/src/index.ts`

- [ ] **Step 1: Add new types**

Add to `packages/storefront-sdk/src/types.ts`:

```typescript
// Branding
export interface StorefrontBranding {
  store_name: string | null;
  tagline: string | null;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  mode: string | null;
  social_links: Record<string, string> | null;
  footer_text: string | null;
}

// Commission (reuse for storefront context)
export interface StorefrontCommission {
  id: string;
  affiliate_id: string;
  order_id: string;
  amount: number;
  rate: number;
  type: string;
  status: string;
  hold_until: string | null;
  approved_at: string | null;
  created_at: string;
}

// Payout
export interface StorefrontPayout {
  id: string;
  affiliate_id: string;
  amount: number;
  method: string;
  status: string;
  reference: string | null;
  sent_at: string | null;
  created_at: string;
}
```

- [ ] **Step 2: Update StorefrontCustomerProfile type**

In `packages/storefront-sdk/src/types.ts`, update `StorefrontCustomerProfile`:

```typescript
export interface StorefrontCustomerProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  // Affiliate fields
  affiliate_code: string | null;
  affiliate_link_slug: string | null;
  commission_rate: number | null;
  affiliate_status: string | null;
}
```

- [ ] **Step 3: Update CheckoutCreateParams type**

In `packages/storefront-sdk/src/types.ts` or `src/index.ts` (wherever `CheckoutCreateParams` is defined):

```typescript
export interface CheckoutCreateParams {
  sessionToken: string;
  customerEmail?: string;
  shippingAddress?: Record<string, unknown>;
  billingAddress?: Record<string, unknown>;
  notes?: string;
  paymentMethod?: string;
  paymentReference?: string;
}
```

- [ ] **Step 4: Add BrandingResource class**

Add to `packages/storefront-sdk/src/index.ts`:

```typescript
class BrandingResource {
  constructor(private client: HttpClient) {}

  async get(): Promise<StorefrontBranding> {
    return this.client.request<StorefrontBranding>("GET", "/branding");
  }
}
```

- [ ] **Step 5: Add methods to CustomersResource**

In `packages/storefront-sdk/src/index.ts`, add to `CustomersResource`:

```typescript
class CustomersResource {
  // ... existing methods ...

  async forgotPassword(params: { email: string }): Promise<{ ok: boolean }> {
    return this.client.request("POST", "/customers/forgot-password", {
      body: params,
    });
  }

  async resetPassword(params: { token: string; newPassword: string }): Promise<{ ok: boolean }> {
    return this.client.request("POST", "/customers/reset-password", {
      body: { token: params.token, new_password: params.newPassword },
    });
  }

  async verifyEmail(params: { token: string }): Promise<{ ok: boolean }> {
    return this.client.request("POST", "/customers/verify-email", {
      body: params,
    });
  }

  async commissions(params: {
    customerToken: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: StorefrontCommission[] }> {
    return this.client.request("GET", "/customers/commissions", {
      headers: { Authorization: `Bearer ${params.customerToken}` },
      query: { status: params.status, limit: params.limit, offset: params.offset },
    });
  }

  async payouts(params: {
    customerToken: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: StorefrontPayout[] }> {
    return this.client.request("GET", "/customers/payouts", {
      headers: { Authorization: `Bearer ${params.customerToken}` },
      query: { limit: params.limit, offset: params.offset },
    });
  }
}
```

- [ ] **Step 6: Add branding to StadianClient**

In the `StadianClient` constructor:

```typescript
export class StadianClient {
  public readonly catalog: CatalogResource;
  public readonly cart: CartResource;
  public readonly checkout: CheckoutResource;
  public readonly orders: OrdersResource;
  public readonly intake: IntakeResource;
  public readonly customers: CustomersResource;
  public readonly webhooks: WebhooksResource;
  public readonly branding: BrandingResource;

  constructor(config: StadianClientConfig) {
    const client = new HttpClient(config);
    this.catalog = new CatalogResource(client);
    this.cart = new CartResource(client);
    this.checkout = new CheckoutResource(client);
    this.orders = new OrdersResource(client);
    this.intake = new IntakeResource(client);
    this.customers = new CustomersResource(client);
    this.webhooks = new WebhooksResource(client);
    this.branding = new BrandingResource(client);
  }
}
```

- [ ] **Step 7: Update checkout resource to pass payment fields**

In `CheckoutResource.create()`, update the body to include payment fields:

```typescript
class CheckoutResource {
  async create(params: CheckoutCreateParams): Promise<StorefrontOrder> {
    return this.client.request<StorefrontOrder>("POST", "/checkout", {
      body: {
        session_token: params.sessionToken,
        customer_email: params.customerEmail,
        shipping_address: params.shippingAddress,
        billing_address: params.billingAddress,
        notes: params.notes,
        payment_method: params.paymentMethod,
        payment_reference: params.paymentReference,
      },
    });
  }
}
```

- [ ] **Step 8: Export new types**

Ensure `StorefrontBranding`, `StorefrontCommission`, `StorefrontPayout` are exported from the package entry point.

- [ ] **Step 9: Build the SDK to verify no TypeScript errors**

Run: `cd packages/storefront-sdk && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 10: Commit**

```bash
git add packages/storefront-sdk/
git commit -m "feat(sdk): add branding, affiliate, and auth recovery methods to storefront SDK"
```

---

### Task 9: Expand CRM Dashboard Branding Settings

**Files:**
- Modify: `apps/crm-dashboard/src/pages/settings/BrandingSettingsPage.tsx`

- [ ] **Step 1: Read the current branding settings page**

Run: Read `apps/crm-dashboard/src/pages/settings/BrandingSettingsPage.tsx` to understand the full current implementation.

- [ ] **Step 2: Add storefront branding fields**

The existing page has `business_name`, `from_email`, and `logo_url`. Add the new storefront fields to the same page:

```tsx
// Add state for new fields (alongside existing ones)
const [tagline, setTagline] = useState(branding.tagline || "");
const [primaryColor, setPrimaryColor] = useState(branding.primary_color || "#2563eb");
const [accentColor, setAccentColor] = useState(branding.accent_color || "#10b981");
const [mode, setMode] = useState(branding.mode || "light");
const [footerText, setFooterText] = useState(branding.footer_text || "");
const [socialInstagram, setSocialInstagram] = useState(branding.social_links?.instagram || "");
const [socialTwitter, setSocialTwitter] = useState(branding.social_links?.twitter || "");
const [socialFacebook, setSocialFacebook] = useState(branding.social_links?.facebook || "");
```

Add a "Storefront" section below the existing branding fields:

```tsx
{/* Storefront Branding Section */}
<div className="border-t pt-6 mt-6">
  <h2 className="text-lg font-semibold mb-4">Storefront</h2>
  <p className="text-sm text-muted-foreground mb-4">
    These settings are used by your storefront template when branding is fetched from the API.
  </p>

  {/* Tagline */}
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1">Tagline</label>
    <input
      type="text"
      value={tagline}
      onChange={(e) => setTagline(e.target.value)}
      placeholder="Research-grade peptides"
      className="w-full rounded-md border px-3 py-2 text-sm"
    />
  </div>

  {/* Primary Color */}
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1">Primary Color</label>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={primaryColor}
        onChange={(e) => setPrimaryColor(e.target.value)}
        className="h-9 w-9 rounded border cursor-pointer"
      />
      <input
        type="text"
        value={primaryColor}
        onChange={(e) => setPrimaryColor(e.target.value)}
        className="w-28 rounded-md border px-3 py-2 text-sm font-mono"
      />
    </div>
  </div>

  {/* Accent Color */}
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1">Accent Color</label>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={accentColor}
        onChange={(e) => setAccentColor(e.target.value)}
        className="h-9 w-9 rounded border cursor-pointer"
      />
      <input
        type="text"
        value={accentColor}
        onChange={(e) => setAccentColor(e.target.value)}
        className="w-28 rounded-md border px-3 py-2 text-sm font-mono"
      />
    </div>
  </div>

  {/* Mode */}
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1">Default Mode</label>
    <select
      value={mode}
      onChange={(e) => setMode(e.target.value)}
      className="w-full rounded-md border px-3 py-2 text-sm"
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </div>

  {/* Footer Text */}
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1">Footer Text</label>
    <input
      type="text"
      value={footerText}
      onChange={(e) => setFooterText(e.target.value)}
      placeholder="© 2026 Your Company"
      className="w-full rounded-md border px-3 py-2 text-sm"
    />
  </div>

  {/* Social Links */}
  <h3 className="text-sm font-semibold mb-2 mt-6">Social Links</h3>
  <div className="space-y-3">
    <div>
      <label className="block text-sm font-medium mb-1">Instagram</label>
      <input
        type="url"
        value={socialInstagram}
        onChange={(e) => setSocialInstagram(e.target.value)}
        placeholder="https://instagram.com/yourstore"
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">Twitter / X</label>
      <input
        type="url"
        value={socialTwitter}
        onChange={(e) => setSocialTwitter(e.target.value)}
        placeholder="https://x.com/yourstore"
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">Facebook</label>
      <input
        type="url"
        value={socialFacebook}
        onChange={(e) => setSocialFacebook(e.target.value)}
        placeholder="https://facebook.com/yourstore"
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
    </div>
  </div>
</div>
```

- [ ] **Step 3: Update the save handler to include new fields**

```tsx
const handleSave = () => {
  save({
    branding: {
      business_name: businessName,
      from_email: fromEmail,
      logo_url: logoUrl,
      tagline,
      primary_color: primaryColor,
      accent_color: accentColor,
      mode,
      footer_text: footerText,
      social_links: {
        instagram: socialInstagram || undefined,
        twitter: socialTwitter || undefined,
        facebook: socialFacebook || undefined,
      },
    },
  });
};
```

- [ ] **Step 4: Verify the page renders**

Run: `docker compose exec crm-dashboard npm run build` (or check in browser if dev server is running)
Expected: No build errors

- [ ] **Step 5: Commit**

```bash
git add apps/crm-dashboard/src/pages/settings/BrandingSettingsPage.tsx
git commit -m "feat(dashboard): expand branding settings with storefront fields"
```

---

### Task 10: Run Full Test Suite

**Files:** None (verification only)

- [ ] **Step 1: Run all storefront tests**

Run: `docker compose exec crm-api pytest tests/test_storefront_branding.py tests/test_storefront_customers.py tests/test_storefront_checkout.py tests/test_storefront_cart.py tests/test_storefront_catalog.py tests/test_storefront_webhooks.py -v`
Expected: All passed

- [ ] **Step 2: Run full test suite to check for regressions**

Run: `docker compose exec crm-api pytest --tb=short -q`
Expected: All passed, no regressions

- [ ] **Step 3: Build SDK**

Run: `cd packages/storefront-sdk && npm run build`
Expected: Build succeeds

- [ ] **Step 4: Build CRM dashboard**

Run: `docker compose exec crm-dashboard npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit any remaining changes and tag**

```bash
git add -A
git status  # verify only expected files
git commit -m "chore: verify all storefront platform changes pass"
```
