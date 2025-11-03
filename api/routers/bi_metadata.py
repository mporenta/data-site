"""BI Metadata router - returns available dashboards and reports."""

from fastapi import APIRouter, HTTPException

from ..models import DashboardMetadata, DashboardMetadataListResponse

router = APIRouter()

# Sample metadata - in production this would come from dbt artifacts or a database
DASHBOARDS_METADATA = [
    DashboardMetadata(
        id="exec-revenue",
        name="Executive Revenue Dashboard",
        description="Overview of revenue metrics and trends",
        groups=["C_SUITE", "FINANCE"],
        kpis=["ARR", "MRR", "Revenue Growth"],
    ),
    DashboardMetadata(
        id="field-ops",
        name="Field Operations Performance",
        description="Field operations metrics and performance indicators",
        groups=["C_SUITE", "OPS"],
        kpis=["Routes Completed", "Service Quality", "Resource Utilization"],
    ),
    DashboardMetadata(
        id="customer-churn",
        name="Customer Churn Analysis",
        description="Customer retention and churn metrics",
        groups=["C_SUITE", "CUSTOMER_SUCCESS"],
        kpis=["Churn Rate", "Retention Rate", "Customer Lifetime Value"],
    ),
]


@router.get("/metadata", response_model=DashboardMetadataListResponse)
async def get_dashboards_metadata() -> DashboardMetadataListResponse:
    """Returns metadata for all available dashboards."""

    return DashboardMetadataListResponse(
        dashboards=DASHBOARDS_METADATA,
        count=len(DASHBOARDS_METADATA),
    )


@router.get("/metadata/{dashboard_id}", response_model=DashboardMetadata)
async def get_dashboard_metadata(dashboard_id: str) -> DashboardMetadata:
    """Returns metadata for a specific dashboard."""

    dashboard = next(
        (d for d in DASHBOARDS_METADATA if d.id == dashboard_id),
        None,
    )

    if not dashboard:
        raise HTTPException(
            status_code=404,
            detail=f"Dashboard '{dashboard_id}' not found",
        )

    return dashboard
