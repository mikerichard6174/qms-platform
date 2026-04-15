# Data Model

## Overview
The QMS Platform uses PostgreSQL as the system of record for structured business data, workflow state, traceability links, audit events, and file metadata.

The schema is designed to support:
- tenant/company separation
- multiple programs
- controlled document revision history
- standards traceability
- NCR and CAPA workflows
- dashboard/reporting queries
- future RBAC
- future extensibility

## Design Principles
- relational tables are preferred for core business entities and workflow state
- file metadata is stored in the database, while file contents are stored externally
- major business records include timestamps and actor references
- tenant-aware design is present from day one
- program scoping is included where operationally useful
- JSONB is reserved for flexible metadata and audit snapshots

## Core Tables

### Organization and Access Foundation
- tenants
- programs
- users
- roles
- user_role_assignments
- user_program_assignments

### Document Control
- documents
- document_revisions
- document_approvals

### Standards and Traceability
- standards
- standard_clauses
- trace_links

### NCR / CAPA
- ncrs
- capa_records
- capa_actions
- capa_verifications

### Shared File Support
- files
- attachments

### Auditability
- audit_events

## Core Relationships
- a tenant has many programs, users, documents, NCRs, and CAPAs
- a program belongs to one tenant and may scope documents, NCRs, and CAPAs
- a document has many revisions
- a document revision may have many approvals
- a standard has many clauses
- a clause may link to many records through trace_links
- an NCR may be linked to one CAPA
- a CAPA may contain many actions and one or more verification records
- a file may be associated to records through attachments

## Major Table Summaries

### tenants
Represents a company/customer using the platform.

### programs
Represents a program, contract, business unit, or mission area within a tenant.

### users
Represents user identities and future authentication integration points.

### roles
Represents role definitions for future RBAC.

### user_role_assignments
Maps users to roles at tenant or program scope.

### user_program_assignments
Maps users to program associations.

### documents
Represents the master identity of a controlled document.

Key fields:
- tenant_id
- program_id
- document_number
- title
- document_type
- owner_user_id
- current_revision_id
- status

### document_revisions
Represents revision-specific state and file references.

Key fields:
- document_id
- revision_label
- file_id
- status
- is_current
- is_effective
- effective_date
- approved_by_user_id

### document_approvals
Tracks review and approval events for document revisions.

### standards
Represents supported standards such as ISO 9001 and AS9100.

### standard_clauses
Represents clauses within a standard and supports parent-child hierarchy.

### trace_links
Represents explicit traceability links between clauses and supporting records.

Key fields:
- standard_clause_id
- linked_entity_type
- linked_entity_id
- link_type

### ncrs
Represents nonconformance records.

Key fields:
- ncr_number
- severity
- status
- date_identified
- owner_user_id
- requires_capa
- linked_capa_id

### capa_records
Represents CAPA master records.

Key fields:
- capa_number
- source_ncr_id
- status
- owner_user_id
- target_completion_date
- effectiveness_due_date

### capa_actions
Represents individual action items associated to a CAPA.

### capa_verifications
Represents effectiveness review and verification outcomes for a CAPA.

### files
Represents stored file objects and storage metadata.

### attachments
Represents associations between files and business records.

### audit_events
Represents centralized audit trail entries for major actions and state changes.

## Status Strategy
Status fields are stored as strings in the MVP and enforced through application-layer constants and workflow logic.

### Document Revision Statuses
- draft
- in_review
- approved
- effective
- obsolete
- rejected

### NCR Statuses
- open
- under_review
- containment_complete
- dispositioned
- escalated_to_capa
- closed

### CAPA Statuses
- draft
- approved
- in_progress
- effectiveness_review
- closed

### CAPA Action Statuses
- open
- in_progress
- completed
- cancelled

## Identifier Strategy
Each major record uses:
- UUID primary key for internal identity
- human-readable business number for external reference where needed

Examples:
- document_number
- ncr_number
- capa_number

## File Strategy
Files are stored outside PostgreSQL. The database stores file metadata and record associations.

## Audit Strategy
Audit events are recorded in a centralized table and may include old/new value snapshots in JSONB.

## Implementation Phase Notes
The first implemented schema phase includes:
- tenants
- programs
- users
- roles
- user_role_assignments
- user_program_assignments

These tables form the foundation for later document, standards, NCR, CAPA, file, and audit modules.

## Implementation Phase Notes - Document Control
The second implemented schema phase includes:
- documents
- document_revisions
- document_approvals

This phase establishes the first core QMS business module and separates document identity from revision-specific history and approval activity.

tenants
  └── programs
  └── users
  └── roles
        └── user_role_assignments
  └── documents
        └── document_revisions
              └── document_approvals
  └── ncrs
        └── capa_records
              └── capa_actions
              └── capa_verifications
  └── files
        └── attachments
  └── audit_events

standards
  └── standard_clauses
        └── trace_links -> documents / ncrs / capa_records
