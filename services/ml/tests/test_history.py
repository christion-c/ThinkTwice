import http.client
import json

from app import history as ml_history


class _FakeResponse:
    # Minimal stand-in for the context-manager object
    # urllib.request.urlopen returns, exposing just the .read() the real
    # code calls.
    def __init__(self, body: bytes) -> None:
        self._body = body

    def read(self) -> bytes:
        return self._body

    def __enter__(self) -> "_FakeResponse":
        return self

    def __exit__(self, *exc_info) -> bool:
        return False


def test_ensure_file_creates_parent_dir_and_file(tmp_path):
    target = tmp_path / "nested" / "dir" / "history.json"
    assert not target.parent.exists()

    ml_history._ensure_file(target)

    assert target.exists()
    assert target.parent.is_dir()


def test_resolve_history_path_creates_and_returns_preferred_path(tmp_path, monkeypatch):
    preferred = tmp_path / "nested" / "user_history.json"
    monkeypatch.setattr(ml_history, "DEFAULT_HISTORY_PATH", preferred)

    result = ml_history.resolve_history_path()

    assert result == preferred
    assert preferred.exists()


def test_local_history_round_trips_a_saved_entry(tmp_path, monkeypatch):
    monkeypatch.setattr(ml_history, "HISTORY_PATH", tmp_path / "user_history.json")

    result = ml_history.save_user_history(
        {"user_id": "alice", "miles_driven": 100, "fuel_price": 4.0}
    )

    assert result == {"ok": True, "saved": 1}
    assert ml_history._load_local_history("alice") == [{"miles_driven": 100, "fuel_price": 4.0}]


def test_local_history_flattens_all_users_when_user_id_is_none(tmp_path, monkeypatch):
    monkeypatch.setattr(ml_history, "HISTORY_PATH", tmp_path / "user_history.json")

    ml_history.save_user_history({"user_id": "alice", "miles_driven": 100})
    ml_history.save_user_history({"user_id": "bob", "miles_driven": 200})

    everyone = ml_history._load_local_history(None)

    assert len(everyone) == 2
    assert {"miles_driven": 100} in everyone
    assert {"miles_driven": 200} in everyone


def test_local_history_filters_to_a_single_user(tmp_path, monkeypatch):
    monkeypatch.setattr(ml_history, "HISTORY_PATH", tmp_path / "user_history.json")

    ml_history.save_user_history({"user_id": "alice", "miles_driven": 100})
    ml_history.save_user_history({"user_id": "bob", "miles_driven": 200})

    assert ml_history._load_local_history("alice") == [{"miles_driven": 100}]
    assert ml_history._load_local_history("bob") == [{"miles_driven": 200}]


def test_local_history_returns_a_users_entries_newest_first(tmp_path, monkeypatch):
    # The file stores entries in the order they were saved (oldest
    # first); reads return newest first, matching the backend.
    monkeypatch.setattr(ml_history, "HISTORY_PATH", tmp_path / "user_history.json")

    ml_history.save_user_history({"user_id": "alice", "miles_driven": 100})
    ml_history.save_user_history({"user_id": "alice", "miles_driven": 200})

    assert ml_history._load_local_history("alice") == [
        {"miles_driven": 200},
        {"miles_driven": 100},
    ]


def test_local_history_returns_empty_list_for_unknown_user(tmp_path, monkeypatch):
    monkeypatch.setattr(ml_history, "HISTORY_PATH", tmp_path / "user_history.json")

    ml_history.save_user_history({"user_id": "alice", "miles_driven": 100})

    assert ml_history._load_local_history("nobody") == []


def test_fetch_backend_history_remaps_camel_case_fields(monkeypatch):
    body = json.dumps(
        {
            "entries": [
                {
                    "milesDriven": 120,
                    "fuelPrice": 3.5,
                    "combinedMpg": 28,
                    "tankCapacity": 14,
                    "gallons": 4.3,
                    "observedCost": 15.05,
                }
            ]
        }
    ).encode("utf-8")

    def fake_urlopen(request, timeout=3):
        return _FakeResponse(body)

    monkeypatch.setattr(ml_history.urllib.request, "urlopen", fake_urlopen)

    result = ml_history._fetch_backend_history("alice")

    assert result == [
        {
            "miles_driven": 120,
            "fuel_price": 3.5,
            "combined_mpg": 28,
            "tank_capacity": 14,
            "gallons": 4.3,
            "observed_cost": 15.05,
        }
    ]


def test_fetch_backend_history_ignores_non_dict_entries(monkeypatch):
    body = json.dumps({"entries": [{"milesDriven": 10}, "garbage", 42]}).encode("utf-8")

    def fake_urlopen(request, timeout=3):
        return _FakeResponse(body)

    monkeypatch.setattr(ml_history.urllib.request, "urlopen", fake_urlopen)

    result = ml_history._fetch_backend_history("alice")

    assert result == [
        {
            "miles_driven": 10,
            "fuel_price": 0,
            "combined_mpg": 0,
            "tank_capacity": 0,
            "gallons": 0,
            "observed_cost": 0,
        }
    ]


def test_fetch_backend_history_returns_none_on_os_error(monkeypatch):
    def fake_urlopen(request, timeout=3):
        raise OSError("connection refused")

    monkeypatch.setattr(ml_history.urllib.request, "urlopen", fake_urlopen)

    assert ml_history._fetch_backend_history("alice") is None


def test_fetch_backend_history_returns_none_on_malformed_json(monkeypatch):
    def fake_urlopen(request, timeout=3):
        return _FakeResponse(b"not valid json")

    monkeypatch.setattr(ml_history.urllib.request, "urlopen", fake_urlopen)

    assert ml_history._fetch_backend_history("alice") is None


def test_fetch_backend_history_returns_none_when_payload_is_not_a_dict(monkeypatch):
    def fake_urlopen(request, timeout=3):
        return _FakeResponse(json.dumps([1, 2, 3]).encode("utf-8"))

    monkeypatch.setattr(ml_history.urllib.request, "urlopen", fake_urlopen)

    assert ml_history._fetch_backend_history("alice") is None


def test_fetch_backend_history_returns_none_on_http_exception(monkeypatch):
    def fake_urlopen(request, timeout=3):
        raise http.client.BadStatusLine("garbage status line")

    monkeypatch.setattr(ml_history.urllib.request, "urlopen", fake_urlopen)

    assert ml_history._fetch_backend_history("alice") is None


def test_load_user_history_prefers_remote_result_when_available(monkeypatch):
    monkeypatch.setattr(
        ml_history, "_fetch_backend_history", lambda user_id: [{"miles_driven": 999}]
    )
    monkeypatch.setattr(ml_history, "_load_local_history", lambda user_id: [{"miles_driven": 1}])

    assert ml_history.load_user_history("alice") == [{"miles_driven": 999}]


def test_load_user_history_falls_back_to_local_when_remote_returns_none(monkeypatch):
    monkeypatch.setattr(ml_history, "_fetch_backend_history", lambda user_id: None)
    monkeypatch.setattr(ml_history, "_load_local_history", lambda user_id: [{"miles_driven": 1}])

    assert ml_history.load_user_history("alice") == [{"miles_driven": 1}]


def test_load_user_history_skips_remote_call_when_no_user_id(monkeypatch):
    calls = []
    monkeypatch.setattr(
        ml_history,
        "_fetch_backend_history",
        lambda user_id: calls.append(user_id),
    )
    monkeypatch.setattr(ml_history, "_load_local_history", lambda user_id: [{"miles_driven": 1}])

    result = ml_history.load_user_history(None)

    assert calls == []
    assert result == [{"miles_driven": 1}]
