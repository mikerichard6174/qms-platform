import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.document import Document
from app.models.document_approval import DocumentApproval
from app.models.document_revision import DocumentRevision
from app.models.tenant import Tenant
from app.models.user import User


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def get_or_create_tenant(db):
    existing = db.scalar(select(Tenant).where(Tenant.slug == "example-company"))
    if existing:
        return existing

    tenant = Tenant(
        id=uuid.uuid4(),
        name="Example Company",
        slug="example-company",
        status="active",
        primary_contact_name="Mike Richard",
        primary_contact_email="mike@example.com",
        settings_json={},
        created_at=utc_now(),
        updated_at=utc_now(),
    )

    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    return tenant


def get_or_create_user(db, tenant_id, email, full_name):
    existing = db.scalar(
        select(User).where(
            User.tenant_id == tenant_id,
            User.email == email,
        )
    )
    if existing:
        return existing

    user = User(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        email=email,
        full_name=full_name,
        is_active=True,
        auth_provider=None,
        external_subject_id=None,
        created_at=utc_now(),
        updated_at=utc_now(),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def get_or_create_document(db, tenant_id, created_by_user_id):
    existing = db.scalar(
        select(Document).where(
            Document.tenant_id == tenant_id,
            Document.document_number == "QMS-DEV-001",
        )
    )
    if existing:
        return existing

    document = Document(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        program_id=None,
        document_number="QMS-DEV-001",
        title="Development Quality Manual",
        document_type="manual",
        owner_user_id=created_by_user_id,
        current_revision_id=None,
        status="draft",
        is_controlled=True,
        review_due_date=None,
        metadata_json={"seeded": True},
        created_by_user_id=created_by_user_id,
        updated_by_user_id=created_by_user_id,
        created_at=utc_now(),
        updated_at=utc_now(),
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document


def get_or_create_revision(db, document_id, tenant_id, created_by_user_id):
    existing = db.scalar(
        select(DocumentRevision).where(
            DocumentRevision.document_id == document_id,
            DocumentRevision.revision_label == "A",
        )
    )
    if existing:
        return existing

    revision = DocumentRevision(
        id=uuid.uuid4(),
        document_id=document_id,
        tenant_id=tenant_id,
        revision_label="A",
        revision_number=1,
        change_summary="Initial seeded revision for development testing.",
        file_id=None,
        status="draft",
        is_current=False,
        is_effective=False,
        effective_date=None,
        obsolete_date=None,
        submitted_for_approval_at=None,
        approved_at=None,
        approved_by_user_id=None,
        created_by_user_id=created_by_user_id,
        updated_by_user_id=created_by_user_id,
        created_at=utc_now(),
        updated_at=utc_now(),
    )

    db.add(revision)
    db.commit()
    db.refresh(revision)

    return revision


def get_or_create_approval(db, revision_id, tenant_id, approver_user_id):
    existing = db.scalar(
        select(DocumentApproval).where(
            DocumentApproval.document_revision_id == revision_id,
            DocumentApproval.approver_user_id == approver_user_id,
        )
    )
    if existing:
        return existing

    approval = DocumentApproval(
        id=uuid.uuid4(),
        document_revision_id=revision_id,
        tenant_id=tenant_id,
        approver_user_id=approver_user_id,
        approval_type="approval",
        status="pending",
        comment="Seeded approval record for development testing.",
        acted_at=None,
        created_at=utc_now(),
        updated_at=utc_now(),
    )

    db.add(approval)
    db.commit()
    db.refresh(approval)

    return approval


def main() -> None:
    db = SessionLocal()

    try:
        tenant = get_or_create_tenant(db)

        creator = get_or_create_user(
            db=db,
            tenant_id=tenant.id,
            email="creator@example.com",
            full_name="Creator User",
        )

        approver = get_or_create_user(
            db=db,
            tenant_id=tenant.id,
            email="approver@example.com",
            full_name="Approver User",
        )

        document = get_or_create_document(
            db=db,
            tenant_id=tenant.id,
            created_by_user_id=creator.id,
        )

        revision = get_or_create_revision(
            db=db,
            document_id=document.id,
            tenant_id=tenant.id,
            created_by_user_id=creator.id,
        )

        approval = get_or_create_approval(
            db=db,
            revision_id=revision.id,
            tenant_id=tenant.id,
            approver_user_id=approver.id,
        )

        print("Development seed data ready.")
        print(f"Tenant:   {tenant.id} | {tenant.name}")
        print(f"Creator:  {creator.id} | {creator.email}")
        print(f"Approver: {approver.id} | {approver.email}")
        print(f"Document: {document.id} | {document.document_number}")
        print(f"Revision: {revision.id} | Rev {revision.revision_label}")
        print(f"Approval: {approval.id} | {approval.status}")

    finally:
        db.close()


if __name__ == "__main__":
    main()