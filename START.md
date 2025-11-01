# Quick Start Guide

## Starting the Application

You need to run TWO servers - the Python API backend and the Next.js frontend.

### Easy Start - Single Command (Recommended)

```bash
# Run both servers with one command
./start.sh
```

This script will:
- ✓ Start the Python API on **http://localhost:8000**
- ✓ Start the Next.js frontend on **http://localhost:3000**
- ✓ Show colored output from both servers
- ✓ Stop both servers cleanly when you press Ctrl+C

### Manual Start - Separate Terminals

If you prefer to run them separately:

**Terminal 1 - Python API Server**

```bash
# Activate virtual environment and start API
./venv/bin/python run_api.py
```

The API will start on **http://localhost:8000**

You can test it by visiting:
- http://localhost:8000/docs (Interactive API docs)
- http://localhost:8000/health (Health check)
- http://localhost:8000/bi/query?report_id=kpi-summary (Sample data)

**Terminal 2 - Next.js Frontend**

```bash
# Start Next.js development server
npm run dev
```

The frontend will start on **http://localhost:3000**

### Access the Dashboard

Open your Chrome browser and navigate to:
**http://localhost:3000**

## Dashboard Navigation

- **Overview** (/) - Executive summary with all KPIs
- **Revenue** (/dashboards/revenue) - Revenue trends, ARR, MRR, customer growth
- **Operations** (/dashboards/operations) - Field operations metrics, quality scores
- **Customers** (/dashboards/customers) - Churn analysis, retention, LTV

## What You're Seeing

- **Real Data**: All charts and KPIs are pulling data from CSV files in `/api/data/`
- **Beautiful Charts**: Built with Recharts library for professional visualizations
- **Sleek UI**: Dark theme optimized for executive dashboards
- **Responsive**: Works on desktop and tablet screens

## Data Files

CSV data files are located in `/api/data/`:
- `exec_revenue.csv` - Revenue metrics
- `field_ops.csv` - Operations data
- `customer_churn.csv` - Customer analytics
- `kpi_summary.csv` - High-level KPIs

You can edit these files to change the data displayed in the dashboard.

## Troubleshooting

### CORS Errors
If you see CORS errors, make sure both servers are running on the correct ports (3000 and 8000).

### Data Not Loading
Check that the Python API is running on port 8000 and returning data:
```bash
curl http://localhost:8000/bi/query?report_id=kpi-summary
```

### Port Already in Use
If port 3000 or 8000 is already in use:
- For Next.js: `npm run dev -- -p 3001`
- For API: Edit `run_api.py` and change the port number

## Next Steps

1. **Customize Data**: Edit CSV files in `/api/data/` to use your own data
2. **Add Snowflake**: Update `/api/routers/bi_query.py` to query Snowflake instead of CSV
3. **Add Authentication**: Integrate Okta OIDC (already planned in architecture)
4. **Deploy to Vercel**: Run `vercel` to deploy to production
