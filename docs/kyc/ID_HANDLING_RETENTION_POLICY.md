# ID Handling & Retention Policy (Draft)

**Effective Date:** [DATE]

## 1) Purpose
This policy controls how the platform stores, accesses, and retains sensitive ID information and images.

## 2) Storage
- The platform stores ID images in approved storage (e.g., Cloudinary) with access restricted to authorized admin roles.
- The platform stores metadata (ID type/number, verification status, timestamps) in the database.

## 3) Access control
Only admins with a legitimate job function (verification review, fraud investigation, legal requests) can access ID images.
See `docs/security/ACCESS_CONTROL_POLICY.md`.

## 4) Retention
Define retention targets (finalize with counsel/partner):
- ID images: retain for [X months/years] after account closure unless legally required longer
- wallet/transaction records: retain for [X years] for audit and reconciliation
- dispute evidence: retain for [X months] after dispute closure

## 5) Deletion
When retention ends and no legal hold exists, the platform deletes ID images and records the deletion event.

## 6) User requests
Users can request deletion subject to legal/operational retention needs. The platform explains what can and cannot be deleted.

