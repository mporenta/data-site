#!/bin/bash

# BI Web App - Start Script
# Runs both Python API and Next.js frontend servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# PIDs for cleanup
API_PID=""
NEXT_PID=""

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"

    if [ ! -z "$API_PID" ]; then
        echo -e "${BLUE}Stopping Python API (PID: $API_PID)${NC}"
        kill $API_PID 2>/dev/null || true
    fi

    if [ ! -z "$NEXT_PID" ]; then
        echo -e "${BLUE}Stopping Next.js (PID: $NEXT_PID)${NC}"
        kill $NEXT_PID 2>/dev/null || true
    fi

    echo -e "${GREEN}Servers stopped.${NC}"
    exit 0
}

# Set up trap to catch Ctrl+C and other signals
trap cleanup SIGINT SIGTERM EXIT

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  BI Web App - Starting Servers${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${RED}Error: Python virtual environment not found.${NC}"
    echo -e "${YELLOW}Please run: python3.11 -m venv venv && ./venv/bin/pip install -r requirements.txt${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${RED}Error: node_modules not found.${NC}"
    echo -e "${YELLOW}Please run: npm install${NC}"
    exit 1
fi

# Start Python API
echo -e "${BLUE}[1/2] Starting Python API Server...${NC}"
./venv/bin/python run_api.py > >(sed "s/^/[API] /") 2>&1 &
API_PID=$!
echo -e "${GREEN}✓ Python API started (PID: $API_PID)${NC}"
echo -e "      http://localhost:8000"
echo -e "      http://localhost:8000/docs (API Documentation)\n"

# Wait a moment for API to start
sleep 2

# Start Next.js
echo -e "${BLUE}[2/2] Starting Next.js Frontend...${NC}"
npm run dev > >(sed "s/^/[NEXT] /") 2>&1 &
NEXT_PID=$!
echo -e "${GREEN}✓ Next.js started (PID: $NEXT_PID)${NC}"
echo -e "      http://localhost:3000\n"

# Wait for servers to initialize
echo -e "${YELLOW}Waiting for servers to initialize...${NC}"
sleep 3

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ Both servers are running!${NC}"
echo -e "${GREEN}========================================${NC}\n"
echo -e "${BLUE}Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}API:${NC}      http://localhost:8000"
echo -e "${BLUE}API Docs:${NC} http://localhost:8000/docs\n"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}\n"

# Wait for both processes
wait $API_PID $NEXT_PID
