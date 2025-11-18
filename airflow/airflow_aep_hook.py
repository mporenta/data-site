"""Custom Airflow hook that creates clients for Adobe Experience Platform."""

from __future__ import annotations

from typing import Any, Dict

from airflow.hooks.base import BaseHook

try:
    from adobe_aep_sdk import AEPClient
    from adobe_aep_sdk.modules.ingestion import IngestionClient
    from adobe_aep_sdk.modules.queryservice import QueryServiceClient
except Exception:  # pragma: no cover - optional dependency
    # Lightweight stubs allow the hook to be imported in environments without the SDK.
    class AEPClient:  # type: ignore[override]
        def __init__(self, *args: Any, **kwargs: Any) -> None:  # pragma: no cover
            raise RuntimeError("adobe-aep-sdk is required to instantiate AEPClient")

    class IngestionClient:  # type: ignore[override]
        def __init__(self, *args: Any, **kwargs: Any) -> None:  # pragma: no cover
            raise RuntimeError("adobe-aep-sdk is required to instantiate IngestionClient")

    class QueryServiceClient:  # type: ignore[override]
        def __init__(self, *args: Any, **kwargs: Any) -> None:  # pragma: no cover
            raise RuntimeError("adobe-aep-sdk is required to instantiate QueryServiceClient")


class AEPHook(BaseHook):
    """Airflow Hook to create AEPClient and related module clients using a connection."""

    conn_name_attr = "aep_conn_id"
    default_conn_name = "aep_default"
    conn_type = "http"
    hook_name = "Adobe Experience Platform Hook"

    def __init__(self, aep_conn_id: str = "aep_default") -> None:
        super().__init__()
        self.aep_conn_id = aep_conn_id

    def get_conn(self) -> AEPClient:
        """Return an authenticated :class:`AEPClient` based on the Airflow connection."""

        conn = self.get_connection(self.aep_conn_id)
        extras: Dict[str, Any] = conn.extra_dejson

        client_id = conn.login
        client_secret = conn.password
        org_id = extras.get("org_id")
        tech_acct_id = extras.get("tech_acct_id")
        private_key_path = extras.get("private_key_path", "private.key")
        sandbox_name = extras.get("sandbox", "prod")

        return AEPClient(
            client_id=client_id,
            client_secret=client_secret,
            org_id=org_id,
            tech_acct_id=tech_acct_id,
            private_key_path=private_key_path,
            sandbox_name=sandbox_name,
        )

    def get_ingestion_client(self) -> IngestionClient:
        """Return an ingestion client for dataset uploads."""

        return IngestionClient(self.get_conn())

    def get_query_client(self) -> QueryServiceClient:
        """Return a Query Service client for SQL execution."""

        return QueryServiceClient(self.get_conn())
