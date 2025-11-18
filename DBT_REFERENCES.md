# dbt References in Codex Branch (Airflow Directory)

This document catalogs all references to `dbt` (data build tool) found in the `airflow/` directory of the `codex/create-airflow-directory-with-code-and-docs` branch.

## Summary

A total of **5 references** to `dbt` were found in **1 file** in the airflow directory:

- **airflow/adapters.py**: 5 references

## Detailed References

### airflow/adapters.py

This file contains adapters that convert dbt/Snowflake rows into Adobe Experience Platform (AEP) XDM payloads.

**Line 1** - Module docstring:
```python
"""Adapters that convert dbt/Snowflake rows into XDM payloads."""
```

**Line 22** - Function definition:
```python
def dbt_row_to_xdm_profile(row: Dict[str, Any]) -> XDMIndividualProfile:
```

**Line 23** - Function docstring:
```python
    """Map a dbt/Snowflake row (customer dim) into an XDMIndividualProfile."""
```

**Line 63** - Function definition:
```python
def dbt_row_to_xdm_event(row: Dict[str, Any]) -> XDMExperienceEvent:
```

**Line 64** - Function docstring:
```python
    """Map a dbt/Snowflake fact row into an XDMExperienceEvent."""
```

**Purpose**: This file provides two main adapter functions:
- `dbt_row_to_xdm_profile()`: Converts customer dimension data from dbt/Snowflake into XDM Individual Profile format
- `dbt_row_to_xdm_event()`: Converts fact/event data from dbt/Snowflake into XDM Experience Event format

Both functions handle identity mapping, data transformation, and XDM schema compliance for Adobe Experience Platform integration.

---

## Context and Integration

### dbt's Role in the Airflow Pipeline

Based on the references found in the airflow directory, `dbt` (data build tool) appears to serve as:

1. **Data Transformation Layer**: dbt transforms raw data in Snowflake into structured dimensional models (customer dimensions and fact tables)

2. **Data Source for AEP Integration**: The transformed dbt models are:
   - Loaded from Snowflake
   - Converted to XDM (Experience Data Model) format using the adapter functions
   - Ingested into Adobe Experience Platform via Airflow orchestration

### Workflow

```
Snowflake Raw Data
    ↓
dbt Transformations (dimensional modeling)
    ↓
dbt Models (customer_dim, fact tables)
    ↓
Airflow DAG (aep_ingest_clean_dag.py)
    ↓
Python Adapters (airflow/adapters.py)
    - dbt_row_to_xdm_profile()
    - dbt_row_to_xdm_event()
    ↓
XDM Format (Adobe Experience Platform schema)
    ↓
AEP Ingestion (via Airflow operators)
```

### Technology Stack in Airflow Directory

The integration involves:
- **dbt**: Data transformation and modeling in Snowflake
- **Snowflake**: Data warehouse where dbt models are materialized
- **Apache Airflow**: Orchestration of data pipelines (DAGs in `airflow/dags/`)
- **Python Adapters**: Transform dbt output to XDM format (`airflow/adapters.py`)
- **Adobe Experience Platform (AEP)**: Customer data platform for unified profiles and events
- **Custom Airflow Operators**: AEP-specific operators (`airflow/airflow_aep_operators.py`) and hooks (`airflow/airflow_aep_hook.py`)

---

## Scope Note

This documentation focuses exclusively on dbt references found in the `airflow/` directory of the `codex/create-airflow-directory-with-code-and-docs` branch. The airflow directory contains Airflow DAG implementations and AEP integration code that may not be present in other branches.

---

## Recommendations

1. **Document dbt Models**: Create documentation for the expected dbt model schemas (customer_dim, fact tables) that these adapters consume

2. **Schema Validation**: Add explicit schema validation for dbt output to ensure compatibility with the XDM adapters

3. **Error Handling**: Enhance error handling in the adapter functions to provide clearer feedback when dbt row structures don't match expectations

4. **Testing**: Create unit tests with sample dbt output data to validate the adapter functions

5. **dbt Integration**: Consider documenting the connection between dbt models in Snowflake and the Airflow DAGs that consume them

---

*Document generated: 2025-11-18*  
*Branch analyzed: codex/create-airflow-directory-with-code-and-docs*  
*Repository: mporenta/data-site*
