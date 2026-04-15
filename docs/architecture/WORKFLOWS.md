# Workflows

## Overview
The QMS Platform uses backend-enforced workflow and lifecycle rules to control the state of major business records. Status fields are not freeform and may only change through allowed transitions validated by workflow logic.

## Workflow Principles
- status transitions are controlled backend actions
- workflow rules are enforced in backend service/workflow layers
- important transitions create audit events
- effective/closed records become more restricted
- frontend clients may request transitions, but may not enforce them authoritatively

---

## Document Workflow

### Document Master Statuses
- draft
- active
- obsolete

### Document Revision Statuses
- draft
- in_review
- approved
- effective
- obsolete
- rejected

### Allowed Revision Transitions
- draft -> in_review
- draft -> obsolete
- in_review -> approved
- in_review -> rejected
- in_review -> draft
- approved -> effective
- approved -> draft
- effective -> obsolete
- rejected -> draft

### Workflow Rules
- only one revision per document may be effective at a time
- when a new revision becomes effective, the previously effective revision becomes obsolete
- effective revisions are locked from ordinary editing
- changes to effective documents should result in a new revision, not mutation of the effective revision

### Transition Requirements
#### draft -> in_review
Requires:
- file or equivalent content present
- change summary present
- owner assigned
- approver(s) assigned

#### in_review -> approved
Requires:
- required approval actions completed

#### approved -> effective
Requires:
- approved timestamp
- approver recorded
- effective date set or defaulted

#### effective -> obsolete
Requires:
- obsolescence reason or replacement context

---

## Document Approval Workflow

### Approval Statuses
- pending
- approved
- rejected

### Approval Types
- review
- approval

### Rules
- document approvals are tied to document revisions
- all required approvers must approve before the revision may become approved
- if a required approver rejects, the revision becomes rejected or is returned for rework

---

## Standards Traceability Workflow

### Trace Link Actions
- create
- update
- remove/deactivate

### Rules
- a trace link connects one standard clause to one linked entity
- linked entity types may include document, ncr, and capa
- trace links are maintained explicitly, not inferred automatically
- trace link changes create audit events

---

## NCR Workflow

### NCR Statuses
- open
- under_review
- containment_complete
- dispositioned
- escalated_to_capa
- closed

### Allowed NCR Transitions
- open -> under_review
- open -> closed
- under_review -> containment_complete
- under_review -> dispositioned
- under_review -> escalated_to_capa
- under_review -> closed
- containment_complete -> dispositioned
- containment_complete -> escalated_to_capa
- containment_complete -> closed
- dispositioned -> escalated_to_capa
- dispositioned -> closed
- escalated_to_capa -> closed

### Transition Requirements
#### open -> under_review
Requires:
- owner assigned

#### under_review -> containment_complete
Requires:
- containment action documented

#### containment_complete -> dispositioned
Requires:
- disposition documented

#### any state -> escalated_to_capa
Requires:
- escalation rationale
- requires_capa = true
- linked CAPA created by backend workflow

#### any eligible state -> closed
Requires:
- closure rationale or adequate disposition documented
- if CAPA is required, linked CAPA exists

### Rules
- once an NCR is escalated to CAPA, the NCR/CAPA relationship must be preserved
- closed NCRs become read-only except for controlled administrative updates

---

## CAPA Workflow

### CAPA Statuses
- draft
- approved
- in_progress
- effectiveness_review
- closed

### Allowed CAPA Transitions
- draft -> approved
- draft -> in_progress
- approved -> in_progress
- approved -> draft
- in_progress -> effectiveness_review
- effectiveness_review -> closed
- effectiveness_review -> in_progress

### Transition Requirements
#### draft -> approved
Requires:
- owner assigned
- problem statement present
- planning sufficiently defined

#### approved -> in_progress
Requires:
- at least one CAPA action exists
- owner assigned

#### in_progress -> effectiveness_review
Requires:
- required CAPA actions completed

#### effectiveness_review -> closed
Requires:
- verification record exists
- outcome supports closure
- verifier recorded
- verification date recorded

#### effectiveness_review -> in_progress
Requires:
- verification outcome indicates ineffective or follow-up needed

### Rules
- CAPAs may be created manually or auto-generated from NCRs
- CAPA closure requires effectiveness verification
- closed CAPAs become read-only except for controlled administrative updates

---

## CAPA Action Workflow

### Action Statuses
- open
- in_progress
- completed
- cancelled

### Allowed Action Transitions
- open -> in_progress
- open -> completed
- open -> cancelled
- in_progress -> completed
- in_progress -> cancelled

### Rules
- CAPA actions support execution tracking within a CAPA
- all required active actions should be completed before CAPA may move to effectiveness review

---

## CAPA Verification Workflow

### Verification Outcomes
- pending
- effective
- ineffective
- needs_followup

### Rules
- CAPA may not close without verification
- ineffective or follow-up outcomes return the CAPA to in_progress

---

## NCR to CAPA Automation

### Rules
- CAPA creation from NCR is a backend workflow responsibility
- the frontend may request escalation, but backend logic creates the CAPA and records the link
- when NCR is escalated to CAPA:
  - requires_capa is set to true
  - CAPA record is created
  - CAPA is linked to NCR
  - audit events are recorded for both entities

### Initial MVP Triggering
Initial CAPA escalation may be triggered by:
- manual decision by quality personnel
- severity threshold rules
- future configuration-based rules

---

## Audit Event Expectations

### Audit events should be recorded for:
- record creation
- record updates
- owner changes
- status transitions
- approvals and rejections
- effective/obsolete transitions
- NCR to CAPA escalation
- CAPA action creation/completion
- verification outcomes
- attachment additions/removals
- trace link creation/update/removal