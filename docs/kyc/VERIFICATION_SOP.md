# Verification Procedure SOP (Draft)

**Effective Date:** [DATE]  
**Owner:** Operations / Compliance

## 1) Inputs
Handyman submits:
- address
- ID type
- ID number
- ID image

## 2) Automated checks
System validates:
- required fields are present
- ID number format matches ID type
- ID number and address are not already in use by another account (where enforced)
- image upload is successful and accessible

## 3) Manual review (recommended for launch)
Reviewer checks:
- ID image clarity and completeness
- ID name matches profile name (where visible)
- ID number plausibility (length/format)
- signs of forgery or screenshot edits

## 4) Decision outcomes
- Approve: mark verified, set `verifiedAt`
- Reject: mark unverified and store reason code (e.g., "blurry_image", "mismatch_name", "invalid_number")
- Escalate: send to senior reviewer for suspicious cases

## 5) SLA targets
- Acknowledge submission: within [X hours]
- Decision time: within [X business days]

## 6) Audit log
Record:
- reviewer identity
- timestamps
- reason code and notes (no unnecessary sensitive data)

