-- Add website_url field to gitgud_users table
ALTER TABLE gitgud_users
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_website_url ON gitgud_users(website_url) WHERE website_url IS NOT NULL;

-- Comment
COMMENT ON COLUMN gitgud_users.website_url IS 'Founder startup website/landing page URL (separate from video demo URL)';
