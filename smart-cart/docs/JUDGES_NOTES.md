# Notes for judges

**Architecture.** Layered Express app: routes → validators → controllers → services → repositories → PostgreSQL. Controllers only translate HTTP; all rules live in services; all SQL lives in repositories. The React client renders server-provided numbers and holds only UI state (cart snapshot, chosen coupon code).

**OOP.** `PricingService` (single source of money math), `CartService`, `CouponService`, `CheckoutService`, `OrderService` are classes with injected dependencies. Coupon calculation uses the **Strategy pattern** (`PercentageDiscount`, `FixedDiscount` extending `DiscountStrategy`, which applies shared caps in one place, a template method). Domain models (`Product`, `Coupon`, `Order`) map DB rows to objects and objects to API shapes. Adding a new coupon type means one new strategy class.

**Database.** `products` ← `cart_items` (PK = product_id, one row per product). `orders` 1—N `order_items`. `order_items.product_id` is nullable (`ON DELETE SET NULL`) and each row stores a **snapshot** of name, unit price and line total, so history never changes when the catalog does. Money is `NUMERIC(12,2)`; the app converts to integer paise before any arithmetic, so there is no float drift. CHECK constraints block negative prices/quantities, percentages over 100, and discounts larger than the subtotal.

**Transactions.** `OrderService.placeOrder` runs inside one DB transaction: lock product rows (`SELECT … FOR UPDATE`) → re-price from those trusted rows → `UPDATE … WHERE stock_quantity >= qty` → insert order and items → clear cart → `COMMIT`. Any failure `ROLLBACK`s everything, so stock and orders never diverge, and concurrent checkouts cannot oversell.

**Duplicate-order protection.** The client generates an idempotency key per checkout attempt; `orders.idempotency_key` is UNIQUE. A repeat submit returns the original order instead of creating another. The button is also disabled while submitting.

**Standout feature: Smart Savings Assistant.** `CouponService.recommend` evaluates every active coupon through the same `PricingService.evaluateCoupon` used at checkout (expiry, minimum order, caps), ranks by real rupee savings, and explains the choice ("SAVE20 saves ₹1,000, which is ₹500 more than FLAT500."). It also hints at coupons the customer is close to unlocking. It re-runs after every cart or coupon change. A recommendation is visually distinct (amber "Suggested" card) from an applied coupon (green chip), and the frontend can't change the payable amount: only `/checkout/preview` and `/orders` determine it.

**Trade-offs.** Single demo cart (no auth), simulated payment, local emoji "images" instead of hosted photos, and an in-memory fallback kept separate from the PostgreSQL implementation.
