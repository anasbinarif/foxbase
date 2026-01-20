-- 003_add_attributes_index.sql
-- Add GIN index on products.attributes to optimize attribute-based filtering
-- used by additive recommendations with filter-based selection

-- GIN index for JSONB allows efficient queries on attributes like:
--   attributes->>'fireRating' = 'A'
--   (attributes->>'thicknessMm')::int >= 50
CREATE INDEX IF NOT EXISTS idx_products_attributes ON products USING GIN (attributes);

