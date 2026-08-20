# Shared helper for the "read a JSON file that might not exist yet or
# might be corrupt" pattern used by dataset.py (the cached synthetic
# dataset) and history.py (the local fill-up history fallback cache).

import json
from pathlib import Path
from typing import Any


def read_json(path: Path, default: Any) -> Any:
    # Returns the parsed JSON contents of path, or default if the file
    # doesn't exist or contains invalid JSON. Any other failure (e.g. a
    # permissions error) is left to propagate, same as before this was
    # factored out.
    if not path.exists():
        return default

    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return default
