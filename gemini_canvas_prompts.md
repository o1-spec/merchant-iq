# 📘 Gemini Canvas & Canva Prompt Guide for MerchantIQ

This document provides a structured set of prompts to generate your project presentation or visual prototype.

**Prompting Strategy:** Gemini Canvas and Canva work best when you prompt them **screen-by-screen** rather than dumping everything at once. This ensures that the generated visuals capture the premium, minimal, and professional design of your coded website.

---

## 🎨 Master Design & Brand Prompt

_Run this prompt first to establish the theme, colors, and styling rules before generating individual pages._

```text
You are designing a high-fidelity fintech web application prototype for "MerchantIQ", an AI-powered Financial Intelligence and Business Health platform for African SMEs.

Design Language & Aesthetic Rules:
1. DO NOT make this look like a generic AI product. Avoid glowing purple gradients, futuristic effects, floating holograms, or sci-fi designs.
2. The design MUST feel like modern, professional software used to run a business. Draw design inspiration from: Stripe Dashboard, Mercury Banking, and Linear.
3. Colors:
   - Primary Background: Crisp White (#FFFFFF)
   - Borders and Grids: Soft Slate Gray (#F1F5F9 and #E2E8F0)
   - Primary Accents: Deep Navy / dark charcoal text (#0F172A)
   - Success States: Emerald Green (#10B981)
   - Warning States: Amber Yellow (#F59E0B)
   - Subtle Accent: Minimal Indigo (#4F46E5) for core stats
4. Typography: Use clean, geometric sans-serif fonts (Inter, Geist, or Plus Jakarta Sans).
5. Data Presentation: Clean grids, structured cards, simple progress bars, and minimal tabular data.
```

---

## 🖥️ Screen-by-Screen Prompts

### 1. Screen 1: The Landing Page

```text
Generate a clean, high-conversion landing page for MerchantIQ based on the master design guidelines.

Page Structure:
- Navigation Bar: Logo (MerchantIQ), Features, Pricing, and "Try Demo" (Primary CTA button in Navy).
- Hero Section:
  - Headline: "Your Financial Operating System"
  - Subheadline: "Transform transaction history into business intelligence, funding readiness insights, and a verified financial identity."
  - Primary CTA Button: "Start Free Analysis" (in indigo)
  - Secondary CTA Button: "View Demo" (white with gray border)
- Features Section: Highlighting the three core pillars:
  1. Cashflow Intelligence (runway tracking)
  2. Capital Readiness (business health scores)
  3. Trust Passport (verified identity for lenders)
- Dashboard Preview: A clean, minimal mock layout showing a business health index of 78/100 and revenue counters.
```

### 2. Screen 2: Register & Onboarding Page

```text
Generate a registration page and onboarding screens for MerchantIQ.

Page Structure:
- Left Column (Trust Branding): Minimalist panel displaying logos of supported African financial channels: OPay, Moniepoint, GTBank, Kuda, Access Bank. Headline: "No accounting knowledge required. Turn payment histories into financial trust."
- Right Column (Form Panel):
  - Fields: Full Name, Email, Password, Business Name, Business Type (Retail/Services/Wholesale), Business Category, and Location.
  - CTA Button: "Create Account"
- Onboarding Flow Steps:
  - Step 1: Welcome message.
  - Step 2: Payment method check list (OPay, Moniepoint, Bank Transfer, POS, Cash).
  - Step 3: Transaction upload area (a drag-and-drop box for CSV statements or Excel ledgers).
```

### 3. Screen 3: Ingestion & Analysis Loading Screen

```text
Generate a minimal, professional processing/analysis screen for MerchantIQ.

Visual Style:
- Clean loading layout showing progress indicators of transaction processing.
- Step-by-step checkmark log items resolving sequentially:
  1. [Check] Parsing Bank Statement (CSV Ingestion)
  2. [Check] Categorizing Transactions
  3. [Check] Calculating Business Health Score
  4. [Processing...] Generating Capital Readiness Metrics
  5. [Waiting] Issuing Verified Trust Passport
- Display a professional progress indicator without neon effects.
```

### 4. Screen 4: The Main Dashboard

```text
Generate the main executive dashboard for MerchantIQ.

Layout & Widgets:
- Top Stats Row (4 Cards):
  1. Business Health Score: Large "78 / 100" with a "Medium Risk" tag in yellow.
  2. Cash Runway: "42 Days" with a caption "Reserves cover operations."
  3. Monthly Revenue Run-Rate: "₦2,450,000" (past 30 days completed inflows).
  4. Funding Readiness: "Strong Confidence" in emerald.
- Main Panels (2-Column Grid):
  - Left Panel: Revenue vs. Expense monthly trend charts (minimal line graphs) and a transaction history ledger showing recent completed POS and transfer details.
  - Right Panel: "Top Revenue Categories" (progress bars for Retail Sales, Transfers) and "AI CFO Morning Brief" (a pinned markdown recommendations card highlighting cost-saving opportunities).
```

### 5. Screen 5: AI CFO Chat Interface

```text
Generate the AI CFO interactive advisory chat screen for MerchantIQ.

Layout & Widgets:
- Left Sidebar: Navigation tabs (Dashboard, Transactions, Capital Readiness, Trust Passport).
- Main Area: A splitscreen view.
  - Left pane: A clean chatbot interface. Messages should have professional financial guidance grounded on transaction cash balance figures. Show suggestions like: "Can I afford new inventory?", "How can I improve my business health score?".
  - Right pane: Active Cashflow Runway diagnostic widget showing current cash position and average daily inflow/outflow metrics.
```

### 6. Screen 6: Capital Readiness Center

```text
Generate the "Capital Readiness Center" screen for MerchantIQ.

Page Structure & Elements:
- Top Header: Title "Capital Readiness Center" with a verified shield indicator "Verified Ledger Analysis".
- Score Metrics Row:
  - Business Health Score: 78/100
  - Funding Readiness Confidence: Medium
  - Revenue Run-Rate: ₦2,450,000
  - Estimated Capacity Range: ₦735,000 - ₦1,960,000
- 2-Column Middle Grid:
  - Left Card: "Business Health History Trend" displaying a 6-month SVG line chart showing score progression (e.g. Mar: 66, Apr: 70, May: 75, Jun: 78) with a trend text "+12 points". Include a fallback "Insufficient Trend History" banner for merchants with under 3 months of data.
  - Right Card: "Business Health Breakdown" showing progress bars for: Consistency (15/20), Operating Cashflow (25/30), Stability (12/15), Revenue Growth (10/15), and Underwriting Trust (16/20).
- Diagnostics Card: A dark navy card titled "Why Your Funding Capacity is Limited" displaying:
  - Identified Weak Areas (e.g. volatile outflows, short reserves).
  - Improvement Blueprint (e.g. adjust supplier schedules, log sales consistently).
```

### 7. Screen 7: Repayment Simulator Modal

```text
Generate the "Scenario Repayment Simulator" modal overlay in MerchantIQ.

Modal Elements:
- Title: "Scenario A: Conservative Capacity" simulator.
- Inputs:
  - A slider for "Simulated Amount" (min ₦20,000 to max capacity limit ₦400,000).
  - Term selector buttons (3 Months, 6 Months, 12 Months).
- Output Details Box:
  - Principal: ₦200,000
  - Underwriting Rate: 4.5% / month
  - Total Interest: ₦54,000
  - Estimated Monthly Repayment: ₦42,333
- Live Cashflow Impact Indicator:
  - A color-coded warning box depending on repayment strain: "SAFE" (Green) if payment <15% of inflows, "MODERATE" (Yellow) if between 15%-30%, and "HIGH RISK" (Red) if >30%.
- Action CTA: "Evaluate Underwriting Package" button.
```

### 8. Screen 8: The Trust Passport (Financial Identity Card)

```text
Generate the "Trust Passport" printable profile screen for MerchantIQ.

Layout & Aesthetics:
- A premium, certificate-style bordered document layout suitable for sharing with lenders.
- Elements:
  - Top header: "Verified Merchant Financial Identity" with a gold/emerald ribbon badge "MerchantIQ Trust Seal".
  - Business Metadata: Femi Provision Store, Retail Category, Lagos Nigeria, Verification ID, Active since 2026.
  - Core Scores: Business Health Score: 78/100, Risk Level: Low, Inflow Consistency: 95%.
  - Underwriting stats: Monthly Inflows, Debt-Service Ratio, and 6-month growth rates.
  - Footer: "This profile has been verified against actual bank statement history logs. Generated on [Date]."
  - CTAs: "Print Passport" and "Share Secure Link".
```
