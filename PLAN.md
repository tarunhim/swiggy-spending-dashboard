# Swiggy Spending Dashboard - Full Project Plan

## Overview

A web app where users log in with their Swiggy phone number + OTP (just like the Swiggy app), and we automatically fetch their complete order history to display a rich, interactive spending dashboard with charts, breakdowns, and insights. No DevTools, no copy-pasting tokens — just a simple login.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  User's Browser                  │
│                                                  │
│  1. User enters phone number                     │
│  2. Receives OTP on their phone (sent by Swiggy) │
│  3. Enters OTP on our app                        │
│  4. Session token obtained automatically          │
│  5. Dashboard renders with charts & stats        │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│           Next.js API Routes (Proxy)             │
│                                                  │
│  /api/auth/send-otp  →  Triggers OTP via Swiggy │
│  /api/auth/verify-otp → Verifies OTP, gets token│
│  /api/orders          →  Fetches all orders      │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│            Swiggy Internal API                   │
│                                                  │
│  POST /dapi/auth/sms-otp     → Send OTP         │
│  POST /dapi/auth/otp-verify  → Verify & login   │
│  GET  /dapi/order/all        → Fetch orders      │
└─────────────────────────────────────────────────┘
```

### Why Next.js?

- **CORS Problem**: Swiggy's API blocks direct browser requests. We need a server-side proxy.
- **API Routes**: Next.js API routes act as a lightweight backend — no separate server needed.
- **Vercel Native**: Next.js deploys on Vercel with zero config.
- **No Database**: All data is fetched on-demand, processed client-side. Nothing is stored.

---

## Tech Stack

| Layer        | Technology                        | Why                                      |
| ------------ | --------------------------------- | ---------------------------------------- |
| Framework    | Next.js 14 (App Router)          | Full-stack React, API routes, Vercel-native |
| Styling      | Tailwind CSS                      | Rapid, responsive UI                     |
| Charts       | Recharts                          | Composable React charts, lightweight     |
| Icons        | Lucide React                      | Clean, modern icon set                   |
| HTTP Client  | Native fetch (server-side)        | No extra dependency needed               |
| Deployment   | Vercel                            | Free tier, auto-deploy from GitHub       |

---

## Swiggy API Details

### Authentication Flow (OTP-Based — No DevTools Needed)

Swiggy uses phone + OTP login, just like their app. We proxy this through our API routes so the user experience is seamless.

**User experience:**
1. User enters their **phone number** on our app
2. We call Swiggy's API → Swiggy sends an **OTP** to their phone
3. User enters the **OTP** on our app
4. We verify with Swiggy → get session token automatically
5. Dashboard loads!

**Step 1 — Send OTP:**
```
POST https://www.swiggy.com/dapi/auth/sms-otp

Body: { "mobile": "9XXXXXXXXX", "_device_id": "<generated-uuid>" }
Headers: {
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0 ...",
  "Origin": "https://www.swiggy.com",
  "Referer": "https://www.swiggy.com/"
}

Response: { "statusCode": 0, "statusMessage": "Success" }
```

**Step 2 — Verify OTP & Get Session:**
```
POST https://www.swiggy.com/dapi/auth/otp-verify

Body: { "mobile": "9XXXXXXXXX", "otp": "XXXXXX", "_device_id": "<same-uuid>" }
Headers: { same as above }

Response Headers include: set-cookie: _session_tid=<TOKEN>; ...
Response Body: { "statusCode": 0, "statusMessage": "Success", "data": { ... } }
```

The `set-cookie` header in the response contains `_session_tid` — that's our session token. We extract it server-side and use it for all subsequent API calls.

**Fallback — Manual Token Input:**

For edge cases where OTP login doesn't work (Swiggy blocks, rate limits, etc.), we also keep a "Use Session Token" option in an expandable "Advanced" section for technical users.

### Orders API Endpoint

```
GET https://www.swiggy.com/dapi/order/all?order_id=
```

**Headers required:**
```
Cookie: _session_tid=<token>
Content-Type: application/json
User-Agent: Mozilla/5.0 ...
```

**Response structure (simplified):**
```json
{
  "statusCode": 0,
  "data": {
    "orders": [
      {
        "order_id": "abc123",
        "order_time": "2024-01-15 19:30:00",
        "order_total": 450.00,
        "restaurant_name": "Biryani Blues",
        "restaurant_cuisine": "Biryani, North Indian",
        "order_items": [
          { "name": "Chicken Biryani", "quantity": 1, "total": 350 },
          { "name": "Raita", "quantity": 1, "total": 50 }
        ],
        "delivery_fee": 30,
        "coupon_applied": "SWIGGYIT",
        "discount": 100,
        "payment_method": "UPI",
        "rain_mode": false,
        "is_coupon_applied": true,
        "order_delivery_status": "Delivered"
      }
    ],
    "hasMore": true
  }
}
```

**Pagination:** Keep calling with `?order_id={last_order_id}` until `hasMore` is `false`.

---

## Features & Dashboard Sections

### 1. Login Screen (Landing Page)

- Clean hero section explaining what the app does
- Phone number input with Indian flag (+91) prefix
- OTP input (6-digit) that appears after phone is submitted
- "Analyze My Orders" button
- Expandable "Advanced" section with manual token input (for power users)
- Privacy notice: "We don't store your data. Your phone number and OTP go directly to Swiggy."

### 2. Loading State

- Progress bar showing "Fetching orders... (page 3 of ~N)"
- Animated food-themed illustrations

### 3. Dashboard — Summary Cards (Top Row)

| Card                  | Value                          |
| --------------------- | ------------------------------ |
| Total Spent           | ₹XX,XXX (lifetime)            |
| Total Orders          | XXX orders                     |
| Average Order Value   | ₹XXX                          |
| Total Delivery Fees   | ₹X,XXX                        |
| Total Savings         | ₹X,XXX (coupons/discounts)    |
| Most Expensive Order  | ₹X,XXX at Restaurant Name     |

### 4. Dashboard — Spending Over Time

- **Monthly spending** bar chart (last 12 months)
- **Yearly spending** comparison (if data spans multiple years)
- **Weekly pattern** — which day of the week you order most (heatmap or bar chart)
- **Daily trend** — spending by day for the selected month
- **Time of day** — orders by hour (lunch vs dinner vs late night)

### 5. Dashboard — Restaurant Breakdown

- **Top 10 Restaurants** by total spend (horizontal bar chart)
- **Top 10 Restaurants** by order count
- Full searchable/sortable table of all restaurants with:
  - Restaurant name
  - Cuisine type
  - Number of orders
  - Total spent
  - Average order value
  - Last ordered date

### 6. Dashboard — Item/Category Analysis

- **Top ordered items** (by frequency)
- **Cuisine breakdown** pie/donut chart (North Indian, Chinese, Biryani, etc.)
- **Veg vs Non-Veg** split (if data available)

### 7. Dashboard — Order History Table

- Full paginated table of every order
- Columns: Date, Restaurant, Items, Amount, Discount, Payment Method, Status
- Searchable and filterable
- Sortable by date, amount

### 8. Dashboard — Fun Stats / Insights

- "You've been ordering since {first_order_date}"
- "Your longest streak was X days in a row"
- "You saved ₹X,XXX using coupons"
- "Your go-to restaurant is {name} — you've ordered {N} times"
- "You order most on {day_of_week}"
- "Peak ordering hour: {time}"

---

## Project Structure

```
market-simulator/
├── public/
│   └── images/                 # Static assets
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with fonts, metadata
│   │   ├── page.tsx            # Landing page (login + token input)
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Dashboard page
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── send-otp/
│   │       │   │   └── route.ts    # Proxy: send OTP to Swiggy
│   │       │   └── verify-otp/
│   │       │       └── route.ts    # Proxy: verify OTP, return token
│   │       └── orders/
│   │           └── route.ts    # Proxy: fetch Swiggy orders
│   ├── components/
│   │   ├── login-form.tsx      # Phone + OTP login form
│   │   ├── token-input.tsx     # Manual token input (advanced)
│   │   ├── loading-screen.tsx  # Loading state with progress
│   │   ├── summary-cards.tsx   # Top-row stat cards
│   │   ├── spending-chart.tsx  # Monthly/yearly spending chart
│   │   ├── weekly-heatmap.tsx  # Day-of-week order heatmap
│   │   ├── hourly-chart.tsx    # Orders by hour
│   │   ├── restaurant-table.tsx# Restaurant breakdown table
│   │   ├── top-restaurants.tsx # Top restaurants bar chart
│   │   ├── cuisine-chart.tsx   # Cuisine breakdown donut chart
│   │   ├── order-table.tsx     # Full order history table
│   │   ├── fun-stats.tsx       # Fun insights section
│   │   └── ui/                 # Reusable UI primitives
│   │       ├── card.tsx
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── table.tsx
│   │       └── badge.tsx
│   ├── lib/
│   │   ├── swiggy-api.ts       # Swiggy API fetching logic
│   │   ├── data-processor.ts   # Transform raw orders into dashboard data
│   │   └── utils.ts            # Formatters (currency, dates, etc.)
│   └── types/
│       └── swiggy.ts           # TypeScript types for Swiggy data
├── .env.local                  # (empty — no secrets needed)
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── PLAN.md                     # This file
```

---

## Implementation Plan (Step by Step)

### Phase 1: Project Setup

1. Initialize Next.js 14 project with App Router
2. Install dependencies: `tailwind`, `recharts`, `lucide-react`
3. Configure Tailwind with a dark theme (food apps look great in dark mode)
4. Set up base layout with fonts (Inter / Geist)

### Phase 2: Swiggy Auth Integration (OTP Login)

1. Create TypeScript types for Swiggy data (`src/types/swiggy.ts`)
2. Build the **Send OTP** API route (`src/app/api/auth/send-otp/route.ts`)
   - Accepts POST with `{ mobile: string }`
   - Generates a `_device_id` UUID
   - Calls Swiggy's `/dapi/auth/sms-otp`
   - Returns success/failure + device_id for step 2
3. Build the **Verify OTP** API route (`src/app/api/auth/verify-otp/route.ts`)
   - Accepts POST with `{ mobile: string, otp: string, device_id: string }`
   - Calls Swiggy's `/dapi/auth/otp-verify`
   - Extracts `_session_tid` from Swiggy's response headers
   - Returns the token to the frontend (held in memory only)

### Phase 3: Orders API + Data Processing

1. Build the **Orders** API route (`src/app/api/orders/route.ts`)
   - Accepts POST with `{ token: string }`
   - Fetches all pages from Swiggy's `/dapi/order/all`
   - Returns full dataset
2. Build data processor (`src/lib/data-processor.ts`)
   - Parse raw orders into structured analytics:
     - Monthly/yearly/weekly/daily aggregations
     - Restaurant aggregations
     - Item frequency counts
     - Cuisine breakdown
     - Fun stats calculations

### Phase 4: Landing Page

1. Build hero section with app description
2. Build phone number input with +91 prefix
3. Build OTP input (6-digit, auto-focus between digits)
4. Build "Advanced" expandable section with manual token input
5. Add privacy disclaimer
6. Handle login → redirect to dashboard with token in React state (NOT in URL)

### Phase 5: Dashboard UI

1. **Loading screen** with progress indicator while fetching
2. **Summary cards** row — total spent, orders, avg value, etc.
3. **Spending over time** — monthly bar chart, yearly comparison
4. **Weekly heatmap** — order frequency by day of week
5. **Hourly distribution** — orders by time of day
6. **Top restaurants** — bar chart + sortable table
7. **Cuisine breakdown** — donut/pie chart
8. **Order history** — full searchable, paginated table
9. **Fun stats** — insight cards at the bottom

### Phase 6: Polish

1. Responsive design (mobile-friendly)
2. Empty states and error handling
3. Token expiry handling with clear messaging
4. "Share your stats" — generate a shareable image/card (optional)
5. Dark/light mode toggle

### Phase 7: Deployment

1. Push code to GitHub
2. Connect repo to Vercel
3. Deploy (zero config for Next.js)
4. Custom domain (optional)

---

## Deployment Plan (Vercel)

### Prerequisites
- GitHub account
- Vercel account (free at [vercel.com](https://vercel.com))

### Steps

1. **Initialize Git & push to GitHub:**
   ```bash
   cd market-simulator
   git init
   git add .
   git commit -m "Initial commit: Swiggy spending dashboard"
   git remote add origin https://github.com/<username>/swiggy-dashboard.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your `swiggy-dashboard` repo
   - Framework Preset: **Next.js** (auto-detected)
   - No environment variables needed
   - Click **Deploy**

3. **Auto-Deploy:**
   - Every push to `main` triggers a new deployment
   - Preview deployments for pull requests
   - URL: `https://swiggy-dashboard.vercel.app` (or custom domain)

4. **Custom Domain (optional):**
   - In Vercel dashboard → Settings → Domains
   - Add your domain and update DNS records

### Vercel Config (no file needed)

Next.js on Vercel requires zero configuration. The `next.config.js` is enough. But if needed:

```json
// vercel.json (optional, only if customizing)
{
  "framework": "nextjs",
  "regions": ["bom1"]   // Mumbai region for lower latency to Indian users
}
```

### Cost

- **Free tier** covers this entire app:
  - 100 GB bandwidth/month
  - Serverless function executions (API routes)
  - Automatic HTTPS
  - Preview deployments

---

## Privacy & Security Considerations

1. **No data storage** — We never save orders, tokens, phone numbers, or any user data
2. **Phone/OTP passthrough** — Phone number and OTP are forwarded directly to Swiggy's API and immediately discarded
3. **Token handling** — Session token is only held in browser memory (React state), never persisted to localStorage, cookies, or server logs
4. **Server-side proxy** — API routes are stateless; they forward requests and return responses without logging
5. **No analytics/tracking** — No Google Analytics, no cookies from our side
6. **Open source** — Users can verify the code themselves
7. **Clear disclaimer** on the landing page: "Your phone number and OTP go directly to Swiggy. We don't store anything."

---

## Estimated Timeline

| Phase                          | Effort     |
| ------------------------------ | ---------- |
| Phase 1: Project Setup         | ~30 min    |
| Phase 2: OTP Auth Integration  | ~2 hours   |
| Phase 3: Orders API + Processor| ~2 hours   |
| Phase 4: Landing Page (Login)  | ~1.5 hours |
| Phase 5: Dashboard UI          | ~4 hours   |
| Phase 6: Polish                | ~2 hours   |
| Phase 7: Deployment            | ~15 min    |
| **Total**                      | **~12 hrs** |

---

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Swiggy changes API structure | Version the parser, add fallback error messages |
| Swiggy blocks OTP requests from server | Add proper User-Agent/headers to mimic browser; fallback to manual token input |
| Swiggy blocks order fetch requests | Rate limiting, proper headers; worst case, guide users to use browser extension |
| Token expires mid-fetch | Detect 401 responses, prompt user to re-login with OTP |
| Large order history (1000+ orders) | Paginate fetching, show progress, process in chunks |
| CORS policy changes | API route proxy handles this; no direct browser calls |

---

## Future Enhancements (Post-MVP)

- [ ] Zomato support (same concept, different API)
- [ ] Blinkit / Instamart grocery spending
- [ ] Export data as CSV/PDF
- [ ] Shareable stats card (image generation)
- [ ] Compare spending across months/years
- [ ] Budget alerts ("You've spent ₹X this month")
- [ ] PWA support for mobile
