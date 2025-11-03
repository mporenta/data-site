"""Utility for exporting the FastAPI OpenAPI schema to disk.

Run with ``python -m api.generate_openapi`` so relative imports resolve correctly.
"""

import json
from pathlib import Path

from .index import app


def main() -> None:
    schema = app.openapi()
    output_path = Path(__file__).resolve().parent / "openapi.json"
    output_path.write_text(json.dumps(schema, indent=2))
    print(f"OpenAPI schema written to {output_path}")


if __name__ == "__main__":
    main()
