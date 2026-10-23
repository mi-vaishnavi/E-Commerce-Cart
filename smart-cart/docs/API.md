# API reference

Base URL `http://localhost:5000/api`. All bodies are JSON. Money is in rupees (INR); prices are always recalculated on the server.
Errors always look like `{ "error": { "code": "...", "message": "...", "details": { "field": "message" } } }`.

| Method | Path | Purpose |
|---|---|---|
| GET | /health | Liveness plus active database mode |
| GET | /products?category=Audio | List active products (category optional, case-insensitive) |
| GET | /products/:id | Product details |
| GET | /cart | Current (single demo) cart |
| POST | /cart/items | Add an item |
| PATCH | /cart/items/:productId | Set quantity (1-99) |
| DELETE | /cart/items/:productId | Remove an item |
| POST | /coupons/validate | Validate a coupon against the cart |
| POST | /coupons/recommend | Smart Savings Assistant |
| POST | /checkout/preview | Authoritative price breakdown |
| POST | /orders | Place the order (simulated) |
| GET | /orders/:orderId | Order confirmation |

## Cart

```http
POST /api/cart/items
{ "productId": 1, "quantity": 2 }
```
```json
201 { "cart": { "items": [ { "productId": 1, "name": "Aurora Wireless Headphones", "category": "Audio",
      "imageUrl": "headphones", "stockQuantity": 25, "unitPrice": 4999, "quantity": 2, "lineTotal": 9998 } ],
    "itemCount": 2, "subtotal": 9998 } }
```
Errors: `INSUFFICIENT_STOCK` / `OUT_OF_STOCK` (409), `PRODUCT_NOT_FOUND` (404), `VALIDATION_ERROR` (400).

`PATCH /api/cart/items/1` with `{ "quantity": 3 }` returns `{ "cart": ... }`. `DELETE /api/cart/items/1` returns `{ "cart": ... }` or 404 `ITEM_NOT_IN_CART`.

## Coupons

```http
POST /api/coupons/validate
{ "code": "SAVE10", "appliedCode": null }
```
```json
200 { "valid": true,
      "coupon": { "code": "SAVE10", "type": "PERCENTAGE", "description": "...", "discountValue": 10, "minSubtotal": 500, "maxDiscount": 500 },
      "discountAmount": 500,
      "breakdown": { "subtotal": 9998, "discount": 500, "tax": 474.9, "total": 9972.9, "...": "..." } }
```
Errors: `COUPON_NOT_FOUND` (404), `COUPON_EXPIRED`, `COUPON_INACTIVE`, `COUPON_MIN_NOT_MET`, `EMPTY_CART` (400), `COUPON_ALREADY_APPLIED` (409, when `code` equals `appliedCode`).

```http
POST /api/coupons/recommend
{ "appliedCode": "FLAT100" }
```
```json
200 { "recommendation": { "code": "SAVE20", "type": "PERCENTAGE", "savings": 1000,
        "explanation": "SAVE20 saves ₹1,000, which is ₹500 more than FLAT500.", "applied": false },
      "options": [ { "code": "SAVE10", "eligible": true, "savings": 500, "reason": null },
                   { "code": "OLDDEAL", "eligible": false, "savings": 0, "reason": "Coupon OLDDEAL has expired." } ],
      "hint": { "code": "SAVE20", "message": "Add ₹1,200 more to unlock SAVE20 and save at least ₹600." } }
```
`recommendation` is `null` for an empty cart or when no coupon applies. `applied: true` means the customer already uses the best coupon.

## Checkout preview

```http
POST /api/checkout/preview
{ "couponCode": "SAVE20" }
```
```json
200 { "breakdown": { "items": [ ... ], "itemCount": 2, "subtotal": 7498,
        "coupon": { "code": "SAVE20", "discountAmount": 1000, "...": "..." },
        "discount": 1000, "taxRatePercent": 5, "tax": 324.9, "total": 6822.9, "currency": "INR", "simulated": true } }
```

## Orders

```http
POST /api/orders
{ "customerName": "Asha Rao", "customerEmail": "asha@example.com",
  "shippingAddress": "12 MG Road, Mumbai 400001", "couponCode": "SAVE20",
  "idempotencyKey": "3f6c1c0e-6b7e-4e9a-9d58-0c2a4d1f7b11" }
```
```json
201 { "duplicate": false,
      "order": { "orderId": "ORD-20261023-9164B92F", "status": "CONFIRMED", "simulated": true,
        "customer": { "name": "Asha Rao", "email": "asha@example.com", "shippingAddress": "12 MG Road, Mumbai 400001" },
        "items": [ { "productId": 1, "name": "Aurora Wireless Headphones", "unitPrice": 4999, "quantity": 1, "lineTotal": 4999 } ],
        "pricing": { "subtotal": 7498, "couponCode": "SAVE20", "discount": 1000, "tax": 324.9, "total": 6822.9, "currency": "INR" },
        "createdAt": "2026-10-23T04:00:22.657Z" } }
```
* Re-sending the same `idempotencyKey` returns **200** with the original order and `"duplicate": true`; no second order or stock deduction.
* Errors: `VALIDATION_ERROR` (400, with per-field `details`), `EMPTY_CART` (400), `INSUFFICIENT_STOCK` (409), coupon errors as above.

`GET /api/orders/ORD-20261023-9164B92F` returns `{ "order": { ... } }` or 404 `ORDER_NOT_FOUND`.
