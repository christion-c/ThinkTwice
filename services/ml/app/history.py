"""Per-user fill-up history: durable storage via the backend, with a local
file as a same-instance fallback.

Two sources, tried in order:

1. The backend's Postgres-backed `/fill-up-history/internal` endpoint —
   durable across restarts and shared across every ML service instance.
   Requires INTERNAL_SERVICE_TOKEN, since that endpoint is otherwise
   unauthenticated internal-only traffic (see the backend's
   require-internal-service middleware).
2. A local JSON file — used only if the backend call fails (network
   issue, backend down, etc). This is NOT durable in production: Cloud
   Run containers are ephemeral and can be replaced or scaled to
   multiple instances at any time, each with its own filesystem, so this
   fallback should be understood as "best effort for this one request,"
   not a real data store. It's mainly useful for local development,
   where docker compose gives the ML service a persistent volume and
   there's normally just one instance.
"""

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:3000").rstrip("/")
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN", "")

DEFAULT_HISTORY_PATH = Path(
    os.getenv("ML_HISTORY_PATH",
              "/home/appuser/.cache/thinktwice/user_history.json")
)


def resolve_history_path() -> Path:
    """Picks the local fallback-cache file location, creating it if needed.

    Falls back to /tmp if the preferred path isn't writable (e.g. a
    read-only filesystem or missing volume mount) so the service can still
    start rather than crash on an unwritable cache path.
    """
    history_path = DEFAULT_HISTORY_PATH
    try:
        history_path.parent.mkdir(parents=True, exist_ok=True)
        history_path.touch(exist_ok=True)
        history_path.write_text(
            "{}", encoding="utf-8") if not history_path.exists() else None
        return history_path
    except OSError:
        fallback_path = Path("/tmp/user_history.json")
        fallback_path.parent.mkdir(parents=True, exist_ok=True)
        fallback_path.touch(exist_ok=True)
        return fallback_path


HISTORY_PATH = resolve_history_path()


def load_user_history(user_id: str | None = None) -> list[dict[str, Any]]:
    """Returns a user's fill-up history, preferring the durable backend."""
    if user_id:
        try:
            encoded = urllib.parse.quote(user_id, safe="")
            url = f"{BACKEND_URL}/fill-up-history/internal?firebase_uid={encoded}"
            request = urllib.request.Request(
                url, headers={"X-Internal-Token": INTERNAL_SERVICE_TOKEN}
            )
            with urllib.request.urlopen(request, timeout=3) as resp:  # noqa: S310
                payload = json.loads(resp.read().decode("utf-8"))
            entries = payload.get("entries", [])
            if isinstance(entries, list):
                return [
                    {
                        "miles_driven": e.get("milesDriven", 0),
                        "fuel_price": e.get("fuelPrice", 0),
                        "combined_mpg": e.get("combinedMpg", 0),
                        "tank_capacity": e.get("tankCapacity", 0),
                        "gallons": e.get("gallons", 0),
                        "observed_cost": e.get("observedCost", 0),
                    }
                    for e in entries
                    if isinstance(e, dict)
                ]
        except Exception:  # noqa: BLE001
            pass  # Fall through to the local file cache below.

    if not HISTORY_PATH.exists():
        return []

    try:
        payload = json.loads(HISTORY_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []

    if not isinstance(payload, dict):
        return []

    if user_id is None:
        entries: list[dict[str, Any]] = []
        for value in payload.values():
            if isinstance(value, list):
                entries.extend(
                    [item for item in value if isinstance(item, dict)])
        return entries

    value = payload.get(user_id)
    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]

    return []


def save_user_history(payload: dict[str, Any]) -> dict[str, Any]:
    """Appends one fill-up entry to the local fallback cache, keyed by user_id.

    This only writes the local file — it does not also write through to
    the backend. The real, durable write path for a fill-up is the
    frontend calling the backend's POST /fill-up-history directly (see
    lib/backend-api.ts's saveFillUpHistory); this function backs the ML
    service's own /fill-up-history endpoint, used by the /ml-preview debug
    flow specifically.
    """
    user_id = payload.get("user_id")
    if not isinstance(user_id, str) or not user_id.strip():
        return {"ok": False, "error": "missing user_id"}

    existing_payload: dict[str, Any] = {}
    if HISTORY_PATH.exists():
        try:
            parsed = json.loads(HISTORY_PATH.read_text(encoding="utf-8"))
            if isinstance(parsed, dict):
                existing_payload = parsed
        except json.JSONDecodeError:
            existing_payload = {}

    try:
        HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
        HISTORY_PATH.touch(exist_ok=True)
    except OSError:
        pass

    entries = existing_payload.get(user_id, [])
    if not isinstance(entries, list):
        entries = []

    entry = {key: value for key, value in payload.items() if key != "user_id"}
    entries.append(entry)
    existing_payload[user_id] = entries
    try:
        HISTORY_PATH.write_text(json.dumps(
            existing_payload, indent=2), encoding="utf-8")
    except OSError as exc:
        return {"ok": False, "error": f"history_write_failed: {exc}"}
    return {"ok": True, "saved": len(entries)}
