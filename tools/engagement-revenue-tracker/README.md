# Engagement + Revenue Tracker Generator

This generates a 4‑month engagement + revenue projection CSV from an inputs JSON file.

Why: The spreadsheet tracker (`docs/finance/ENGAGEMENT_REVENUE_TRACKER.csv`) uses formulas. This generator produces a second CSV with **pre-calculated numbers** that you can share quickly (investors, partners) without worrying about Excel formula references.

## Run
From repo root:

```powershell
node tools/engagement-revenue-tracker/generate.mjs `
  --in tools/engagement-revenue-tracker/inputs.example.json `
  --out docs/finance/ENGAGEMENT_REVENUE_TRACKER_OUTPUT.csv
```

## Inputs
Edit `tools/engagement-revenue-tracker/inputs.example.json` (or copy to your own file) and set:
- `walletFundedRate` to your **current** wallet funded conversion
- `avgServiceFeeNgn` to your current average service fee

