"""Custom Airflow operators that leverage :mod:`airflow_aep_hook`."""

from __future__ import annotations

from typing import Any, Dict, List

from airflow.models import BaseOperator
from airflow.utils.context import Context

from airflow_aep_hook import AEPHook


class AEPBatchIngestOperator(BaseOperator):
    """Operator that ingests NDJSON data into a given AEP dataset."""

    template_fields: List[str] = ["dataset_id"]

    def __init__(
        self,
        *,
        dataset_id: str,
        records: List[Dict[str, Any]],
        aep_conn_id: str = "aep_default",
        **kwargs: Any,
    ) -> None:
        super().__init__(**kwargs)
        self.dataset_id = dataset_id
        self.records = records
        self.aep_conn_id = aep_conn_id

    def execute(self, context: Context) -> str:  # noqa: D401 - inherited docs
        import json

        hook = AEPHook(aep_conn_id=self.aep_conn_id)
        ingest_client = hook.get_ingestion_client()

        ndjson_str = "\n".join(json.dumps(record) for record in self.records)

        batch = ingest_client.create_batch(dataset_id=self.dataset_id)
        batch_id = batch["id"]

        ingest_client.upload_batch_data(
            batch_id=batch_id,
            data_bytes=ndjson_str.encode("utf-8"),
        )
        ingest_client.commit_batch(batch_id=batch_id)

        self.log.info("Committed AEP batch %s", batch_id)
        return batch_id


class AEPQueryOperator(BaseOperator):
    """Operator that runs a Query Service SQL query and returns rows."""

    template_fields: List[str] = ["sql"]

    def __init__(
        self,
        *,
        sql: str,
        aep_conn_id: str = "aep_default",
        **kwargs: Any,
    ) -> None:
        super().__init__(**kwargs)
        self.sql = sql
        self.aep_conn_id = aep_conn_id

    def execute(self, context: Context) -> List[Dict[str, Any]]:  # noqa: D401 - inherited docs
        hook = AEPHook(aep_conn_id=self.aep_conn_id)
        query_client = hook.get_query_client()

        result = query_client.execute(self.sql)
        rows = result.get("results", [])
        self.log.info("Query returned %d rows", len(rows))
        return rows
