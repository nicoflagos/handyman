# Handyman — CAC vs Burn Rate (Fixed + Ops Budgets) (Draft)

**Prepared:** 2026-03-20  
**Launch:** April 2026 (Lagos, Nigeria)  
**Revenue model:** Platform fee = **5% customer + 5% handyman** (10% take rate) on **completed** jobs.

This document explains how to think about **Customer Acquisition Cost (CAC)** alongside your **burn rate**, separating **fixed budgets** (run the platform) from **ops/growth budgets** (acquire + onboard + support).

## 1) Key definitions (use these consistently)

### 1.1 Burn rate
Burn rate is your spend per month.
- **Gross burn** = fixed monthly costs + ops/growth monthly costs
- **Net burn** = gross burn − platform revenue

### 1.2 Fixed budget vs ops budget
- **Fixed budget (run-rate):** Infrastructure + tools + compliance services that exist even if orders are zero (hosting, storage, email, ID verification vendor, etc.).
- **Ops/Growth budget:** Spend that scales with launch activity (customer acquisition, handyman onboarding, support, field operations, B2B outreach).

### 1.3 CAC (multiple ways to compute)
CAC must match the stage you’re measuring:
- **CAC (signup):** `marketing_spend / new_signups`
- **CAC (funded):** `marketing_spend / new_wallet_funded_customers`
- **CAC (first completed order):** `marketing_spend / new_customers_with_first_completed_order`

Investor-friendly: “CAC (first completed order)” is the most meaningful because it connects to revenue.

## 2) Why CAC must be compared to contribution margin (not GMV)
Your wallet top-ups are **not revenue**. The platform earns revenue when jobs **complete** and fees are charged/settled.

Contribution per completed order (simplified):
- `Revenue_per_order = AvgServiceFee × TakeRate`
- With 10% take rate: `Revenue_per_order = AvgServiceFee × 0.10`

Contribution per customer per month:
- `Contribution_per_customer = CompletedOrdersPerCustomer × AvgServiceFee × TakeRate`

**Payback period (months):**
- `CAC / Contribution_per_customer`

## 3) Practical view for your business (what moves the numbers)
To reduce CAC and/or improve payback, you have three levers:
1) **Lower CAC** (better targeting, referrals, conversion improvements, partnerships)
2) **Increase orders per funded customer** (retention + repeat flows like “Rebook”, bundles, trust messaging)
3) **Increase average service fee** (category mix, price guidance; avoid pushing fees unrealistically low)

## 4) Budget structure (how to present to investors)
Recommend showing budget in 3 layers:
1) **Fixed run-rate** (monthly)
2) **Ops/Growth** (monthly, for the launch window)
3) **One-time setup** (bank/payments/escrow partner onboarding, legal, etc.)

Then compute:
- **Gross monthly burn** = Fixed + Ops/Growth
- **Net monthly burn** = Gross burn − Revenue
- **CAC metrics** under the same monthly period

## 5) Excel tracker
Use the tracker CSV (Excel-friendly) to calculate:
- Fixed monthly run-rate from annual fixed budgets
- Ops/growth burn per month
- CAC (signup / funded / first completed order)
- Net burn and runway

File:
- `docs/finance/CAC_BURN_TRACKER.csv`
- (Optional automated output) `docs/finance/CAC_BURN_TRACKER_OUTPUT.csv` (generated from JSON inputs)

How to use (minimum):
1) Set your fixed annual budgets (or monthly equivalents).
2) Set ops/growth budget per month (your launch burn).
3) Enter actual signups / funded / completed numbers each month (or use assumptions).
4) Read CAC + payback + net burn.

To regenerate the automated output CSV:
- `node tools/cac-burn-tracker/generate.mjs --in tools/cac-burn-tracker/inputs.example.json --out docs/finance/CAC_BURN_TRACKER_OUTPUT.csv`
