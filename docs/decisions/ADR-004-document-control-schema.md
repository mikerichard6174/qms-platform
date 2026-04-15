# ADR-004: Document Control Schema Strategy

## Status
Accepted

## Context
The QMS Platform requires a controlled document management structure that preserves document identity, revision history, and approval activity. A QMS must support traceable revisions and prevent the loss of historical document context when updates occur.

## Decision
Document Control will be implemented using three core tables:
- documents
- document_revisions
- document_approvals

The design separates the master document identity from revision-specific records.

## Rationale
This approach was selected because it:
- preserves a stable document identity across revisions
- supports historical revision tracking
- supports future approval workflows
- enables one document to have many revisions
- aligns with controlled document best practices in quality systems

## Key Design Notes
- `documents` represents the enduring document identity
- `document_revisions` represents version-specific state and content metadata
- `document_approvals` represents review and approval activity for revisions
- document number uniqueness is enforced per tenant
- the active/current revision is tracked separately from historical revisions

## Consequences
### Positive
- strong auditability of revision history
- clean future workflow support
- easier reporting on current vs historical versions
- better alignment with controlled QMS document practices

### Negative
- schema and workflow are more complex than storing everything in one table
- care is required when handling circular references between document master and revisions