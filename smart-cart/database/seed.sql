-- Seed data. Safe to re-run (ON CONFLICT DO NOTHING).
INSERT INTO products (name, description, category, price, stock_quantity, image_url) VALUES
('Aurora Wireless Headphones', 'Over-ear Bluetooth 5.3 headphones with active noise cancellation and 40-hour battery life.', 'Audio', 4999.00, 25, 'headphones'),
('Pulse Portable Speaker', 'Water-resistant 20W Bluetooth speaker with 360-degree sound and 12-hour playtime.', 'Audio', 2499.00, 40, 'speaker'),
('Nimbus True Wireless Earbuds', 'Compact earbuds with transparency mode, touch controls and a wireless charging case.', 'Audio', 3499.00, 60, 'earbuds'),
('Orbit Smartwatch', 'AMOLED display, built-in GPS, heart-rate and sleep tracking, 7-day battery.', 'Wearables', 7999.00, 15, 'watch'),
('Stride Fitness Band', 'Slim activity tracker with step counting, SpO2 monitoring and 14-day battery.', 'Wearables', 1999.00, 50, 'tracker'),
('Atlas Laptop Backpack', 'Water-repellent 25L backpack with padded 15.6-inch laptop sleeve and hidden anti-theft pocket.', 'Accessories', 1799.00, 35, 'backpack'),
('VoltCharge 65W GaN Charger', 'Three-port fast charger for laptop, phone and tablet. Folding pins, travel friendly.', 'Accessories', 1299.00, 80, 'charger'),
('Keystone Mechanical Keyboard', 'Hot-swappable tenkeyless keyboard with tactile switches and per-key backlight.', 'Accessories', 5499.00, 4, 'keyboard'),
('Lumen LED Desk Lamp', 'Dimmable desk lamp with five colour temperatures and a wireless charging base.', 'Home', 1499.00, 30, 'lamp'),
('Drip Pour-Over Kettle', 'Stainless steel gooseneck kettle with temperature control for precise pour-over coffee.', 'Home', 2999.00, 12, 'kettle'),
('Cedar Yoga Mat', 'Extra-thick 6mm non-slip mat made from natural rubber, with carry strap.', 'Fitness', 999.00, 45, 'mat'),
('Summit Steel Water Bottle', 'Double-wall insulated 750ml bottle that keeps drinks cold for 24 hours or hot for 12.', 'Fitness', 599.00, 100, 'bottle')
ON CONFLICT (name) DO NOTHING;

INSERT INTO coupons (code, description, type, discount_value, min_subtotal, max_discount, expires_at) VALUES
('SAVE10',  '10% off, up to ₹500, on orders of ₹500 or more',       'PERCENTAGE', 10.00,  500.00,  500.00,  NULL),
('FLAT100', '₹100 off on orders of ₹300 or more',                   'FIXED',      100.00, 300.00,  NULL,    NULL),
('SAVE20',  '20% off, up to ₹1,000, on orders of ₹3,000 or more',   'PERCENTAGE', 20.00,  3000.00, 1000.00, NULL),
('FLAT500', '₹500 off on orders of ₹5,000 or more',                 'FIXED',      500.00, 5000.00, NULL,    NULL),
('OLDDEAL', 'Expired demo coupon (tests expiry handling)',          'FIXED',      200.00, 0.00,    NULL,    '2024-01-01T00:00:00Z')
ON CONFLICT (code) DO NOTHING;
