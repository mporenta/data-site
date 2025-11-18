"""Utility helpers for orchestrating AEP ingest from data stored in S3."""

from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

import boto3
from botocore.client import BaseClient

# Ensure the custom Airflow directory is importable without conflicting with the apache-airflow package.
AIRFLOW_DIR = Path(__file__).resolve().parent / "airflow"
if AIRFLOW_DIR.exists():
    sys.path.insert(0, str(AIRFLOW_DIR))

from adapters import dbt_row_to_xdm_event, dbt_row_to_xdm_profile  # type: ignore  # noqa: E402
from models import AEPIngestPayload, CustomerEvent, CustomerProfile  # type: ignore  # noqa: E402

try:  # pragma: no cover - optional dependency
    from adobe_aep_sdk import AEPClient  # type: ignore
    from adobe_aep_sdk.modules.ingestion import IngestionClient  # type: ignore
    from adobe_aep_sdk.modules.queryservice import QueryServiceClient  # type: ignore
except Exception:  # pragma: no cover
    class AEPClient:  # type: ignore[override]
        def __init__(self, *args: Any, **kwargs: Any) -> None:  # pragma: no cover
            raise RuntimeError("adobe-aep-sdk is required to instantiate AEPClient")

    class IngestionClient:  # type: ignore[override]
        def __init__(self, *args: Any, **kwargs: Any) -> None:  # pragma: no cover
            raise RuntimeError("adobe-aep-sdk is required to instantiate IngestionClient")

    class QueryServiceClient:  # type: ignore[override]
        def __init__(self, *args: Any, **kwargs: Any) -> None:  # pragma: no cover
            raise RuntimeError("adobe-aep-sdk is required to instantiate QueryServiceClient")


logger = logging.getLogger(__name__)
s3: BaseClient = boto3.client("s3")


class AEPClientConfig(Dict[str, Optional[str]]):
    """Simple mapping describing the credentials needed to bootstrap the SDK clients."""


def load_records_from_s3(bucket: str, key: str) -> List[Dict[str, Any]]:
    """Download a JSON payload from S3 and return the parsed records list."""

    response = s3.get_object(Bucket=bucket, Key=key)
    body = response["Body"].read()
    if isinstance(body, bytes):
        body_str = body.decode("utf-8")
    else:  # pragma: no cover
        body_str = body
    return json.loads(body_str)


def validate_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Validate incoming records, preferring XDM schemas with graceful fallbacks."""

    validated: List[Dict[str, Any]] = []
    for row in records:
        try:
            try:
                if "event_type" in row:
                    obj = dbt_row_to_xdm_event(row)
                else:
                    obj = dbt_row_to_xdm_profile(row)
            except Exception:
                try:
                    obj = CustomerEvent(**row)
                except Exception:
                    obj = CustomerProfile(**row)

            validated.append(obj.model_dump(by_alias=True))
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Skipping invalid record %s: %s", row, exc)
    return validated


def _resolve_aep_config() -> AEPClientConfig:
    """Resolve credentials from environment variables, falling back to placeholders for tests."""

    config: AEPClientConfig = AEPClientConfig(
        client_id=os.getenv("AEP_CLIENT_ID", "test"),
        client_secret=os.getenv("AEP_CLIENT_SECRET", "test"),
        org_id=os.getenv("AEP_ORG_ID", "test"),
        tech_acct_id=os.getenv("AEP_TECH_ACCT_ID", "test"),
        private_key_path=os.getenv("AEP_PRIVATE_KEY", "private.key"),
        sandbox_name=os.getenv("AEP_SANDBOX", "prod"),
    )
    return config


def _build_clients() -> Dict[str, Any]:
    config = _resolve_aep_config()
    aep_client = AEPClient(**config)
    ingestion_client = IngestionClient(aep_client)
    query_client = QueryServiceClient(aep_client)
    return {
        "aep_client": aep_client,
        "ingestion_client": ingestion_client,
        "query_client": query_client,
    }


def run_pipeline(
    *,
    source_bucket: str,
    source_key: str,
    target_bucket: str,
    target_key: str,
    dataset_id: str,
) -> Dict[str, Any]:
    """Run the end-to-end flow: load → validate → ingest → query → persist results."""

    records = load_records_from_s3(source_bucket, source_key)
    validated = validate_records(records)

    payload = AEPIngestPayload(dataset_id=dataset_id, records=validated)

    clients = _build_clients()
    ingestion_client: IngestionClient = clients["ingestion_client"]
    query_client: QueryServiceClient = clients["query_client"]

    batch = ingestion_client.create_batch(dataset_id=dataset_id)
    batch_id = batch["id"]

    ingestion_client.upload_batch_data(
        batch_id=batch_id,
        data_bytes=payload.to_ndjson().encode("utf-8"),
    )
    ingestion_client.commit_batch(batch_id=batch_id)

    sql = f"SELECT * FROM {dataset_id} LIMIT 100"
    query_response = query_client.execute(sql)
    query_rows = query_response.get("results", [])

    s3.put_object(
        Bucket=target_bucket,
        Key=target_key,
        Body=json.dumps(query_rows).encode("utf-8"),
    )

    return {
        "batch_id": batch_id,
        "validated_in": len(validated),
        "returned_from_aep": len(query_rows),
        "output_key": target_key,
    }


__all__ = [
    "run_pipeline",
    "validate_records",
    "load_records_from_s3",
    "AEPClient",
    "IngestionClient",
    "QueryServiceClient",
]
