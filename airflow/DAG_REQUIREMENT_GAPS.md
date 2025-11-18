# DAG Requirements Gaps

This document tracks how the assets in `airflow/` diverge from the standards described in `CLAUDE.md` so future work can prioritize compliance.

## Directory & Naming Structure
- **Expectation (CLAUDE.md)**: Each DAG should reside inside its own directory under `dags/`, with DAG modules named after their frequency (e.g., `daily.py`, `hourly.py`).
- **Current State**: The example DAG lives directly at `airflow/dags/aep_ingest_clean_dag.py` instead of `dags/<dag_name>/<frequency>.py`, so it does not follow the mandated directory hierarchy or naming convention.

## Standard Entry Point Pattern
- **Expectation**: Every DAG package should expose a `src/main.py` containing a `Main` class with an `execute()` method as the canonical entry point.
- **Current State**: The AEP example has no `src/` tree or `Main` class; the DAG is defined inline within the module.

## Template Usage
- **Expectation**: New DAGs should start from `_dag_template/` or `_dag_taskflow_template/` to ensure consistent scaffolding.
- **Current State**: The current DAG was written from scratch and does not reference either template, so it may miss required boilerplate (callbacks, config patterns, etc.).

## Hooks & Operators Placement
- **Expectation**: Reusable hooks belong in `common/custom_hooks/` and operators in `common/custom_operators/` so they can be imported consistently across DAGs.
- **Current State**: `airflow_aep_hook.py` and `airflow_aep_operators.py` live directly under `airflow/`, outside the standardized `common/` directories, so they do not align with the repository’s shared-component layout.

## Heartbeat-Safe DAG Module Behavior
- **Expectation**: DAG-level code must avoid running side effects during Airflow’s heartbeat; only lightweight definitions should execute at import time.
- **Current State**: While the TaskFlow-decorated function defers execution, the module eagerly constructs a default task dependency graph (`records >> ingest >> query`) during import. Any future additions (e.g., S3 lookups for configuration) would execute immediately, so the module should be refactored to the prescribed `Main.execute()` pattern to guarantee heartbeat safety.
