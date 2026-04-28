"""
Generate a lifetime API token for Zoho Desk integration.

Usage:
    python generate_zoho_token.py

This will:
1. Create the api_tokens table if it doesn't exist
2. Find or create a service user for Zoho integration
3. Generate a long-lived API token
4. Print the token (save it — it cannot be retrieved again)
"""

import secrets
import sys
from app.database import engine, SessionLocal, Base
from app.models.models import User, ApiToken, StatusEnum
from app.auth import hash_api_token, hash_password


def generate_token():
    # Ensure api_tokens table exists
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Look for an existing CDD / Zoho service user, or prompt to pick one
        print("\n=== Oliva Helpdesk — Zoho API Token Generator ===\n")

        # List CDD users who could be the service account
        cdd_users = db.query(User).filter(
            User.status == StatusEnum.Active,
        ).all()

        # Try to find an existing Zoho service user
        zoho_user = None
        for u in cdd_users:
            if "zoho" in (u.name or "").lower() or "zoho" in (u.email or "").lower():
                zoho_user = u
                break

        if zoho_user:
            print(f"Found existing Zoho service user: {zoho_user.name} ({zoho_user.email}) [ID: {zoho_user.id}]")
        else:
            print("No Zoho service user found. Creating one...\n")

            # Create a dedicated service user for Zoho integration
            # Find max code
            all_codes = db.query(User.code).all()
            max_num = 0
            for (code,) in all_codes:
                try:
                    num = int(code.replace("USR", "").replace("usr", ""))
                    if num > max_num:
                        max_num = num
                except (ValueError, AttributeError):
                    continue

            zoho_user = User(
                code=f"USR{(max_num + 1):04d}",
                name="Zoho Desk Integration",
                email="zoho-integration@olivaclinic.com",
                password_hash=hash_password(secrets.token_urlsafe(32)),  # random password, not used
                role="API Integration",
                status=StatusEnum.Active,
            )
            db.add(zoho_user)
            db.commit()
            db.refresh(zoho_user)
            print(f"Created service user: {zoho_user.name} ({zoho_user.email}) [ID: {zoho_user.id}]")

        # Deactivate any existing tokens for this user
        existing_tokens = db.query(ApiToken).filter(
            ApiToken.user_id == zoho_user.id,
            ApiToken.is_active == True,
        ).all()
        if existing_tokens:
            print(f"\nDeactivating {len(existing_tokens)} existing token(s)...")
            for t in existing_tokens:
                t.is_active = False
            db.commit()

        # Generate new token
        raw_token = f"oliva_{secrets.token_urlsafe(48)}"
        token_hash = hash_api_token(raw_token)

        api_token = ApiToken(
            name="Zoho Desk Integration",
            token_hash=token_hash,
            user_id=zoho_user.id,
            is_active=True,
        )
        db.add(api_token)
        db.commit()

        print("\n" + "=" * 60)
        print("  YOUR ZOHO API TOKEN (save this — shown only once!):")
        print("=" * 60)
        print(f"\n  {raw_token}\n")
        print("=" * 60)
        print(f"\n  Linked to user: {zoho_user.name} (ID: {zoho_user.id})")
        print(f"  Token name: Zoho Desk Integration")
        print(f"  Expires: NEVER (lifetime token)")
        print()
        print("  Usage in Zoho Desk HTTP requests:")
        print("  ─────────────────────────────────")
        print("  Header:  Authorization: Bearer <token>")
        print()
        print("  Endpoints:")
        print("  POST   https://clinicdesk.olivaclinic.com/api/zoho/tickets       — Create ticket")
        print("  PATCH  https://clinicdesk.olivaclinic.com/api/zoho/tickets/{id}   — Update ticket")
        print("  GET    https://clinicdesk.olivaclinic.com/api/zoho/tickets/{id}   — Get ticket")
        print("  GET    https://clinicdesk.olivaclinic.com/api/zoho/tickets/by-code/{code} — Get by code")
        print("  GET    https://clinicdesk.olivaclinic.com/api/zoho/health         — Health check")
        print()

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    generate_token()
