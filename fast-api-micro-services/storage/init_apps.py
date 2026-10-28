import uuid
import bcrypt
from sqlalchemy.orm import Session

from database import SessionLocal
from api_clients import ApiClient


api_clients = {
    "tqydTkXa9rWCYD9McS3O5tT9CMZpA0Pr": "UZwoRdTktrXG6kygiC0d7otO624gZtvy"
}


def register_api_clients(
    db: Session,
    clients: dict[str, str],
):
    print("Running init app")

    created_clients = []

    for api_key, api_secret in clients.items():

        existing = (
            db.query(ApiClient)
            .filter(ApiClient.api_key == api_key)
            .first()
        )

        if existing:
            print(f"API key already exists: {existing.api_key}")
            created_clients.append(existing)
            continue

        hashed_secret = bcrypt.hashpw(
            api_secret.encode(),
            bcrypt.gensalt()
        ).decode()

        client = ApiClient(
            id=str(uuid.uuid4()),
            api_key=api_key,
            api_secret_hash=hashed_secret,
        )

        db.add(client)
        db.flush()

        created_clients.append(client)

    db.commit()

    print("Saved API clients:")
    for client in created_clients:
        print({
            "id": client.id,
            "api_key": client.api_key,
            "is_active": client.is_active,
            "created_at": client.created_at,
        })

    return created_clients


def init_apps():
    db = SessionLocal()

    try:
        clients = register_api_clients(
            db=db,
            clients=api_clients
        )

        print(f"Total API clients: {len(clients)}")

    except Exception as e:
        db.rollback()
        print("Init apps failed:", e)
        raise

    finally:
        db.close()