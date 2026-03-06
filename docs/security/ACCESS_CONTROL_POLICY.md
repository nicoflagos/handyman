# Access Control Policy (Draft)

**Effective Date:** [DATE]

## 1) Purpose
Restrict access to sensitive data (ID images, wallet records, admin tools).

## 2) Roles
- Customer: own profile, orders, transactions
- Handyman: own profile, assigned orders, transactions
- Admin: operational access for support, verification, fraud, reporting

## 3) Sensitive data access rules
Only Admin users with assigned responsibilities can access:
- ID images and ID numbers
- payout/settlement reports
- fraud investigation data

## 4) Technical controls
- strong authentication for admin accounts
- least-privilege permissions
- audit logging on admin actions

## 5) Operational controls
- revoke access immediately on role change/offboarding
- periodic access reviews (monthly/quarterly)

