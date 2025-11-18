# Airflow assets agent instructions

All files under this `airflow/` directory represent example orchestration assets for Adobe Experience Platform integrations.

- Prefer type hints on every public function, class, and method.
- Keep modules importable as standalone utilities (no implicit relative imports that require package installation).
- Use `pydantic` models when modeling structured payloads.
- When writing DAG examples, keep them dependency free so they can be parsed without external secrets.
- Keep new dependencies listed in `airflow/requirement.txt`.
