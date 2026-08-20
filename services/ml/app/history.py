# Per-user fill-up history: durable storage via the backend, with a
# local file as a same-instance fallback.
#
# Two sources, tried in order:
#   1. The backend's Postgres-backed `/fill-up-history/internal`
#      endpoint - durable across restarts and shared across every ML
#      service instance. Requires INTERNAL_SERVICE_TOKEN, since that
#      endpoint is otherwise unauthenticated internal-only traffic
#      (see the backend's require-internal-service middleware).
#   2. A local JSON file - used only if the backend call fails
#      (network issue, backend down, etc). This is NOT durable in
#      production: Cloud Run containers are ephemeral and can be
#      replaced or scaled to multiple instances at any time, each with
#      its own filesystem, so this fallback should be understood as
#      "best effort for this one request," not a real data store. It's
#      mainly useful for local development, where docker compose gives
#      the ML service a persistent volume and there's normally just one instance.

import http.client
import json
import os
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

from .json_store import read_json

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:3000").rstrip("/")
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN", "")

DEFAULT_HISTORY_PATH = Path(
    os.getenv("ML_HISTORY_PATH",
              "/home/appuser/.cache/thinktwice/user_history.json")
)


def _ensure_file(path: Path) -> None:
    # Shared "make sure this cache file's directory and file both
    # exist" step, used by resolve_history_path (both the preferred
    # path and its /tmp fallback) and save_user_history.
    path.parent.mkdir(parents=True, exist_ok=True)
    path.touch(exist_ok=True)


def resolve_history_path() -> Path:
    # Picks the local fallback-cache file location, creating it if needed.
    history_path = DEFAULT_HISTORY_PATH
    try:
        _ensure_file(history_path)
        history_path.write_text(
            "{}", encoding="utf-8") if not history_path.exists() else None
        return history_path
    except OSError:
        # Preferred path isn't writable (e.g. a read-only filesystem or
        # missing volume mount) - fall back to /tmp so the service can
        # still start rather than crash on an unwritable cache path.
        fallback_path = Path("/tmp/user_history.json")
        _ensure_file(fallback_path)
        return fallback_path


HISTORY_PATH = resolve_history_path()


def _fetch_backend_history(user_id: str) -> list[dict[str, Any]] | None:
    # Asks the backend's internal-only endpoint for this user's history.
    # Returns None (rather than []) when the call failed or returned
    # something unusable, so the caller knows to fall back to the local
    # cache instead of treating "no data" as "zero entries."
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
            # Convert the backend's camelCase field names to this
            # service's snake_case convention.
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
    except (OSError, ValueError, AttributeError, http.client.HTTPException):
        # OSError covers urllib.error.URLError/HTTPError and socket
        # timeouts (TimeoutError is an OSError subclass) - i.e. the
        # backend being unreachable or slow. ValueError covers
        # json.JSONDecodeError (a malformed response body) as well as a
        # malformed BACKEND_URL. AttributeError covers a response body
        # that parses as JSON but isn't a dict (e.g. `payload.get(...)`
        # on a JSON array or string). http.client.HTTPException covers a
        # malformed/truncated response (e.g. IncompleteRead,
        # BadStatusLine), which isn't an OSError or ValueError subclass.
        # Any other exception is a real bug and should surface rather
        # than be swallowed here.
        pass

    return None


def _load_local_history(user_id: str | None) -> list[dict[str, Any]]:
    # Reads the local fallback cache and flattens/filters it for the
    # requested user (or every user, if user_id is None).
    payload = read_json(HISTORY_PATH, default=None)
    if not isinstance(payload, dict):
        return []

    # No user_id means "everyone" - flatten every user's entries together.
    if user_id is None:
        entries: list[dict[str, Any]] = []
        for value in payload.values():
            if isinstance(value, list):
                entries.extend(
                    [item for item in value if isinstance(item, dict)])
        return entries

    # Otherwise return just this user's entries.
    value = payload.get(user_id)
    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]

    return []


def load_user_history(user_id: str | None = None) -> list[dict[str, Any]]:
    # Returns a user's fill-up history, preferring the durable backend.
    if user_id:
        remote = _fetch_backend_history(user_id)
        if remote is not None:
            return remote

    # Backend call failed, was skipped (no user_id), or returned nothing usable.
    return _load_local_history(user_id)


def save_user_history(payload: dict[str, Any]) -> dict[str, Any]:
    # Appends one fill-up entry to the local fallback cache, keyed by
    # user_id. This only writes the local file - it does not also
    # write through to the backend. The real, durable write path for a
    # fill-up is the frontend calling the backend's POST
    # /fill-up-history directly (see lib/backend-api.ts's
    # saveFillUpHistory); this function backs the ML service's own
    # /fill-up-history endpoint, used by the /ml-preview debug flow specifically.
    user_id = payload.get("user_id")
    if not isinstance(user_id, str) or not user_id.strip():
        return {"ok": False, "error": "missing user_id"}

    # Load whatever's already cached, if anything.
    parsed = read_json(HISTORY_PATH, default={})
    existing_payload: dict[str, Any] = parsed if isinstance(
        parsed, dict) else {}

    try:
        _ensure_file(HISTORY_PATH)
    except OSError:
        pass

    # Append this entry to the user's existing list (or start a new one).
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
