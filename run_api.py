"""
Development server for the FastAPI backend
Run with: python run_api.py or ./venv/bin/python run_api.py
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "api.index:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
