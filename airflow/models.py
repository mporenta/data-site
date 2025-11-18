"""Fallback Pydantic models for customer data ingestion."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CustomerProfile(BaseModel):
    """Represents a dimensional customer record."""

    customer_id: str = Field(..., description="Primary identifier for the customer")
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    loyalty_tier: Optional[str] = None


class CustomerEvent(BaseModel):
    """Represents a fact/event row coming from transactional tables."""

    customer_id: str
    event_type: str
    event_timestamp: str
    order_id: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None


class AEPIngestPayload(BaseModel):
    """NDJSON payload for ingestion into Adobe Experience Platform."""

    dataset_id: str
    records: List[Dict[str, Any]]

    def to_ndjson(self) -> str:
        import json

        return "\n".join(json.dumps(record) for record in self.records)
