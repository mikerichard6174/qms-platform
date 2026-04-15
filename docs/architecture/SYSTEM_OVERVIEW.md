# System Overview

## Overview
The QMS Platform is a web-hosted modular business application designed to support controlled document management, standards traceability, NCR handling, CAPA workflows, and leadership dashboards across multiple programs.

The system is designed for initial deployment on a single Linux VM using Docker, with future portability to AWS and Kubernetes/EKS.

## Architecture Style
The platform will be built as a modular monolith:
- one frontend application
- one backend API application
- one primary relational database
- one file/object storage mechanism

This approach provides fast development, simplified operations, and strong maintainability while preserving clear internal boundaries for future scaling.

## High-Level Components

### Frontend
A web frontend built with Next.js and TypeScript.  
Responsibilities:
- user interface
- forms and tables
- dashboards and visualizations
- navigation
- API consumption

### Backend
A FastAPI backend serving as the system of record for:
- business logic
- workflow rules
- validation
- automation
- audit/event generation
- reporting aggregation

### Database
PostgreSQL will store:
- structured business records
- workflow state
- relationships
- audit events
- reporting data

### File Storage
A shared file storage layer will store:
- document binaries
- record attachments
- future generated exports

File metadata will be stored in PostgreSQL, while the file content itself will be stored outside the relational database.

## Cross-Cutting Concerns
The following concerns apply across all modules:
- authentication
- authorization / RBAC
- audit/event logging
- attachment/file handling
- validation
- observability
- future notifications
- future background jobs

## Deployment Direction
Initial deployment target:
- single Linux VM
- Docker-based packaging
- local or AWS-hosted operation

Future deployment target:
- Kubernetes / EKS

## Future Extensibility
The system is intentionally designed to support:
- additional standards libraries
- additional QMS modules
- enterprise authentication
- API-based AI features
- multi-tenant expansion