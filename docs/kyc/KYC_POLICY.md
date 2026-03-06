# KYC / Verification Policy (Draft)

**Effective Date:** [DATE]  
**Scope:** Handymen verification (KYC-lite), customers basic profile

## 1) Purpose
KYC verification increases trust and reduces fraud by confirming that a handyman profile matches a real individual.

## 2) Verification data collected (handymen)
- address (free text + state/LGA/local council selection)
- ID type (e.g., NIN, voter’s card, driver’s license, passport, BVN if supported)
- ID number (validated format where possible)
- ID image
- optional passport photo (if collected)

## 3) Verification status
- "Verified" badge shows only after the required fields are submitted and pass validation checks.
- "Verified" does not guarantee licensing, skill level, background checks, or job outcome.

## 4) Verification checks (minimum)
The platform checks:
- ID image exists and is readable
- ID number format is valid for the selected ID type (e.g., NIN 11 digits; voter’s card 19 digits in your current flow)
- data is not already used by another account (when enforced)
- selfie/passport photo matches ID image (if/when implemented)

## 5) Re-verification
The platform can request updated documents:
- periodically (e.g., yearly)
- after fraud reports
- after suspicious activity

## 6) Enforcement
Accounts with suspicious or forged documents can be restricted or terminated.

