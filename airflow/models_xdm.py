"""Pydantic representations of a subset of the Adobe XDM schemas."""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict


class XDMIdentity(BaseModel):
    """Represents an identity record inside the XDM identity map."""

    id: str = Field(..., description="Identity value, e.g. email or CRM ID")
    namespace: str = Field(..., description="Identity namespace, e.g. 'Email', 'CRMID'")
    primary: bool = Field(default=False, description="Whether this is the primary identity")


class XDMPersonalEmail(BaseModel):
    """Simple representation of a personal email address."""

    address: str
    type: str = "personal"


class XDMPersonName(BaseModel):
    """Normalized person name fields."""

    firstName: Optional[str] = None
    lastName: Optional[str] = None


class XDMPerson(BaseModel):
    """Basic person-level demographic details."""

    name: Optional[XDMPersonName] = None
    gender: Optional[str] = None


class XDMIndividualProfile(BaseModel):
    """Minimal example of an XDM Individual Profile."""

    model_config = ConfigDict(populate_by_name=True)

    xdmId: Optional[str] = Field(default=None, description="AEP-assigned XDM ID")
    identityMap: Dict[str, List[XDMIdentity]] = Field(
        default_factory=dict,
        description="Identity namespaces to identity list",
    )
    person: Optional[XDMPerson] = None
    personalEmail: Optional[XDMPersonalEmail] = None
    experience: Optional[Dict[str, Any]] = Field(
        default=None,
        alias="_experience",
        serialization_alias="_experience",
        description="Custom profile fields under _experience",
    )


class XDMCommerce(BaseModel):
    """Commerce metadata that can live on experience events."""

    order: Optional[Dict[str, Any]] = None
    productListItems: Optional[List[Dict[str, Any]]] = None


class XDMExperienceEvent(BaseModel):
    """Minimal example of an XDM ExperienceEvent."""

    model_config = ConfigDict(populate_by_name=True)

    event_id: Optional[str] = Field(
        default=None,
        alias="_id",
        serialization_alias="_id",
        description="Unique event ID",
    )
    eventType: str = Field(..., description="Event type, e.g. 'commerce.purchases'")
    timestamp: str = Field(..., description="ISO timestamp")
    identityMap: Dict[str, List[XDMIdentity]] = Field(
        default_factory=dict,
        description="Identity namespaces to identity list",
    )
    commerce: Optional[XDMCommerce] = None
    experience: Optional[Dict[str, Any]] = Field(
        default=None,
        alias="_experience",
        serialization_alias="_experience",
        description="Custom event fields under _experience",
    )
