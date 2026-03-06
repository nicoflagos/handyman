# Wallet + Escrow Flow Description (Partner Pack) - Draft

**Effective Date:** [DATE]  
**Model:** Licensed partner holds funds; platform orchestrates state changes and records ledger events.

## 1) Summary
Handyman supports customer wallet top-ups and job payments. Funds are held in escrow during job execution and released to the handyman upon completion. The platform charges fees on each job.

## 2) Entities
- Customer
- Handyman
- Platform (Handyman)
- Licensed partner (holder of funds; regulated entity)

## 3) Top-up
1) Customer initiates top-up (NGN)  
2) Partner processes payment and confirms success via webhook  
3) Platform credits customer wallet ledger and updates balance

## 4) Job payment (escrow)
Trigger: Handyman starts job (after confirming fee and entering Start Code).
1) Platform requests partner to place funds on hold / debit customer wallet:
   - Service Fee + Customer Platform Fee (5% of Service Fee)
2) Platform records escrow funded timestamp and ledger entry
3) On completion (Completion Code + after-image), platform requests partner to release:
   - Handyman payout = Service Fee - Handyman Platform Fee (5% of Service Fee)
4) Platform records release ledger entries for both parties

## 5) Cancellations
- Before escrow funding: order can be canceled/declined; no hold is placed
- After escrow funding: default outcome is completion release unless partner supports dispute reversal flows

## 6) Reporting needed from partner
- transaction IDs, statuses, timestamps
- settlement batches
- chargeback/refund events

