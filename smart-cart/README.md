# Cartwise: Smart Cart & Checkout (hackathon MVP)

React + Tailwind frontend, Node/Express backend, PostgreSQL persistence.
Standout feature: the **Smart Savings Assistant**, which tests every coupon against the live cart and recommends the one that saves the most.

## Architecture overview

```
React (Vite, Tailwind)  --JSON/REST-->  Express  -->  Services  -->  Repositories  -->  PostgreSQL
 CartContext (UI state)                 routes        PricingService   postgres/*          (NUMERIC money,
 renders server numbers only            validators    CouponService    memory/* (fallback)  transactions)
                                        controllers   CheckoutService
                                        errorHandler  OrderService
```

* **One pricing engine.** `PricingService` computes subtotal, discount, tax and total in integer paise. Cart, coupon validation, recommendation, checkout preview and order placement all call it, so numbers cannot disagree. The browser never sends a price or discount.
* **Strategy pattern** for coupons (`utils/DiscountStrategies.js`): `PercentageDiscount` and `FixedDiscount` compute a raw discount; the base class enforces the shared caps (max discount, never above subtotal).
* **Single demo cart** stored in the `cart_items` table (no accounts or auth, as the brief allows).
* **Repositories** hide SQL. `repositories/memory/` implements the same interfaces as a clearly separate, non-persistent fallback.

## Folder structure

```
smart-cart/
├─ database/            schema.sql, seed.sql
├─ docs/                API.md, TESTING.md, JUDGES_NOTES.md
├─ backend/
│  ├─ .env.example, package.json
│  ├─ scripts/setup-db.js
│  └─ src/
│     ├─ server.js, app.js
│     ├─ config/        env.js, db.js
│     ├─ routes/        api.js
│     ├─ controllers/   index.js
│     ├─ services/      PricingService, CartService, CouponService, CheckoutService, OrderService
│     ├─ repositories/  index.js, postgres/*, memory/*
│     ├─ models/        Product, Coupon, Order
│     ├─ middleware/    validators.js, errorHandler.js
│     └─ utils/         money.js, DiscountStrategies.js, AppError.js, asyncHandler.js
└─ frontend/
   ├─ index.html, vite.config.js, tailwind.config.js, postcss.config.js, package.json
   └─ src/
      ├─ main.jsx, App.jsx, index.css
      ├─ api/client.js
      ├─ context/       CartContext, ToastContext
      ├─ hooks/         useTheme
      ├─ utils/         format.js
      ├─ components/    Header, CartDrawer, CouponPanel, PriceSummary, ProductCard, ProductModal, ...
      └─ pages/         CatalogPage, CheckoutPage, OrderSuccessPage
```

## Run it (Windows PowerShell)

Prerequisites: Node.js 18+, PostgreSQL 13+.

```powershell
# 1. Create the database (adjust the user if needed)
psql -U postgres -c "CREATE DATABASE smart_cart;"

# 2. Backend
cd smart-cart\backend
Copy-Item .env.example .env        # edit DATABASE_URL with your Postgres password
npm install
npm run db:setup                   # creates tables + seeds 12 products and 5 coupons
npm run dev                        # API on http://localhost:5000

# 3. Frontend (new PowerShell window)
cd smart-cart\frontend
npm install
npm run dev                        # UI on http://localhost:5173
```

`npm run db:reset` drops all tables and re-seeds.

### No PostgreSQL available? In-memory fallback

```powershell
cd smart-cart\backend
$env:DB_MODE = "memory"; npm run dev
```

Or set `ALLOW_MEMORY_FALLBACK=true` in `.env` to fall back automatically when PostgreSQL is unreachable. **The fallback is not persistent**: orders and stock reset on every restart, and the server logs a warning at startup. The PostgreSQL implementation is the intended one and is complete.

## Seeded coupons

| Code | Rule | Minimum order |
|---|---|---|
| SAVE10 | 10% off, max ₹500 | ₹500 |
| FLAT100 | ₹100 off | ₹300 |
| SAVE20 | 20% off, max ₹1,000 | ₹3,000 |
| FLAT500 | ₹500 off | ₹5,000 |
| OLDDEAL | expired (tests expiry) | none |

Tax is 5% of (subtotal − discount); change `TAX_RATE_PERCENT` in `.env` (0 disables it).

## More

* [API reference](docs/API.md)
* [Manual test checklist](docs/TESTING.md)
* [Notes for judges](docs/JUDGES_NOTES.md)
