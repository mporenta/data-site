"""Unit tests for the pipeline runner."""

import sys
from pathlib import Path
from typing import Any, Dict
from unittest.mock import MagicMock, patch

sys.path.append(str(Path(__file__).resolve().parent.parent))

from main import run_pipeline


def _fake_s3_get_object(*args: Any, **kwargs: Any) -> Dict[str, Any]:
    body = (
        b'[{"customer_id": "123", "event_type": "purchase", '
        b'"event_timestamp": "2025-01-01T00:00:00Z"}]'
    )
    return {"Body": MagicMock(read=lambda: body)}


def _fake_s3_put_object(*args: Any, **kwargs: Any) -> Dict[str, Any]:
    return {}


@patch("main.s3.put_object", side_effect=_fake_s3_put_object)
@patch("main.s3.get_object", side_effect=_fake_s3_get_object)
@patch("main.AEPClient")
@patch("main.IngestionClient")
@patch("main.QueryServiceClient")
def test_run_pipeline_happy_path(
    mock_query_cls,
    mock_ingest_cls,
    mock_aep_client_cls,
    mock_get_object,
    mock_put_object,
) -> None:
    mock_ingest = MagicMock()
    mock_query = MagicMock()

    mock_ingest.create_batch.return_value = {"id": "batch-123"}
    mock_query.execute.return_value = {"results": [{"foo": "bar"}]}

    mock_ingest_cls.return_value = mock_ingest
    mock_query_cls.return_value = mock_query

    result = run_pipeline(
        source_bucket="test-bucket",
        source_key="input/data.json",
        target_bucket="test-bucket",
        target_key="output/data.json",
        dataset_id="test_dataset",
    )

    assert result["batch_id"] == "batch-123"
    assert result["validated_in"] == 1
    assert result["returned_from_aep"] == 1
    assert result["output_key"] == "output/data.json"

    mock_ingest.create_batch.assert_called_once_with(dataset_id="test_dataset")
    mock_ingest.upload_batch_data.assert_called_once()
    mock_ingest.commit_batch.assert_called_once()
    mock_query.execute.assert_called_once()
    mock_put_object.assert_called_once()
