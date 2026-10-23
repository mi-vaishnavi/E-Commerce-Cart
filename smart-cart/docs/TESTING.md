# Manual end-to-end checklist

Start backend + frontend, open http://localhost:5173.

**Catalog**
- [ ] 12 products load; skeletons show briefly. Category chips filter the list.
- [ ] "Details" opens a modal (Esc closes it). Keystone Keyboard shows "Only 4 left".
- [ ] Stop the backend and reload: an error state with "Try again" appears.

**Cart**
- [ ] Add 3 products. Header badge shows the total item count; a toast confirms each add.
- [ ] `+` / `−` update line totals, subtotal and payable amount immediately.
- [ ] Keyboard: increase to 4, then `+` is disabled ("Maximum available quantity"). Adding it again from the catalog says "Max in cart".
- [ ] Remove an item; remove everything and see the empty state.

**Coupons and Smart Savings Assistant**
- [ ] Cart subtotal ₹7,498 (Headphones + Speaker): assistant suggests **SAVE20** (saves ₹1,000). It is labelled "Suggested", and nothing is applied yet.
- [ ] Apply SAVE20: green "applied" chip, discount row appears, assistant says "Applied. This is your best saving."
- [ ] Type SAVE20 again on a fresh cart state: toast "already applied" (after applying it, the input is replaced by the chip).
- [ ] `OLDDEAL` shows "expired"; `NOPE` shows "does not exist".
- [ ] Cart of only a ₹599 bottle: `SAVE10` applies (min ₹500) but `FLAT500` and `SAVE20` do not. Hint text offers the nearest unlock.
- [ ] With SAVE20 applied, remove items until the subtotal is under ₹3,000: coupon is dropped automatically with a toast.
- [ ] Apply FLAT100, then use "Switch to …" on the suggestion.

**Checkout**
- [ ] "Go to checkout" shows the simulated-order notice, summary, coupon panel and breakdown (Subtotal, Coupon, Tax, Payable).
- [ ] Submit empty: inline errors under each field, focus moves to the first one.
- [ ] Valid details: button shows "Placing order…", then the success page with an order ID.

**Persistence and integrity**
- [ ] `GET http://localhost:5000/api/orders/<id>` returns the same order.
- [ ] `psql -d smart_cart -c "select * from orders; select * from order_items;"` shows the snapshot rows.
- [ ] Product stock dropped by the ordered quantity; cart is empty afterwards.
- [ ] `UPDATE products SET price = 1 WHERE id = 1;` then re-open the old order: prices unchanged.
- [ ] Double-click "Place order" quickly: only one order is created.
- [ ] Theme toggle switches light/dark and persists on reload.

**API spot checks (PowerShell)**
```powershell
Invoke-RestMethod http://localhost:5000/api/health
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/cart/items -ContentType application/json -Body '{"productId":8,"quantity":9}'   # 409 INSUFFICIENT_STOCK
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/orders -ContentType application/json -Body '{}'                                     # 400 VALIDATION_ERROR
```
