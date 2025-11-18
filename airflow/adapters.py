"""Adapters that convert dbt/Snowflake rows into XDM payloads."""

from typing import Dict, Any, List
from models_xdm import (
    XDMExperienceEvent,
    XDMIndividualProfile,
    XDMIdentity,
    XDMPerson,
    XDMPersonName,
    XDMPersonalEmail,
    XDMCommerce,
)


def _build_identity_map(identities: List[XDMIdentity]) -> Dict[str, List[XDMIdentity]]:
    identity_map: Dict[str, List[XDMIdentity]] = {}
    for ident in identities:
        identity_map.setdefault(ident.namespace, []).append(ident)
    return identity_map


def dbt_row_to_xdm_profile(row: Dict[str, Any]) -> XDMIndividualProfile:
    """Map a dbt/Snowflake row (customer dim) into an XDMIndividualProfile."""

    customer_id = str(row.get("customer_id")) if row.get("customer_id") is not None else None
    email = row.get("email")

    identities: List[XDMIdentity] = []

    if customer_id:
        identities.append(XDMIdentity(id=customer_id, namespace="CRMID", primary=True))

    if email:
        email_identity = XDMIdentity(id=email, namespace="Email", primary=(not identities))
        identities.append(email_identity)

    identity_map = _build_identity_map(identities) if identities else {}

    person = XDMPerson(
        name=XDMPersonName(
            firstName=row.get("first_name"),
            lastName=row.get("last_name"),
        )
    )

    personal_email = XDMPersonalEmail(address=email) if email else None

    experience_block = {
        "loyalty": {
            "tier": row.get("loyalty_tier"),
        }
    }

    return XDMIndividualProfile(
        xdmId=None,
        identityMap=identity_map,
        person=person,
        personalEmail=personal_email,
        experience=experience_block,
    )


def dbt_row_to_xdm_event(row: Dict[str, Any]) -> XDMExperienceEvent:
    """Map a dbt/Snowflake fact row into an XDMExperienceEvent."""

    customer_id = str(row.get("customer_id")) if row.get("customer_id") is not None else None
    email = row.get("email")

    identities: List[XDMIdentity] = []

    if customer_id:
        identities.append(XDMIdentity(id=customer_id, namespace="CRMID", primary=True))

    if email:
        identities.append(XDMIdentity(id=email, namespace="Email", primary=(not identities)))

    identity_map = _build_identity_map(identities) if identities else {}

    commerce = XDMCommerce(
        order={
            "orderID": row.get("order_id"),
            "priceTotal": row.get("amount"),
            "currencyCode": row.get("currency") or "USD",
        }
    )

    experience_block = {
        "channel": {
            "type": row.get("channel_type") or "web",
        }
    }

    return XDMExperienceEvent(
        event_id=str(row.get("event_id") or row.get("order_id") or ""),
        eventType=row.get("event_type") or "commerce.purchases",
        timestamp=row.get("event_timestamp"),
        identityMap=identity_map,
        commerce=commerce,
        experience=experience_block,
    )
