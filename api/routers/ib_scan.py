"""
Interactive Brokers async scanner and market data router.
"""
import asyncio
from typing import Any, List

from fastapi import APIRouter, HTTPException
from ib_async import IB

router = APIRouter()


async def connect_ib() -> IB:
    """Establish an asynchronous connection to IB Gateway."""
    ib = IB()
    await ib.connect()
    return ib


async def run_scanner(ib: IB) -> List[Any]:
    """Run the volume scanner and return the top 5 results."""
    scan_results = await ib.scanner("HOT_BY_VOLUME")
    return scan_results[:5]


async def fetch_market_data(ib: IB, ticker: Any) -> Any:
    """Qualify the contract and fetch market data for the ticker."""
    contract = await ib.qualify_contract(ticker)
    market_data = await ib.req_market_data(contract)
    ib.cancel_market_data(contract)
    return market_data


@router.get("/run-scan")
async def run_scan_endpoint() -> dict[str, Any]:
    """Execute the scanner and return market data for the top tickers."""
    ib = await connect_ib()
    try:
        top_tickers = await run_scanner(ib)
    except Exception as exc:
        await ib.disconnect()
        raise HTTPException(status_code=500, detail=f"Scanner failed: {exc}") from exc

    try:
        tasks = [fetch_market_data(ib, ticker) for ticker in top_tickers]
        market_data_results = await asyncio.gather(*tasks)
    finally:
        await ib.disconnect()

    return {
        "scan_parameters": {"type": "HOT_BY_VOLUME", "limit": 5},
        "results": [
            {"ticker": ticker, "data": data}
            for ticker, data in zip(top_tickers, market_data_results)
        ],
    }
