"""Business intelligence API models."""

from typing import Dict, List, Union

from pydantic import BaseModel, Field

PrimitiveValue = Union[str, int, float, bool, None]


class DashboardMetadata(BaseModel):
    """Metadata describing an available dashboard."""

    id: str = Field(..., description="Unique identifier for the dashboard")
    name: str = Field(..., description="Human-readable dashboard name")
    description: str = Field(..., description="Summary of what the dashboard contains")
    groups: List[str] = Field(
        ..., description="Access groups that can view this dashboard"
    )
    kpis: List[str] = Field(..., description="Key metrics highlighted in the dashboard")


class DashboardMetadataListResponse(BaseModel):
    """Response containing all dashboard metadata."""

    dashboards: List[DashboardMetadata]
    count: int


class QueryData(BaseModel):
    """Tabular data returned for a BI report."""

    columns: List[str]
    rows: List[Dict[str, PrimitiveValue]]
    count: int


class QueryResponse(BaseModel):
    """Response payload for the `/bi/query` endpoint."""

    report_id: str
    data: QueryData
    source: str
    message: str
