# ADR-003: Foundation Schema Strategy

## Status
Accepted

## Context
The QMS Platform requires a relational schema that supports tenant-aware data ownership, program scoping, user identity, future RBAC, and auditability. Later modules such as document control, NCRs, CAPAs, and traceability will depend on these core entities.

## Decision
The initial schema implementation will begin with the following foundation tables:
- tenants
- programs
- users
- roles
- user_role_assignments
- user_program_assignments

The schema will use:
- PostgreSQL
- UUID primary keys
- timezone-aware timestamps
- SQLAlchemy 2.x ORM models
- Alembic migrations

## Rationale
This approach was selected because it:
- establishes tenant and program scoping before dependent modules are added
- supports future RBAC without over-implementing it in the MVP
- creates a stable base for document, NCR, CAPA, and audit features
- aligns with PostgreSQL best practices for modern application schemas

## Consequences
### Positive
- strong relational foundation
- clearer future ownership and access boundaries
- easier expansion into later modules
- clean migration history from the beginning

### Negative
- requires up-front schema discipline
- later modules must respect the established tenant/program/user structure