# Handyman — Engagement + Revenue Projections (4 Months) (Draft)

**Prepared:** 2026-03-19  
**Launch:** April 2026 (Lagos, Nigeria)  
**Commercial model:** Platform fee = **5% customer + 5% handyman** (10% take rate on Service Fee for completed jobs)

This document provides a spreadsheet-ready engagement projection model for the next 4 months, and shows how the same engagement numbers translate into **GMV** and **platform revenue**.

## 1) Inputs (from you)
- Month 1 customer signups: **200**
- Handymen onboarded: **10/week**
- Jobs per active handyman per week: **4**
- B2B jobs per business account per month: **20**
- Horizon: **4 months**

## 2) Inputs you should confirm (put your current numbers in the tracker)
These values drive the forecast strongly. The tracker includes them as editable cells:
- Wallet funded rate (customer signups that fund wallet): **[set to current]**
- Customer orders per funded customer per month: default **1.2**
- Acceptance rate (orders created → accepted): default **0.75**
- Completion rate (accepted → completed): default **0.70**
- Verified rate for new handymen: default **0.70**
- Active rate among verified handymen: default **0.60**
- Average service fee (NGN): **[set to current]**
- Signup month-on-month growth: default **0.30**
- B2B completion rate: default **0.80**
- B2B accounts starting month 1 and monthly adds: defaults **2** and **+2/month**
- Monthly growth spend (for net view): **₦800,000**

## 3) Engagement funnel logic (Customer)
For each month:
- Wallet funded customers = `Signups × WalletFundedRate`
- Orders created = `WalletFundedCustomers × OrdersPerFundedCustomer`
- Orders accepted = `OrdersCreated × AcceptanceRate`
- Orders completed (customer) = `OrdersAccepted × CompletionRate`

## 4) Engagement logic (Handyman supply capacity)
We model supply capacity as:
- New handymen per month = `HandymenPerWeek × WeeksPerMonth`
- Cumulative onboarded handymen = sum of monthly new handymen
- Active handymen = `CumulativeOnboarded × VerifiedRate × ActiveRate`
- Monthly capacity (completed) = `ActiveHandymen × JobsPerActiveHandymanPerWeek × WeeksPerMonth`

## 5) B2B volume logic
- B2B orders created = `B2BAccounts × JobsPerAccountPerMonth`
- B2B completed = `B2BOrdersCreated × B2BCompletionRate`

## 6) Demand vs supply
Final completed orders should be **min(demand completed, supply capacity)**:
- Demand completed = `CustomerCompleted + B2BCompleted`
- Final completed = `MIN(DemandCompleted, SupplyCapacityCompleted)`

## 7) Revenue logic
Using take rate `t = 10%`:
- GMV = `FinalCompleted × AvgServiceFee`
- Platform revenue = `GMV × t`
- Revenue per completed order = `AvgServiceFee × 10%`

## 8) Spreadsheet tracker
Use:
- `docs/finance/ENGAGEMENT_REVENUE_TRACKER.csv`
- (Optional automated output) `docs/finance/ENGAGEMENT_REVENUE_TRACKER_OUTPUT.csv` (generated from JSON inputs)

How to use:
1) Open the CSV in Excel/Google Sheets.
2) Fill in the two critical unknowns:
   - Wallet funded rate
   - Average service fee
3) (Optional) adjust growth rate, acceptance, completion, verification, and active rates.
4) The monthly engagement and revenue cells update automatically via formulas.

Notes:
- This model is intentionally simple and is designed to be credible for investor conversations.
- Once you have real April data, replace assumptions with actuals and forecast May–July.

To regenerate the automated output CSV:
- `node tools/engagement-revenue-tracker/generate.mjs --in tools/engagement-revenue-tracker/inputs.example.json --out docs/finance/ENGAGEMENT_REVENUE_TRACKER_OUTPUT.csv`

## 9) How the app makes money (revenue)
Your platform revenue comes from the **platform fee/take rate** on completed jobs:
- Platform fee = **5% paid by the customer + 5% deducted from the handyman payout** = **10% take rate**
- Revenue per completed job = `AvgServiceFee × 10%`

Important:
- **Wallet top-ups are not revenue** (they are customer funds held for future payments). Revenue is recognized when a job completes and fees are charged/settled.

## 10) Example outputs (using the tracker defaults)
These are illustrative results using the default tracker assumptions (wallet-funded rate `35%`, avg service fee `₦5,000`, signup growth `30% MoM`, B2B accounts start `2` and add `+2/month`). Replace with your real “current” metrics in the tracker.

Month-by-month (rounded):
- Apr: ~**76** completed jobs → GMV ~**₦380,500** → platform revenue ~**₦38,050**
- May: ~**121** completed jobs → GMV ~**₦606,650** → platform revenue ~**₦60,665**
- Jun: ~**171** completed jobs → GMV ~**₦852,645** → platform revenue ~**₦85,265**
- Jul: ~**225** completed jobs → GMV ~**₦1,124,439** → platform revenue ~**₦112,444**

In the above example, supply capacity is not the bottleneck (you onboard enough handymen). If your acceptance/completion rates fall, or if wallet funding is low, demand will underperform; if you onboard fewer handymen, supply can cap growth.
