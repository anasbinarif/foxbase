-- 002_add_recommendation_effects.sql
-- Extend answer_effects to support recommendation (additive) effects.

-- No structural change needed beyond documenting the new type; type is a free text field
-- but we keep this migration as a place to evolve constraints if desired.

-- Example: you could add a CHECK constraint here in a real system.
-- For this challenge, we just rely on application-level validation.

-- This migration is intentionally a no-op at the DB level.

