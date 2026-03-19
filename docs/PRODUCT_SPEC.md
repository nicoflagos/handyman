# Handyman — Product Specification (Current Implementation)

**Last updated:** 2026-03-19  
**Scope:** This document describes the *current* implemented product functionality, workflows, rules, and technical integrations for Handyman.

## 1) Product Overview
Handyman is an on-demand service marketplace for Nigeria (launch city: Lagos) connecting:
- **Customers** who post service requests and pay via wallet/escrow
- **Handymen** who accept jobs from a marketplace filtered by their location and availability
- **Admins** who monitor users, orders, transactions, and verification artifacts for operations/compliance

Key trust controls:
- location-based matching (Country → State → LGA → Local Council → Street)
- verification codes to start/complete jobs
- before/after job photos
- two-way ratings
- push notifications (FCM) for operational events

## 2) Roles and Permissions
### 2.1 Customer
- Register/login
- Manage profile + upload avatar
- Browse service catalog
- Create orders (book services)
- Upload up to **2** job photos per order (customer images)
- View assigned handyman info **after acceptance**
- Chat with assigned handyman (after acceptance, before completion/cancel)
- Cancel order (only before job start/escrow funding; see Section 4.7)
- Rate handyman after completion

### 2.2 Handyman (Provider)
- Register/login as handyman
- Manage provider profile (skills, location, availability + note)
- Upload avatar + work samples (portfolio tiles, up to **4** images)
- Upload verification artifacts (address, ID type/number, ID image; passport photo supported)
- View marketplace jobs filtered by provider location + availability
- Accept/decline jobs (decline allowed only before start/escrow funding)
- Chat with customer on accepted jobs
- Confirm service fee (locks customer editing)
- Mark `arrived`
- Start job with start code + before-image (triggers escrow hold)
- Complete job with completion code + after-image (triggers escrow release)
- Rate customer after completion

### 2.3 Admin
- View/search users and their profiles, including provider KYC fields
- View orders (filter by status)
- View transactions (global or per user)
- View provider ID image and passport photo URLs with audit logging

## 3) Core Entities (Data Model Summary)
### 3.1 User
Source: `on-demand-service-app/src/models/mongo/user.schema.ts`
- `role`: `customer | provider | admin`
- Profile: `firstName`, `lastName`, `email`, `phone`, `gender`, `avatarUrl`, `username`
- Wallet: `walletBalance` (default preload **₦100,000**)
- Ratings aggregates:
  - `ratingAsCustomerAvg`, `ratingAsCustomerCount`
  - `ratingAsHandymanAvg`, `ratingAsHandymanCount`
- Push:
  - `pushTokens[]` (FCM tokens per user; multi-device)
- Provider profile (`providerProfile`):
  - Location: `country`, `state`, `lga`, `lc` (zip is deprecated but kept for compatibility)
  - Skills: `skills[]`
  - Availability: `available`, `availabilityNote`
  - Work samples: `workImageUrls[]` (max 4)
  - Verification/KYC-lite:
    - `address`, `idType` (`nin|voters_card`), `idNumber`, `idImageUrl`
    - `passportPhotoUrl` (supported)
    - `verified`, `verifiedAt` (auto-computed when required fields are valid)

### 3.2 Order
Source: `on-demand-service-app/src/models/mongo/order.schema.ts`
- Parties: `customerId`, optional `providerId`
- Service: `serviceKey`, `title`, `description`
- Location: `country`, `state`, `lga`, optional `lc`, `address`
- Price:
  - `price` (service fee; excludes materials unless agreed)
  - `priceConfirmed`, `priceConfirmedAt`
- Codes:
  - `startVerificationCode`, `completionVerificationCode` (customer sees; handyman enters)
- Status:
  - `requested → accepted → arrived → in_progress → completed` (or `canceled`)
  - `timeline[]` events with `status`, `at`, `by`, optional `note`
- Media:
  - `customerImageUrls[]` (max 2)
  - `beforeImageUrls[]` (required at start)
  - `afterImageUrls[]` (required at completion)
- Escrow tracking:
  - `escrowTotal`, `escrowJobAmount`, `escrowPlatformFee`
  - `escrowFundedAt`, `escrowReleasedAt`
- Ratings:
  - `customerRating`, `handymanRating` (per-order)

### 3.3 Message (In-order chat)
Source: `on-demand-service-app/src/models/mongo/message.schema.ts`
- `orderId`, `fromUserId`, `toUserId`, `text`, timestamps
- Chat is enabled only for the two parties on the order.

### 3.4 Transaction
Source: `on-demand-service-app/src/models/mongo/transaction.schema.ts`
- `direction`: `in | out`
- `type`: `wallet_topup | order_escrow_debit | order_payout | platform_fee | wallet_adjustment`
- `amount`, `currency` (`NGN`), `ref`, optional `meta`

### 3.5 Audit Log
Source: `on-demand-service-app/src/models/mongo/audit.schema.ts`
- Tracks sensitive admin views (e.g., provider ID image URL, passport photo URL).

## 4) Key Workflows (End-to-End)
### 4.1 Registration and Login
Frontend:
- Register: `client/src/pages/Register.tsx`
- Login: `client/src/pages/Login.tsx`
Backend:
- `POST /api/auth/register`
- `POST /api/auth/login`

Registration fields:
- `firstName`, `lastName`, `phone`, `gender`, `email`, `password`, `role` (`customer|provider`)

### 4.2 Authentication & Session Management (Security)
Backend:
- JWT signed with `JWT_SECRET`
- Default expiry: `JWT_EXPIRES_IN` (default `30m`)
- Auth accepted via:
  - `Authorization: Bearer <token>` header, or
  - HttpOnly cookie `AUTH_COOKIE_NAME` (default `access_token`)

Frontend:
- Supports `VITE_AUTH_MODE`:
  - `token` (default): stores token in `sessionStorage` (not `localStorage`)
  - `cookie`: relies on HttpOnly cookie, no JS token storage

Behavior:
- Any 401 response triggers local logout + re-login requirement.

### 4.3 Profile and Avatar Upload (All users)
- User can upload a profile picture (avatar).
- Upload stores to Cloudinary when configured; otherwise to `/uploads/...` (local filesystem).

### 4.4 Provider Profile (Handyman)
Handyman can update:
- location: `country/state/lga/lc`
- skills list
- availability toggle + note
- address + ID data and upload ID image
- upload passport photo (supported)
- upload work samples (max 4 images)

Verification badge:
- Auto-sets `providerProfile.verified=true` when required fields exist and validate:
  - address present
  - idType + idNumber valid format (NIN 11 digits; voter’s card 19 alphanumeric)
  - idImageUrl present

### 4.5 Location Capture (Nigeria)
User-facing selection pattern:
**Nigeria → State → LGA → Local Council → Street address**

Used for:
- filtering marketplace orders to nearby handymen (state/lga/lc match)
- order fulfillment and operational clarity

### 4.6 Service Catalog
Public endpoint:
- `GET /api/services`
Used by:
- home page "Popular services"
- booking flow

### 4.7 Order Lifecycle (Status Machine)
Statuses:
- `requested`: created by customer, available in marketplace
- `accepted`: handyman assigned
- `arrived`: handyman indicates arrival at location
- `in_progress`: started after start code + before image; escrow funded
- `completed`: completion code + after image; escrow released
- `canceled`: customer cancellation only before job start/escrow funding

Customer cancel rules:
- allowed while `requested` OR `accepted` OR `arrived` **before escrow funding**
- not allowed after `in_progress`

Handyman decline rules:
- allowed while `accepted` OR `arrived` **before escrow funding**
- sets order back to `requested` and clears `providerId` so it returns to marketplace

### 4.8 Price Negotiation and Fee Lock
- Customer proposes `price` (service fee) at booking
- Customer may edit price only until handyman confirms
- Handyman confirms price via `confirm-price` endpoint; sets `priceConfirmed=true`
- Once confirmed, customer cannot edit again

### 4.9 Start Job (Escrow Hold)
Preconditions:
- Order status is `accepted` or `arrived`
- Handyman is the assigned `providerId`
- Handyman has confirmed price (`priceConfirmed=true`)
- Handyman provides the **Start Code**
- Handyman uploads at least one **before-image**

On success:
- Order status becomes `in_progress`
- Timeline event appended: `in_progress`
- Customer wallet is debited and escrow is considered funded (`escrowFundedAt` set)
- Transactions are recorded:
  - customer: `order_escrow_debit` (out)
  - customer: `platform_fee` (out) — 5% of service fee
- Push notifications are sent:
  - customer: job started/in progress
  - handyman: job in progress confirmation

### 4.10 Complete Job (Escrow Release)
Preconditions:
- Order status is `in_progress`
- Handyman provides the **Completion Code**
- Handyman uploads at least one **after-image**
- Escrow must have been funded (`escrowFundedAt` exists)

On success:
- Order status becomes `completed`
- Timeline event appended: `completed`
- Escrow is released to handyman wallet:
  - Handyman payout = Service Fee - 5% handyman platform fee
- Transactions are recorded:
  - handyman: `order_payout` (in) net payout
  - handyman: `platform_fee` (out) — 5% of service fee
- Push notifications are sent:
  - customer: “Job completed… Escrow released to handyman.”
  - handyman: “Payment released…”

### 4.11 Ratings
Rules:
- Both parties can rate after `completed`
- One rating per side per order
- Aggregates update on user profile:
  - customer rates handyman → handyman aggregate updates
  - handyman rates customer → customer aggregate updates

### 4.12 In-Order Chat
Availability:
- Enabled when order has a `providerId` and status is not `requested`
- Writable when status is `accepted`, `arrived`, or `in_progress`
- Read-only when status is `completed` or `canceled`

Behavior:
- v1 uses polling from the client (periodic refresh)
- New message triggers push notification (event `chat_message`) to the other party

### 4.13 Wallet and Transaction History
Wallet:
- Each account has `walletBalance` (preloaded to **₦100,000**)
- Customer must have sufficient balance to book/start jobs as enforced by platform rules

Transaction history:
- `GET /api/me/transactions` returns latest entries
- Types include: `wallet_topup`, `order_escrow_debit`, `order_payout`, `platform_fee`, `wallet_adjustment`

### 4.14 Push Notifications
Provider:
- Firebase Cloud Messaging (FCM) via `firebase-admin`
Data:
- Each user stores multiple `pushTokens` to support multiple devices
Events (examples in current implementation):
- order accepted / in progress / completed
- escrow released
- chat message

### 4.15 Admin Operations
Admin views:
- Users listing with filters (role, search)
- Orders listing (status filter)
- Transactions listing (global or per user)
- Sensitive KYC image URL views:
  - provider ID image URL
  - provider passport photo URL
  - Each view is audit-logged

## 5) API Surface (Implemented)
All routes are served under `/api` (backend).

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login` (sets HttpOnly cookie + returns token for legacy)
- `POST /api/auth/logout` (clears cookie)

Me/Profile:
- `GET /api/me`
- `POST /api/me/avatar` (multipart)
- `POST /api/me/push-token`
- `DELETE /api/me/push-token`
- `POST /api/me/push-test`
- `GET /api/me/transactions`
- `POST /api/wallet/topup`

Provider:
- `PUT /api/providers/me`
- `POST /api/providers/me/work-images` (multipart)
- `DELETE /api/providers/me/work-images`
- `POST /api/providers/me/passport` (multipart)
- `POST /api/providers/me/id-image` (multipart)

Catalog:
- `GET /api/services`

Orders:
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders` (customer create)
- `GET /api/marketplace/orders` (handyman)
- `POST /api/orders/:id/accept`
- `POST /api/orders/:id/decline`
- `POST /api/orders/:id/status` (arrived/canceled etc)
- `POST /api/orders/:id/confirm-price`
- `PUT /api/orders/:id/price`
- `POST /api/orders/:id/customer-images` (multipart; customer job images)
- `POST /api/orders/:id/start` (multipart; before-image + startCode)
- `POST /api/orders/:id/complete` (multipart; after-image + completionCode)
- `POST /api/orders/:id/rate`
- `GET /api/orders/:id/messages`
- `POST /api/orders/:id/messages`

Admin:
- `GET /api/admin/users`
- `GET /api/admin/orders`
- `GET /api/admin/transactions`
- `GET /api/admin/users/:id/id-image`
- `GET /api/admin/users/:id/passport-photo`

## 6) Integrations and Deployment
Hosting:
- Backend runs on Render.
- Frontend can be:
  - served by backend with `SERVE_STATIC=true` (Render single-service), or
  - deployed to GitHub Pages (static) using Vite base path.

Data:
- MongoDB Atlas.

Media:
- Cloudinary when configured; otherwise filesystem `/uploads` (not recommended on ephemeral hosts).

Push:
- Firebase Admin SDK using `FIREBASE_SERVICE_ACCOUNT_JSON` env var.

Android:
- Android WebView wrapper app displays the hosted web app and supports push notifications.

## 7) Security Notes (Current)
- Short-lived JWTs (`JWT_EXPIRES_IN`, default 30m)
- Auth cookie option (HttpOnly)
- CSP added in `client/index.html` to reduce XSS risk
- CORS allowlist supports GitHub Pages and local dev; credentials allowed for cookie mode

## 8) Known Limitations / Next Improvements
- Cookie auth across different domains (e.g., `github.io` → `onrender.com`) may be blocked by modern browser policies; token mode remains supported.
- Payments partner ledger integration (e.g., Zest Ledger) not yet integrated; wallet/escrow is currently internal accounting logic.
- Admin does not yet include full dispute workflow tooling (policy exists; tooling can be added).
