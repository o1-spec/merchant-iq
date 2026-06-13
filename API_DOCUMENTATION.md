# MerchantIQ Frontend API Integration Guide

This documentation serves as the implementation guide for the frontend development team. It outlines the **29 backend API endpoints** configured, highlighting payload structures, validations, query parameter mappings, and auth details.

---

## 🔑 Authentication & Requests

- **Mechanism**: Session-based JSON Web Token (JWT) stored in an HTTP-only cookie.
- **Cookie Name**: `merchantiq_auth` (handled automatically by the browser's credential storage; no need for local storage tokens).
- **HTTP Headers**:
  - Exclude `/api/auth/register`, `/api/auth/login`, and `/api/auth/demo-login` which set the cookie. All other API calls must send requests with credentials (`credentials: 'include'` in standard `fetch` or `withCredentials: true` in Axios).
  - Request body content type must be `application/json` (except for CSV upload which is `multipart/form-data`).

---

## 🌐 API Response Shape

All API endpoints return standard response wrappers:

### Success Format
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Format
```json
{
  "success": false,
  "error": "Short description of the error",
  "errors": {
    "field_name": ["Detail list of validation failures"]
  }
}
```

---

## 📂 Endpoint Reference

### 1. Authentication (`/api/auth`)

#### **POST** `/api/auth/register`
Creates user and merchant profile, logs them in.
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@merchantiq.app",
  "password": "strongpassword123",
  "businessName": "Jane Grocery Shop",
  "businessType": "Retail",
  "businessCategory": "Convenience & Groceries",
  "location": "Lagos, Nigeria"
}
```
- **Constraints**:
  - `name`, `businessName`, `businessType`, `businessCategory`, `location`: min 2 chars.
  - `email`: Valid email format.
  - `password`: min 6 chars.

#### **POST** `/api/auth/login`
Authenticates user and returns active session.
- **Request Body**:
```json
{
  "email": "jane@merchantiq.app",
  "password": "strongpassword123"
}
```

#### **POST** `/api/auth/logout`
Clears session cookies and logs the user out.
- **Request Body**: None.

#### **GET** `/api/auth/me`
Gets session details for the logged-in user.
- **Response `data`**:
```json
{
  "user": {
    "id": "u-uuid-123",
    "name": "Jane Doe",
    "email": "jane@merchantiq.app",
    "role": "MERCHANT",
    "createdAt": "2026-06-13T22:00:00Z",
    "updatedAt": "2026-06-13T22:00:00Z",
    "merchant": {
      "id": "m-uuid-456",
      "businessName": "Jane Grocery Shop",
      "businessType": "Retail",
      "businessCategory": "Convenience & Groceries",
      "location": "Lagos, Nigeria"
    }
  }
}
```

#### **POST** `/api/auth/demo-login`
Auto-login for judges/demonstrations. Provisions user `demo@merchantiq.app`, clears existing data, generates **200 transactions** across the last 90 days, seeds a credit profile, prompts initial insights, and issues JWT cookies.
- **Request Body**: None.

---

### 2. Transaction Management (`/api/transactions`)

#### **GET** `/api/transactions`
Retrieves a paginated list of transactions.
- **Query Parameters**:
  - `page` (optional, default: `1`)
  - `limit` (optional, default: `20`)
  - `type` (optional): `INCOME` \| `EXPENSE`
  - `direction` (optional): `INFLOW` \| `OUTFLOW`
  - `category` (optional): string filter
  - `startDate`/`endDate` (optional): ISO-8601 date strings.
- **Response `data`**:
```json
{
  "transactions": [
    {
      "id": "t-uuid-789",
      "amount": 12000.0,
      "type": "INCOME",
      "category": "Retail Sales",
      "description": "Store front POS",
      "date": "2026-06-13T12:00:00Z",
      "source": "POS",
      "paymentMethod": "POS",
      "direction": "INFLOW",
      "status": "COMPLETED"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 200,
    "totalPages": 10
  }
}
```

#### **POST** `/api/transactions`
Adds a single transaction manually.
- **Business Logic Constraints (Zod Validated)**:
  - `INCOME` transactions **must** have direction `INFLOW`.
  - `EXPENSE` transactions **must** have direction `OUTFLOW`.
- **Request Body**:
```json
{
  "amount": 25000.0,
  "type": "EXPENSE",
  "category": "Inventory Purchase",
  "description": "Bought bags of rice",
  "date": "2026-06-13T10:00:00Z",
  "source": "BANK_STATEMENT",
  "paymentMethod": "TRANSFER",
  "direction": "OUTFLOW",
  "status": "COMPLETED"
}
```

#### **PATCH** `/api/transactions/[id]`
Modifies transaction parameters. State is merged and fully re-validated against Zod type/direction constraints.
- **Request Body** (All fields optional):
```json
{
  "amount": 28000.0,
  "status": "COMPLETED"
}
```

#### **DELETE** `/api/transactions/[id]`
Deletes a transaction. Verifies ownership.

#### **POST** `/api/transactions/upload`
Bulk transaction ingestion via CSV upload.
- **Constraints**:
  - `Content-Type`: Must be `multipart/form-data` containing key `file`.
  - **Max File Size**: 5MB.
  - **Filename extension**: must end with `.csv`.
  - **Headers**: must contain columns matching: `amount`, `type`, `category`, `direction`, `paymentMethod`, `source`, `status`. (Returns `400` with the missing header names if omitted).
- **Response `data`**:
```json
{
  "insertedCount": 42,
  "failedCount": 2,
  "errors": [
    {
      "row": 8,
      "errors": {
        "direction": ["INCOME must have direction INFLOW, and EXPENSE must have direction OUTFLOW"]
      },
      "raw": { "amount": "5000", "type": "INCOME", "direction": "OUTFLOW" }
    }
  ],
  "preview": [ ... ]
}
```

---

### 3. Financial Analytics (`/api/analytics`)

#### **GET** `/api/analytics/summary`
Calculates business parameters (margins, best sales days, trends).
- **Response `data`**:
```json
{
  "totalRevenue": 485000.0,
  "totalExpenses": 250000.0,
  "netProfit": 235000.0,
  "cashPosition": 235000.0,
  "transactionCount": 200,
  "bestSalesDay": "Friday",
  "topRevenueCategory": "Retail Sales",
  "topExpenseCategory": "Inventory Purchase",
  "revenueTrendPercent": 14.2,
  "expenseTrendPercent": -2.1
}
```

#### **GET** `/api/analytics/cashflow`
Calculates cash runway stats.
- **Runway Threshold Rules**:
  - `0 to 7 days` (or negative cash balance): `HIGH` risk level.
  - `8 to 30 days`: `MEDIUM` risk level.
  - `31+ days`: `LOW` risk level.
- **Response `data`**:
```json
{
  "currentCash": 235000.0,
  "averageDailyInflow": 15000.0,
  "averageDailyOutflow": 8000.0,
  "runwayDays": 29,
  "riskLevel": "MEDIUM",
  "warning": "Moderate runway: less than 30 days of cash reserves. Plan expenses carefully."
}
```

#### **GET** `/api/analytics/credit-readiness`
Deterministic rating (300-850) based on consistency. Triggers DB profile updates.
- **Response `data`**:
```json
{
  "score": 710,
  "riskLevel": "LOW",
  "strengths": ["Consistent weekly sales logged."],
  "weaknesses": ["Moderate expense volatility."],
  "nextSteps": ["Establish a steady weekly profile."],
  "profileId": "cp-uuid-123"
}
```

#### **GET** `/api/analytics/trends`
Chart-ready aggregated sets.
- **Response `data`**:
```json
{
  "dailyRevenue": [{ "date": "2026-06-10", "amount": 15000 }],
  "dailyExpenses": [{ "date": "2026-06-09", "amount": 25000 }],
  "monthlyRevenue": [{ "month": "2026-06", "amount": 139500.2 }],
  "categoryBreakdown": [{ "category": "Retail Sales", "amount": 139500.2, "direction": "INFLOW" }]
}
```

---

### 4. Gemini AI CFO Layer (`/api/ai`)

> [!NOTE]
> **Daily Regeneration Caching**:
> To avoid redundant LLM invocations, routes check if an insight has already been generated today. Supply `"forceRegenerate": true` to force query Gemini.

#### **POST** `/api/ai/morning-brief`
Daily brief summary text generator.
- **Payload** (Optional):
```json
{
  "forceRegenerate": true
}
```

#### **POST** `/api/ai/growth-recommendations`
Generates specific cost saving advice.
- **Payload** (Optional): Same format.

#### **POST** `/api/ai/credit-coach`
Qualifying loan guidance & warning summary.
- **Payload** (Optional): Same format.

#### **POST** `/api/ai/ask-cfo`
Interactive grounding Q&A.
- **Request Body**:
```json
{
  "question": "Can I afford to buy diesel next week?"
}
```
- **Response `data`**:
```json
{
  "question": "Can I afford to buy diesel next week?",
  "answer": "Based on your current cash position..."
}
```

---

### 5. Insights (`/api/insights`)

#### **GET** `/api/insights`
Retrieves generated advisory insights (category filters: `MORNING_BRIEF`, `GROWTH_RECOMMENDATION`, `CREDIT_COACH`).

#### **PATCH** `/api/insights/[id]/pin`
Toggles pinned status (`isPinned`).

#### **DELETE** `/api/insights/[id]`
Removes insight record.

---

### 6. Merchant Profile (`/api/merchant/profile`)

#### **GET** `/api/merchant/profile`
Gets merchant profile attributes.

#### **PATCH** `/api/merchant/profile`
Updates profile values (all fields optional).
- **Request Body**:
```json
{
  "businessName": "Jane Store Outlets",
  "location": "Ikeja, Lagos, Nigeria"
}
```

---

### 7. Aggregators

#### **GET** `/api/dashboard`
Loads active profile, calculated summary, runway stats, credit status, latest 10 transactions, and latest 5 insights in **one single request**.

#### **GET** `/api/reports/business-health`
Returns full metrics and last 10 AI insights.

---

### 8. System & Utilities

#### **POST** `/api/demo/seed`
Forces transaction generation (email must be `demo@merchantiq.app` OR role `JUDGE`).

#### **POST** `/api/demo/reset`
Wipes database and seeds new metrics (restricted to `demo@merchantiq.app` OR `JUDGE`).

#### **GET** `/api/demo/sample-csv`
Downloads `.csv` file.

#### **GET** `/api/health`
Status checks for Database select query and Gemini environment key.
