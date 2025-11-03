"""BI Query router - reads CSV data files and returns JSON."""

from typing import Optional

import csv
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, Response

from ..models import QueryData, QueryResponse

router = APIRouter()

# Map report IDs to CSV files
CSV_FILE_MAP = {
    "exec-revenue": "exec_revenue.csv",
    "field-ops": "field_ops.csv",
    "customer-churn": "customer_churn.csv",
    "kpi-summary": "kpi_summary.csv",
}

# Get the data directory path
DATA_DIR = Path(__file__).parent.parent / "data"


def read_csv_data(report_id: str) -> QueryData:
    """Read CSV file and return data as a :class:`QueryData` model."""

    csv_filename = CSV_FILE_MAP.get(report_id)
    if not csv_filename:
        raise HTTPException(
            status_code=404,
            detail=f"No CSV file mapped for report_id: {report_id}",
        )

    csv_path = DATA_DIR / csv_filename
    if not csv_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"CSV file not found: {csv_filename}",
        )

    try:
        with open(csv_path, "r", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            rows = list(reader)
            columns = reader.fieldnames if reader.fieldnames else []

            # Convert numeric strings to appropriate types
            processed_rows = []
            for row in rows:
                processed_row = {}
                for key, value in row.items():
                    if value is None:
                        processed_row[key] = None
                        continue

                    try:
                        processed_row[key] = float(value)
                        if "." not in value:
                            processed_row[key] = int(processed_row[key])
                    except ValueError:
                        processed_row[key] = value
                processed_rows.append(processed_row)

            return QueryData(
                columns=columns,
                rows=processed_rows,
                count=len(processed_rows),
            )
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive fallback
        raise HTTPException(
            status_code=500,
            detail=f"Error reading CSV: {exc}",
        ) from exc


@router.get("/query", response_model=QueryResponse)
async def query_data(
    response: Response,
    report_id: str = Query(..., description="Report ID to query"),
    filters: Optional[str] = Query(
        None, description="Optional filters as JSON string"
    ),
) -> QueryResponse:
    """Read data from CSV files and return as JSON.

    In production, this will query AWS RDS databases.
    """

    # Set cache-control headers with short TTL for real-time dashboards
    # Adjust max-age as needed based on data freshness requirements
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=120"

    result = read_csv_data(report_id)

    return QueryResponse(
        report_id=report_id,
        data=result,
        source="csv",
        message="Data loaded from CSV files",
    )
