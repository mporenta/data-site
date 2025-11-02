"""
BI Query router - reads CSV data files and returns JSON
"""
from fastapi import APIRouter, Query, HTTPException, Response
from typing import Optional, Dict, Any, List
import csv
import os
from pathlib import Path

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


def read_csv_data(report_id: str) -> Dict[str, Any]:
    """
    Read CSV file and return data as JSON structure
    """
    csv_filename = CSV_FILE_MAP.get(report_id)

    if not csv_filename:
        return {
            "error": f"No CSV file mapped for report_id: {report_id}",
            "columns": [],
            "rows": [],
            "count": 0
        }

    csv_path = DATA_DIR / csv_filename

    if not csv_path.exists():
        return {
            "error": f"CSV file not found: {csv_filename}",
            "columns": [],
            "rows": [],
            "count": 0
        }

    try:
        with open(csv_path, 'r') as file:
            reader = csv.DictReader(file)
            rows = list(reader)
            columns = reader.fieldnames if reader.fieldnames else []

            # Convert numeric strings to appropriate types
            processed_rows = []
            for row in rows:
                processed_row = {}
                for key, value in row.items():
                    # Try to convert to float/int if possible
                    try:
                        if '.' in value:
                            processed_row[key] = float(value)
                        else:
                            processed_row[key] = int(value)
                    except (ValueError, AttributeError):
                        processed_row[key] = value
                processed_rows.append(processed_row)

            return {
                "columns": columns,
                "rows": processed_rows,
                "count": len(processed_rows)
            }
    except Exception as e:
        return {
            "error": f"Error reading CSV: {str(e)}",
            "columns": [],
            "rows": [],
            "count": 0
        }


@router.get("/query")
async def query_data(
    response: Response,
    report_id: str = Query(..., description="Report ID to query"),
    filters: Optional[str] = Query(None, description="Optional filters as JSON string")
):
    """
    Read data from CSV files and return as JSON

    In production, this will query AWS RDS databases
    """
    # Set cache-control headers with short TTL for real-time dashboards
    # Adjust max-age as needed based on data freshness requirements
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=120"

    # Read data from CSV
    result = read_csv_data(report_id)

    if "error" in result and result["count"] == 0:
        raise HTTPException(
            status_code=404,
            detail=result["error"]
        )

    return {
        "report_id": report_id,
        "data": result,
        "source": "csv",
        "message": "Data loaded from CSV files"
    }
