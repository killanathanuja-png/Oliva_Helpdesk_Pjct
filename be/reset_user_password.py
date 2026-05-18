"""Reset a user's password — run this on whichever server hosts the DB
you want to update. Uses the local .env to determine the target DB.

Usage:
    python3 reset_user_password.py <email> [new_password]

If new_password is omitted, it defaults to 'oliva@123'.
After running, the script prints a verification line so you can confirm
the new password actually matches the hash that was just stored.
"""
import sys
from app.database import SessionLocal
from app.models.models import User
from app.auth import hash_password, verify_password
from app.config import DATABASE_URL


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 reset_user_password.py <email> [new_password]")
        sys.exit(1)
    email = sys.argv[1].strip()
    new_pwd = sys.argv[2] if len(sys.argv) >= 3 else "oliva@123"

    # Show which DB we're targeting so there's no ambiguity
    safe_url = DATABASE_URL
    if "@" in safe_url:
        prefix, rest = safe_url.split("@", 1)
        if ":" in prefix:
            user_part = prefix.rsplit(":", 1)[0]
            safe_url = f"{user_part}:****@{rest}"
    print(f"Target DB: {safe_url}")

    db = SessionLocal()
    try:
        u = db.query(User).filter(User.email == email).first()
        if not u:
            print(f"User not found: {email}")
            sys.exit(2)
        u.hashed_password = hash_password(new_pwd)
        db.commit()
        db.refresh(u)
        ok = verify_password(new_pwd, u.hashed_password)
        print(f"Reset for: {u.name} ({u.email}) role={u.role!r} status={u.status}")
        print(f"  new password : {new_pwd}")
        print(f"  verify match : {ok}")
        if not ok:
            print("WARNING: verification failed — password hash did not match. Something is wrong.")
            sys.exit(3)
    finally:
        db.close()


if __name__ == "__main__":
    main()
