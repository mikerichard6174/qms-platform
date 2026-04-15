# Module Boundaries

## Architectural Principle
The QMS Platform will be implemented as a modular monolith with clearly defined module ownership. Each module owns its own business logic, validation rules, persistence logic, and API endpoints.

Cross-module interaction should occur through service boundaries, not by tightly coupling unrelated modules.

## Core Modules

### 1. Tenant & Program Management
Owns:
- tenant/company records
- program records
- program-level scoping foundation

### 2. User & Access Foundation
Owns:
- user records
- role concepts
- future RBAC foundations
- actor context for auditing

### 3. Document Control
Owns:
- controlled document records
- document revisions
- document approvals
- effective/obsolete document state
- document metadata
- document file references

Interacts with:
- Attachment & File Management
- Standards & Traceability
- Audit/Event Logging

### 4. Standards & Traceability
Owns:
- standards catalog
- clause library
- links between clauses and supporting records
- future clause coverage reporting

Interacts with:
- Document Control
- NCR Management
- CAPA Management
- Audit/Event Logging

### 5. NCR Management
Owns:
- nonconformance records
- NCR state transitions
- containment/disposition data
- NCR categorization and severity
- NCR-to-program relationships

Interacts with:
- Standards & Traceability
- Attachment & File Management
- CAPA Management
- Audit/Event Logging

### 6. CAPA Management
Owns:
- CAPA records
- CAPA actions
- effectiveness verification
- CAPA lifecycle state
- relationships to source NCRs

Interacts with:
- NCR Management
- Standards & Traceability
- Attachment & File Management
- Audit/Event Logging

### 7. Dashboard & Reporting
Owns:
- KPI summary views
- dashboard aggregation services
- leadership-level reporting data

Reads from:
- Document Control
- Standards & Traceability
- NCR Management
- CAPA Management
- Program records

### 8. Attachment & File Management
Owns:
- file metadata
- storage abstraction
- attachment associations
- upload/download coordination

Serves:
- Document Control
- NCR Management
- CAPA Management
- future modules

### 9. Audit/Event Logging
Owns:
- record activity events
- status transition history
- actor/action tracking
- entity change history

Receives events from:
- all business modules

## Layering Rules

### Frontend Responsibilities
- UI rendering
- forms
- navigation
- dashboard visualization
- calling backend APIs
- client-side UX validation

### Backend Responsibilities
- all business rules
- all workflow transitions
- persistence
- audit generation
- automation
- reporting aggregation
- permission enforcement

## Boundary Rules
- Business rules must live in the backend.
- Workflow transitions must be validated in the backend.
- Modules should interact through service boundaries.
- Attachment handling should use a shared file service.
- Audit events should be generated through a centralized audit service.
- Dashboard metrics should be produced by backend aggregation endpoints, not client-side calculations.

## Future Integration Boundaries
Future integrations should be isolated behind dedicated integration layers:
- auth provider integration
- AI provider integration
- storage provider integration
- notification provider integration