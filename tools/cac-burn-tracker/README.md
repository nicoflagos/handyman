# CAC + Burn Tracker Generator

This generator produces a **numbers-only** CAC + burn CSV for 4 months from a JSON inputs file.

Use it when you want to share projections without Excel formulas.

## Run
From repo root:

```powershell
node tools/cac-burn-tracker/generate.mjs `
  --in tools/cac-burn-tracker/inputs.example.json `
  --out docs/finance/CAC_BURN_TRACKER_OUTPUT.csv
```

## Inputs
Edit `tools/cac-burn-tracker/inputs.example.json`.

The minimum fields to update are:
- `walletFundedRate` (your current funded conversion)
- `avgServiceFeeNgn` (your current average service fee)
- `marketingSpendMonthlyNgn` (the spend used for CAC)

