# Revenue Forecast (Draft)

**Prepared:** 2026-03-12  
**Product:** Handyman (Lagos, Nigeria)  
**Pricing model (current):** Platform fee = **5% paid by customer + 5% deducted from handyman payout** = **10% take rate** on Service Fee.

## 1) Inputs (provided)
- Completed orders per month (Scenario A): **1,000**
- Average service fee: **₦5,000**
- Handymen activity (Scenario B): **100 active handymen × 10 orders/week**

## 2) Core formulas
- Revenue per completed order = `avg_service_fee × take_rate`
  - = `₦5,000 × 10%` = **₦500**
- Monthly revenue = `completed_orders × ₦500`
- Monthly GMV (gross service fees) = `completed_orders × ₦5,000`

> Note: Forecasts should be based on **completed** orders. If using "orders created/accepted", multiply by completion rate `c`:
> - Revenue = `orders × c × ₦500`

## 3) Scenario A — 1,000 completed orders/month
- Monthly GMV = `1,000 × ₦5,000` = **₦5,000,000**
- Monthly revenue = `1,000 × ₦500` = **₦500,000**
- Annual GMV = **₦60,000,000**
- Annual revenue = **₦6,000,000**

## 4) Scenario B — 100 active handymen × 10 orders/week
Assuming the 100 handymen are **active** and each completes 10 orders per week:
- Weekly orders = `100 × 10` = **1,000/week**
- Monthly orders ≈ `1,000 × 4.33` = **4,330/month**
- Monthly GMV ≈ `4,330 × ₦5,000` = **₦21,650,000**
- Monthly revenue ≈ `4,330 × ₦500` = **₦2,165,000**
- Annual GMV ≈ **₦259,800,000**
- Annual revenue ≈ **₦25,980,000**

## 5) Completion rate sensitivity (quick view)
If the above order volumes are **created/accepted** orders rather than completed, apply completion rate `c`:
- At **70%** completion:
  - Scenario A revenue: `1,000 × 70% × ₦500` = **₦350,000/month**
  - Scenario B revenue: `4,330 × 70% × ₦500` ≈ **₦1,515,500/month**

## 6) Notes & assumptions to validate
- "Average service fee" is the **labour/service fee** (materials excluded unless agreed separately).
- Take rate remains at **10%** (5% + 5%) across all categories.
- The model excludes:
  - payment processor fees and partner settlement costs
  - refunds/chargebacks/disputes
  - marketing incentives and onboarding costs

