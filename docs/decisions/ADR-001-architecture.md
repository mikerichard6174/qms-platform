# ADR-001: Initial Architecture Choice

## Status
Accepted

## Context
The QMS Platform must support controlled documents, standards traceability, NCR workflows, CAPA workflows, and dashboards for a relatively small number of users. It must be deployable first on a single Linux VM with Docker, while remaining portable to AWS and Kubernetes/EKS later.

The system must support multiple programs, future RBAC, audit logging, and future expansion into additional modules and standards.

## Decision
The system will be implemented as a web-hosted modular monolith using:
- Next.js frontend
- FastAPI backend
- PostgreSQL database
- file/object storage abstraction
- Docker-based deployment

## Rationale
This architecture was selected because it:
- supports rapid MVP development
- minimizes operational overhead
- preserves clean internal module boundaries
- supports future scale without premature microservice complexity
- aligns well with a single-VM first deployment model
- supports future AWS and Kubernetes/EKS deployment
- reduces vendor lock-in
- supports future AI and SSO integration cleanly

## Consequences
### Positive
- simpler deployment
- easier local development
- lower infrastructure complexity
- clearer maintainability for an early-stage product
- clean path to modular scaling later

### Negative
- backend codebase must be carefully structured to avoid becoming tightly coupled
- scaling individual domains independently will not be as direct as a microservice architecture
- internal architecture discipline is required to preserve boundaries

## Follow-Up Decisions
Future ADRs should cover:
- authentication strategy
- file storage strategy
- tenancy model
- audit logging approach
- AI integration approach