"""
Main FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import health, bi_metadata, bi_query

app = FastAPI(
    title="BI Web App API",
    description="Business Intelligence API for executive dashboards",
    version="1.0.0"
)

# Configure CORS
# Allow specific domains: *.goaptive.com, *.aptivepestcontrol.com, *.porenta.us, localhost
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(.*\.)?goaptive\.com|https?://(.*\.)?aptivepestcontrol\.com|https?://(.*\.)?porenta\.us|https?://localhost(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(bi_metadata.router, prefix="/bi", tags=["bi-metadata"])
app.include_router(bi_query.router, prefix="/bi", tags=["bi-query"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "BI Web App API",
        "version": "1.0.0",
        "docs": "/docs"
    }
