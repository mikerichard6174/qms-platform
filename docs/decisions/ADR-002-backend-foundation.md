# ADR-002: Backend Foundation Choice

## Status
Accepted

## Context
The QMS Platform backend must support structured business logic, workflow enforcement, auditability, reporting queries, and future integration with authentication, storage, and AI providers.

The first deployment target is a single Linux VM with Docker, but the architecture must remain portable to AWS and Kubernetes/EKS.

## Decision
The backend will be implemented using:
- Python 3.12
- FastAPI
- SQLAlchemy 2.x
- Alembic
- PostgreSQL
- Pydantic Settings
- synchronous SQLAlchemy sessions for the MVP

## Rationale
This stack was selected because it:
- supports rapid API development
- provides strong request/response validation
- aligns well with relational business systems
- supports future reporting and AI-related features
- keeps operational complexity lower than an async-first design for the MVP
- works well in Dockerized environments

## Consequences
### Positive
- straightforward local development
- clear separation between API, services, repositories, and workflows
- strong PostgreSQL integration
- easy future evolution into a more advanced deployment model

### Negative
- care must be taken to keep service boundaries clean as the codebase grows
- async patterns may be introduced later if specific workloads justify them