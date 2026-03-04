# Handyman — Business Requirements Document (BRD)

**Document version:** 1.0  
**Date:** 2026-03-04  
**Product:** Handyman (On‑Demand Service Marketplace)  
**Primary market:** Nigeria (State → LGA → Local Council → Street)  

## 1) Executive Summary
Handyman is a two‑sided marketplace that connects **Customers** who need local services (technicians, artisans, errands) with **Handymen** who can accept and complete jobs. The platform standardizes job requests (service type, schedule, location, service fee), improves trust with verification, codes, job photos, ratings, and enables safer payments using a wallet + escrow-style flow.

## 2) Business Problem
Customers often struggle to find reliable, nearby skilled workers quickly, while service providers struggle to access consistent demand. Traditional discovery is fragmented (word of mouth, social media), leading to:
- inconsistent pricing discussions
- limited accountability (no proof of arrival/work)
- payment risk for both parties
- poor visibility into job progress

## 3) Business Goals & Objectives
### 3.1 Goals
- **Speed:** Enable customers to request help in minutes.
- **Trust:** Build confidence using verification, codes, photos, and ratings.
- **Control:** Provide structured negotiation and confirmation of service fees.
- **Safety:** Reduce payment risk using a wallet and escrow-like holding/release.
- **Engagement:** Use push notifications and status timelines to keep users informed.

### 3.2 Objectives (measurable)
- Reduce median **time-to-accept** for requested jobs.
- Increase **requested → accepted → completed** conversion.
- Maintain high **average ratings** and increase rating coverage.
- Reduce failed starts/completions by enforcing required steps (codes + images).

## 4) Scope
### 4.1 In Scope (current implementation)
- **Roles:** Customer, Handyman, Admin.
- **Auth:** JWT-based authentication.
- **Location:** Nigeria cascading selection (State → LGA → Local Council) + typed street address.
- **Service catalog:** Selectable service categories at booking time.
- **Order lifecycle:** `requested → accepted → arrived → in_progress → completed` (+ `canceled`).
- **Price negotiation flow:** Customer proposes and may edit until handyman confirms.
- **Verification codes:** Separate start and completion codes generated at booking.
- **Images:**
  - Customer uploads up to **2 job photos** during booking.
  - Handyman uploads **before** image at start and **after** image at completion.
  - Handyman work samples displayed as tiles on profile/dashboard.
- **Chat:** In-order text chat (available after acceptance, closes on completion/cancel).
- **Wallet & escrow-style flow:** Customer funds escrow on start; release on completion; transaction history.
- **Push notifications:** Firebase Cloud Messaging (FCM) for order events and chat messages.
- **Storage:** MongoDB for data; Cloudinary for images (with local disk fallback logic).
- **Deployment:** Render-hosted backend and web app.
- **Mobile wrapper:** Android WebView wrapper (loads live web app URL).

### 4.2 Out of Scope (not implemented / future)
- Maps and distance-based matching (GPS, route/ETA).
- Card payments / bank transfers / payouts (outside wallet).
- Dispute resolution and refund workflows.
- Provider scheduling calendar and availability forecasting.
- Admin moderation workflows for ID verification review.

## 5) Key Stakeholders
- **Customers** (demand side)
- **Handymen** (supply side)
- **Admin/Operations** (oversight, support)
- **Product & Business** (strategy, growth, pricing)
- **Engineering** (frontend, backend, infrastructure)

## 6) Personas
### 6.1 Customer
- Needs a skilled worker quickly (repairs, beauty, tailoring, errands).
- Wants visibility into progress (accepted, arrived, started, completed).
- Wants payment safety and proof of work.

### 6.2 Handyman
- Wants consistent job opportunities.
- Needs clear job details and photos before committing.
- Wants predictable payout after completion.

### 6.3 Admin
- Needs visibility into platform health (orders, payouts, failures).
- Requires ability to troubleshoot token/push issues and intervene when needed.

## 7) Business Rules (current)
### 7.1 Booking & Matching
- Only **Customers** create orders.
- Only **Handymen** accept marketplace orders.
- Matching is primarily by **job availability** and **handyman selection** (location is visible and can be used for filtering as a future enhancement).

### 7.2 Location
- Country is fixed to **Nigeria**.
- Orders store: `state`, `lga`, `lc` plus a formatted `address` including street.

### 7.3 Pricing
- Customer proposes the service fee.
- Customer can edit the fee until the handyman confirms it.
- Handyman confirms the service fee before start (locks customer editing).

### 7.4 Order Status & Timeline
- Status sequence:
  1. `requested` (customer created)
  2. `accepted` (handyman accepts)
  3. `arrived` (handyman indicates arrival)
  4. `in_progress` (job started)
  5. `completed` (job finished)
- Cancellation:
  - Customer can cancel only while `requested/accepted/arrived` and before escrow is funded.
  - Handyman can decline only while `accepted/arrived` and before escrow is funded.

### 7.5 Verification & Trust
- Booking produces separate **start code** and **completion code**.
- Handyman must supply correct codes to start/complete (enforced by backend).
- Handyman verification badge becomes true when profile has:
  - address, idType, valid idNumber, and idImage upload.

### 7.6 Payments (wallet + escrow-style)
- Customer wallet is checked at booking time to prevent insufficient balance.
- When the handyman starts the job, the system debits the customer wallet and holds funds (escrow-style).
- On completion, the system releases payout to handyman wallet and logs transactions.

## 8) Notifications (Business Value)
Push notifications reduce missed updates and improve completion:
- Customer: accepted, arrived, started (escrow funded), completed (escrow released)
- Handyman: accepted, started, completed
- Both: chat message alerts

## 9) Reporting & KPIs
### 9.1 Marketplace & Conversion
- Requests created per day
- Acceptance rate
- Completion rate
- Median time-to-accept and time-to-complete

### 9.2 Financial
- Total GMV (service fees)
- Platform fees collected
- Wallet inflows/outflows
- Escrow funding failures

### 9.3 Trust
- Verification completion rate for handymen
- Average rating (customer→handyman, handyman→customer)
- Photo usage rate (customer job photos; handyman before/after)

## 10) Risks & Assumptions
### 10.1 Risks
- Push notification delivery variance across devices (token rotation, permissions, background limits).
- WebView file-picker behavior depends on Android version and WebView implementation.
- Storing ID images requires strict privacy controls.

### 10.2 Assumptions
- Wallet-based model is acceptable for early-stage MVP.
- Nigeria location dataset is sufficiently accurate for state/LGA/LC selection.
- Cloudinary/FCM credentials are configured in environment variables on Render.

## 11) Roadmap (Business Phases)
### Release 1 (Current)
- Orders + status timeline (includes arrived)
- Wallet + escrow-style flow
- Codes + job photos
- Ratings + verification badge
- Chat + push notifications

### Release 2 (Next)
- Distance-based discovery (GPS + map)
- Dispute/refund workflows and audit trails
- Admin verification review + moderation tools
- Provider availability calendar + scheduling optimization

