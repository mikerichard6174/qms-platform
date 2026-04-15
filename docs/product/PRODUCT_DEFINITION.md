# QMS Platform - Step 1 Product Definition

## Product Summary
A configurable web-based Quality Management System for small-to-mid-sized organizations that need controlled document management, standards traceability, NCR management, CAPA workflows, and leadership dashboards across multiple programs, with future expansion into audits, training, monthly reporting, and additional standards frameworks.

## Deployment Direction
- Web-hosted application
- First deployment on a single Linux VM
- Docker-based packaging
- Future portability to AWS and Kubernetes/EKS

## MVP Modules
- Document Control
- Standards Traceability
- NCR Management
- CAPA Management
- Dashboard/Metrics
- Program-aware data segmentation
- Audit/event logging foundation

## Non-MVP Modules
- Audit management
- Training/competency
- Supplier quality
- Monthly reporting engine
- AI features
- Mobile app
- Workflow builder
- Advanced SSO in v1

## Primary Users
- QMS Admin
- Quality Manager
- Quality Analyst / QMA Staff
- Program Lead
- Executive Viewer

## Core Records
- Tenant
- Program
- User
- Role
- Document
- Document Revision
- Document Approval
- Standard
- Standard Clause
- Trace Link
- NCR
- CAPA
- CAPA Action
- Attachment
- Audit Event

## Key Business Rules
- Only one effective revision of a controlled document at a time
- Documents maintain revision history
- Clauses may link to multiple supporting records
- NCRs may trigger CAPA automatically
- CAPAs must preserve relationship to source NCR
- Dashboard data must be filterable by program

## MVP Success Criteria
1. Controlled documents can be created, revised, approved, and made effective
2. ISO 9001 and AS9100 clauses can be traced to documents
3. NCRs can be created, managed, and closed
4. CAPAs can be created manually or auto-generated from NCRs
5. CAPA actions and effectiveness checks can be tracked
6. Dashboard shows operational quality metrics by program
7. Historical record and event logging foundation exists
8. Application runs in Docker on a single Linux VM