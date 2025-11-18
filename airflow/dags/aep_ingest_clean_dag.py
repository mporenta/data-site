"""Example Airflow DAG that ingests cleaned records into AEP."""

from __future__ import annotations

import json
from airflow import DAG
from airflow.decorators import task
from airflow.providers.amazon.aws.hooks.s3 import S3Hook
from airflow.utils.dates import days_ago

from airflow_aep_operators import AEPBatchIngestOperator, AEPQueryOperator


def _default_sql(dataset_id: str) -> str:
    return f"SELECT * FROM {dataset_id} LIMIT 100"


default_args = {
    "owner": "data-eng",
}

with DAG(
    dag_id="aep_clean_ingest",
    start_date=days_ago(1),
    schedule_interval="@daily",
    catchup=False,
    default_args=default_args,
    tags=["aep", "clean"],
) as dag:

    @task
    def load_records_from_s3() -> list:
        s3 = S3Hook(aws_conn_id="aws_default")
        bucket = "your-bucket"
        key = "input/data.json"

        path = s3.download_file(bucket_name=bucket, key=key)
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)

    records = load_records_from_s3()

    ingest = AEPBatchIngestOperator(
        task_id="ingest_to_aep",
        dataset_id="YOUR_AEP_DATASET_ID",
        records=records,
    )

    query = AEPQueryOperator(
        task_id="query_aep",
        sql=_default_sql("YOUR_AEP_DATASET_ID"),
    )

    records >> ingest >> query
