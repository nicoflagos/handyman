# Incident Response Plan (Draft)

**Effective Date:** [DATE]

## 1) Purpose
Define how Handyman responds to security incidents (unauthorized access, data leak, fraud, service outage).

## 2) Roles
- Incident Commander: [NAME/ROLE]
- Engineering Lead: [NAME/ROLE]
- Compliance/Legal: [NAME/ROLE]
- Communications: [NAME/ROLE]

## 3) Severity levels
- Sev 1: confirmed data exposure, active exploitation, payment compromise
- Sev 2: partial service outage, suspected account takeover
- Sev 3: minor bug, low-risk vulnerability

## 4) Response steps
1) Detect and triage (log evidence)
2) Contain (disable affected endpoints/tokens/accounts)
3) Eradicate (patch, rotate keys, fix root cause)
4) Recover (restore services, validate)
5) Post-incident review (timeline, impact, actions, follow-ups)

## 5) Evidence retention
Preserve relevant logs and DB snapshots for [X days] for investigation.

