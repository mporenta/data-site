"""Generate lightweight TypeScript types from the FastAPI OpenAPI schema."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Iterable

ROOT = Path(__file__).resolve().parents[0].parent
SCHEMA_PATH = ROOT / "api" / "openapi.json"
OUTPUT_PATH = ROOT / "types" / "api.ts"
TARGET_SCHEMAS = (
    "DashboardMetadata",
    "DashboardMetadataListResponse",
    "QueryData",
    "QueryResponse",
)

PRIMITIVE_MAP = {
    "string": "string",
    "integer": "number",
    "number": "number",
    "boolean": "boolean",
    "null": "null",
}


def load_schema() -> Dict[str, Any]:
    if not SCHEMA_PATH.exists():
        raise SystemExit(
            "OpenAPI document not found. Run `python -m api.generate_openapi` first."
        )
    return json.loads(SCHEMA_PATH.read_text())


def schema_to_ts(schema: Dict[str, Any], components: Dict[str, Any]) -> str:
    if "$ref" in schema:
        return schema["$ref"].split("/")[-1]

    if "enum" in schema:
        return " | ".join(f"'{value}'" for value in schema["enum"]) or "string"

    schema_type = schema.get("type")

    if schema_type == "array":
        return f"{schema_to_ts(schema['items'], components)}[]"

    if schema_type == "object":
        additional = schema.get("additionalProperties")
        if additional:
            value_type = schema_to_ts(additional, components)
            return f"Record<string, {value_type}>"

        properties = schema.get("properties")
        if not properties:
            return "Record<string, unknown>"

        required = set(schema.get("required", ()))
        members = []
        for key, value in properties.items():
            optional = "" if key in required else "?"
            value_ts = schema_to_ts(value, components)
            members.append(f"  {key}{optional}: {value_ts};")
        return "{\n" + "\n".join(members) + "\n}"

    if "anyOf" in schema:
        variants = []
        for option in schema["anyOf"]:
            ts_option = schema_to_ts(option, components)
            if ts_option not in variants:
                variants.append(ts_option)
        return " | ".join(variants)

    if schema_type in PRIMITIVE_MAP:
        return PRIMITIVE_MAP[schema_type]

    return "unknown"


def render_types(components: Dict[str, Any], targets: Iterable[str]) -> str:
    rendered = ["// This file is auto-generated. Do not edit manually.\n"]
    rendered.append("// Run `npm run sync:types` to regenerate.\n\n")

    schemas: Dict[str, Any] = components.get("schemas", {})
    for name in targets:
        schema = schemas.get(name)
        if not schema:
            raise SystemExit(f"Schema '{name}' not found in OpenAPI document.")
        ts_type = schema_to_ts(schema, components)
        rendered.append(f"export type {name} = {ts_type};\n")

    return "".join(rendered)


def main() -> None:
    data = load_schema()
    components = data.get("components", {})
    output = render_types(components, TARGET_SCHEMAS)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(output)
    print(f"TypeScript definitions written to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
