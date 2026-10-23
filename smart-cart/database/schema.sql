-- Smart Cart schema (PostgreSQL 13+). Safe to re-run: uses IF NOT EXISTS.
-- Money columns are NUMERIC(12,2); the app converts to integer paise before any arithmetic.

CREATE TABLE IF NOT EXISTS products (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(150)  NOT NULL UNIQUE,
  description    TEXT          NOT NULL,
  category       VARCHAR(60)   NOT NULL,
  price          NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  stock_quantity INTEGER       NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url      VARCHAR(255),            -- local image key rendered by the frontend (e.g. 'headphones')
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category) WHERE is_active;

CREATE TABLE IF NOT EXISTS coupons (
  id             SERIAL PRIMARY KEY,
  code           VARCHAR(40)   NOT NULL UNIQUE CHECK (code = UPPER(code)),
  description    VARCHAR(200),
  type           VARCHAR(12)   NOT NULL CHECK (type IN ('PERCENTAGE', 'FIXED')),
  discount_value NUMERIC(12,2) NOT NULL CHECK (discount_value > 0),   -- percent for PERCENTAGE, rupees for FIXED
  min_subtotal   NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (min_subtotal >= 0),
  max_discount   NUMERIC(12,2) CHECK (max_discount IS NULL OR max_discount > 0),
  expires_at     TIMESTAMPTZ,
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_percentage_range CHECK (type <> 'PERCENTAGE' OR discount_value <= 100)
);

-- Single demo cart (no user accounts in this MVP): one row per product.
CREATE TABLE IF NOT EXISTS cart_items (
  user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER     NOT NULL CHECK (quantity > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id
  ON cart_items(user_id);

CREATE TABLE IF NOT EXISTS orders (
  id               SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_number     VARCHAR(30)   NOT NULL,
  idempotency_key  VARCHAR(64),
  customer_name    VARCHAR(100)  NOT NULL,
  customer_email   VARCHAR(160)  NOT NULL,
  shipping_address TEXT          NOT NULL,
  subtotal         NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  discount_amount  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_amount       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount     NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  coupon_code      VARCHAR(40),
  status           VARCHAR(20)   NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED')),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_orders_order_number UNIQUE (order_number),
  CONSTRAINT uq_orders_idempotency_key UNIQUE (idempotency_key),
  CONSTRAINT chk_discount_le_subtotal CHECK (discount_amount <= subtotal)
);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

-- Snapshot of what was bought. product_id may become NULL if a product is ever deleted.
CREATE TABLE IF NOT EXISTS order_items (
  id           SERIAL PRIMARY KEY,
  order_id     INTEGER       NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id   INTEGER       REFERENCES products (id) ON DELETE SET NULL,
  product_name VARCHAR(150)  NOT NULL,
  unit_price   NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity     INTEGER       NOT NULL CHECK (quantity > 0),
  line_total   NUMERIC(12,2) NOT NULL CHECK (line_total >= 0)
);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
