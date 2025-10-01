-- Add rockstar check fields to gitgud_users table

ALTER TABLE gitgud_users
ADD COLUMN IF NOT EXISTS is_rockstar BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rockstar_reason TEXT,
ADD COLUMN IF NOT EXISTS rockstar_confidence INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rockstar_checked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS memory_notes TEXT,
ADD COLUMN IF NOT EXISTS extracted_info JSONB;

-- Create index for rockstar queries
CREATE INDEX IF NOT EXISTS idx_rockstar ON gitgud_users(is_rockstar) WHERE is_rockstar = TRUE;

-- Create index for rockstar_checked_at
CREATE INDEX IF NOT EXISTS idx_rockstar_checked ON gitgud_users(rockstar_checked_at);

COMMENT ON COLUMN gitgud_users.is_rockstar IS 'True if founder is famous/notable';
COMMENT ON COLUMN gitgud_users.rockstar_reason IS 'Why this founder is considered famous';
COMMENT ON COLUMN gitgud_users.rockstar_confidence IS 'AI confidence score (0-100)';
COMMENT ON COLUMN gitgud_users.rockstar_checked_at IS 'When rockstar check was last run';
COMMENT ON COLUMN gitgud_users.memory_notes IS 'Extracted user info from conversations';
COMMENT ON COLUMN gitgud_users.extracted_info IS 'Structured user info (JSON)';
