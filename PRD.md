# Handyman — Product Requirements Document (PRD)

**Document version:** 1.0  
**Date:** 2026-03-04  
**Product:** Handyman (On‑Demand Service Marketplace)  
**Audience:** Product, Engineering, Operations  

## 1) Product Overview
Handyman is a two‑sided marketplace where **Customers** post service requests and **Handymen** accept and complete jobs. The product enforces a structured flow (price confirmation, arrival status, start/completion codes, job photos) and provides wallet + escrow-style payment handling, in-order chat, ratings, and push notifications.

## 2) Goals
- Make it easy for customers to **book help fast** with clear location and job context.
- Enable handymen to confidently accept jobs with sufficient information (including photos).
- Improve trust and transparency using:
  - verification badge
  - status timeline with arrival marker
  - before/after photos
  - ratings
- Reduce missed updates with push notifications.

## 3) Non‑Goals
- Full KYC/identity verification governance (manual review, dispute arbitration).
- Real-time GPS tracking and route ETA.
- External payment rails (cards/bank) beyond the wallet model.

## 4) Personas
### 4.1 Customer
Wants a reliable service provider, clear pricing, and proof of work completion.

### 4.2 Handyman
Wants quality leads, clear job briefs, predictable payout, and a simple workflow.

### 4.3 Admin
Needs to troubleshoot issues and monitor platform health; may intervene when needed.

## 5) User Journeys
### 5.1 Customer — Create and manage an order
1. Login/Register.
2. Create order:
   - select service
   - title/description
   - location (State → LGA → Local Council → Street)
   - preferred date/time (optional)
   - service fee
   - upload up to **2 job photos** (optional)
3. Order is listed in marketplace as `requested`.
4. Handyman accepts → customer receives push `order_accepted`.
5. Handyman arrives → customer receives push `order_arrived`.
6. Handyman confirms price (if needed) → push `price_confirmed`.
7. Customer shares **start code** to handyman; handyman starts job (escrow funded) → push `order_in_progress`.
8. Customer shares **completion code**; handyman completes job (escrow released) → push `order_completed`.
9. Customer rates handyman.

### 5.2 Handyman — Accept and complete an order
1. Login/Register.
2. Complete profile, upload verification ID image to earn “Verified” badge.
3. Browse marketplace jobs and open order details.
4. Accept order → status `accepted`.
5. Use chat to finalize details, then confirm service fee (locks edits).
6. Mark arrived → status `arrived`.
7. Start job with start code + upload before image → status `in_progress` and escrow funded.
8. Complete job with completion code + upload after image → status `completed` and payout released.
9. Rate customer.

## 6) Functional Requirements

### A) Roles and Access Control
- **FR-A1:** Customer can create orders.
- **FR-A2:** Handyman can accept available `requested` orders.
- **FR-A3:** Only order parties (and admin) can view order details and chat.
- **FR-A4:** Only the assigned handyman can start/complete the job.

### B) Location (Nigeria Cascading)
- **FR-B1:** Country is Nigeria.
- **FR-B2:** Customer selects State → LGA → Local Council; street is typed.
- **FR-B3:** Order stores `country`, `state`, `lga`, `lc`, and `address`.

### C) Order Lifecycle + Timeline
- **FR-C1:** Supported statuses:
  - `requested`, `accepted`, `arrived`, `in_progress`, `completed`, `canceled`
- **FR-C2:** Timeline records each state change with timestamp and actor.
- **FR-C3:** Handyman can mark `arrived` only when order is `accepted` (before start).
- **FR-C4:** Starting the job is only allowed from `accepted` or `arrived`.

### D) Price Negotiation & Confirmation
- **FR-D1:** Customer sets service fee at booking.
- **FR-D2:** Customer can edit fee until handyman confirms.
- **FR-D3:** Handyman confirms fee (locks customer edits).

### E) Verification Codes
- **FR-E1:** System generates a **start** code and a **completion** code at booking.
- **FR-E2:** Handyman must provide correct start code to start job.
- **FR-E3:** Handyman must provide correct completion code to complete job.

### F) Images / Media
- **FR-F1 (Customer job photos):**
  - Customer may upload **0–2** images for the job request.
  - Photos must be images; upload limit enforced server-side.
  - Handyman can view these images in order details.
- **FR-F2 (Handyman proof photos):**
  - Start requires uploading at least one “before” image.
  - Completion requires uploading at least one “after” image.
- **FR-F3 (Handyman portfolio):**
  - Handyman can upload work samples and display them as tiles.

### G) Wallet + Escrow-style Handling
- **FR-G1:** Customer cannot submit an order if wallet balance is insufficient for (fee + platform fee).
- **FR-G2:** On start, customer wallet is debited and escrow fields are recorded.
- **FR-G3:** On completion, payout is credited to handyman wallet and transactions are logged.

### H) Cancellation / Decline
- **FR-H1:** Customer can cancel while `requested/accepted/arrived` only, and only before escrow funded.
- **FR-H2:** Handyman can decline while `accepted/arrived` only, and only before escrow funded; order returns to marketplace.

### I) Chat
- **FR-I1:** Chat opens after acceptance and is writable in accepted/arrived/in_progress.
- **FR-I2:** Chat becomes read-only after completed/canceled.

### J) Ratings
- **FR-J1:** After completion, customer can rate handyman once.
- **FR-J2:** After completion, handyman can rate customer once.
- **FR-J3:** Aggregate ratings display on dashboards and in contact cards.

### K) Push Notifications (FCM)
- **FR-K1:** Device registers push token to backend after user allows notifications.
- **FR-K2:** Backend sends notifications for:
  - `order_accepted`, `order_arrived`, `order_in_progress`, `order_completed`
  - `price_updated`, `price_confirmed`
  - `order_canceled`, `order_declined`
  - `chat_message`
- **FR-K3:** Notifications include `data.event` and `data.orderId` for deep linking.

## 7) Non‑Functional Requirements
- **NFR-1:** Security: JWT-protected endpoints; role checks on all mutations.
- **NFR-2:** Performance: order list/detail loads should be usable on mobile networks.
- **NFR-3:** Reliability: push is best‑effort; UI still updates via polling refresh.
- **NFR-4:** Data integrity: enforce status transition rules server-side.
- **NFR-5:** Privacy: protect ID image storage and access.

## 8) Current Tech Stack (what you can claim)
### Frontend (Web)
- React + TypeScript
- Vite
- React Router
- UI components and role-based dashboards

### Backend (API)
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- Multer (in-memory uploads)

### Infrastructure / Integrations
- Render (deploy/hosting)
- Cloudinary (image storage) with local uploads fallback logic
- Firebase Cloud Messaging (push notifications)

### Mobile
- Android WebView wrapper app loading the hosted web app URL

## 9) Data Model (High-level)
### User
- role: customer/handyman/admin
- profile: name, avatar, gender
- providerProfile: verification fields and status, work samples
- walletBalance
- pushTokens
- rating aggregates (asCustomer / asHandyman)

### Order
- parties: customerId, providerId
- location: country, state, lga, lc, address
- pricing: price, priceConfirmed
- codes: startVerificationCode, completionVerificationCode
- images: customerImageUrls (0–2), beforeImageUrls, afterImageUrls
- escrow fields: fundedAt/releasedAt + amounts
- status + timeline events

### Message
- orderId, fromUserId, toUserId, text, createdAt

## 10) Acceptance Criteria (selected)
- **AC-1:** Customer can upload 0–2 job photos; 3rd upload is rejected with a clear message.
- **AC-2:** Handyman can see customer job photos inside order details after accepting.
- **AC-3:** Handyman can mark arrived; customer receives `order_arrived` push.
- **AC-4:** Start is blocked without confirmed price, start code, and before image.
- **AC-5:** Completion is blocked without completion code and after image.

## 11) Roadmap
### Release 1 (Current)
- Orders + arrived state + timeline
- Wallet + escrow-style handling + transaction history
- Price negotiation + confirmation
- Codes + job photos (customer + handyman)
- Chat (polling) + push notifications
- Verification badge + work samples + ratings

### Release 2 (Recommended Next)
- Real-time transport (WebSockets/SSE) to reduce polling
- Distance/location matching (GPS + maps)
- Dispute/refund flows and admin audit logs
- Provider schedule/calendar + smarter job recommendations

