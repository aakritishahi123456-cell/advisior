from __future__ import annotations

import json
import sys
from typing import Any, Dict

from engine import run_engine


def main() -> int:
    raw = sys.stdin.read()
    if not raw.strip():
        raise ValueError("Expected JSON payload on stdin")

    payload: Dict[str, Any] = json.loads(raw)
    result = run_engine(payload)
    sys.stdout.write(json.dumps({"success": True, "data": result}))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        sys.stdout.write(json.dumps({"success": False, "error": str(exc)}))
        raise

