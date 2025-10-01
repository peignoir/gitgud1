# Memory Storage & Rockstar Check Features

## Overview

Two new features have been implemented:

1. **Memory Storage**: Automatically extracts and stores user information shared during chat conversations
2. **Rockstar Check**: AI-powered detection of famous/notable founders with red star badges

---

## Feature 1: Memory Storage

### What It Does
- Automatically extracts personal info from user messages during Sprint Phase check-ins
- Stores structured data in the database for AI agents to use
- Appends new info to existing memory (doesn't overwrite)

### Information Extracted
- **Location**: "I'm based in San Francisco", "living in NYC"
- **Current Role/Company**: "I'm a PM at Google", "working at Stripe"
- **Startup Ideas**: "I'm building a SaaS for developers"
- **Target Market**: "targeting small businesses", "for developers"
- **Skills**: "I'm good at Python", "experienced in ML"
- **Goals**: "my goal is to raise funding", "I want to launch by Q3"

### How It Works
1. User shares info during weekly check-in (Sprint Phase)
2. `extractUserInfo()` parses the message using pattern matching
3. Info is formatted and saved to `gitgud_users.memory_notes` (text) and `extracted_info` (JSON)
4. Memory is appended (not replaced) so historical context builds up
5. Future AI interactions have access to this context via Mastra memory

### Files Modified
- `/src/lib/utils/extract-user-info.ts` - Extraction logic
- `/src/components/journey/SprintPhase.tsx` - Integration in weekly check-ins
- `/src/app/api/users/route.ts` - Database storage

---

## Feature 2: Rockstar Check

### What It Does
- Researches founders using AI to determine if they're "famous" or notable
- Awards red star ⭐ badges on red gradient backgrounds to famous founders
- Shows confidence score and reasoning in admin view

### Criteria for "Famous"
A founder is marked as famous if they have:
1. Founded/co-founded a company that raised $10M+ in funding
2. Had a successful exit (acquisition or IPO)
3. Are well-known in their industry (speaker, thought leader, large following)
4. Have significant media coverage or awards
5. Previously worked at a famous startup in a senior role
6. Strong reputation in the startup ecosystem

**Note**: Being an employee at a big company is NOT enough (e.g., "worked at Google")

### How to Use

#### Run Rockstar Check on All Users
1. Go to `/admin/users` (admin only)
2. Click "⭐ Run Rockstar Check" button in header
3. Wait for AI to research each user (takes ~1-2 seconds per user)
4. View results in alert dialog
5. Red stars appear on famous founders' cards

#### API Endpoints
- **POST /api/rockstar-check** - Check single user: `{ userId: "..." }`
- **PUT /api/rockstar-check** - Check all users (admin only)

### Files Created/Modified
- `/src/lib/utils/rockstar-check.ts` - AI research logic using GPT-4o
- `/src/app/api/rockstar-check/route.ts` - API endpoints
- `/src/app/admin/users/page.tsx` - Red star display + check button
- `/src/app/dashboard/page.tsx` - Red star display (public)
- `/migrations/003_add_rockstar_fields.sql` - Database schema

### Database Fields Added
```sql
is_rockstar BOOLEAN DEFAULT FALSE
rockstar_reason TEXT
rockstar_confidence INTEGER (0-100)
rockstar_checked_at TIMESTAMP
memory_notes TEXT
extracted_info JSONB
```

---

## Setup Instructions

### 1. Run Database Migration

Connect to your Supabase database and run:

```bash
psql postgresql://your-connection-string -f migrations/003_add_rockstar_fields.sql
```

Or via Supabase SQL Editor:
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `migrations/003_add_rockstar_fields.sql`
3. Execute

### 2. Environment Variables

No new env vars needed - uses existing `OPENAI_API_KEY`

### 3. Test Memory Extraction

1. Start journey: `/founder-journey`
2. Complete onboarding → Profile → Challenge → Evaluation
3. Reach Sprint Phase
4. In weekly check-in, type:
   ```
   I'm based in San Francisco. I'm building a SaaS for developers
   targeting small startups. My goal is to raise $1M in seed funding.
   ```
5. Check console logs for: `📝 [User Info] Extracted from chat:`
6. Check database: `SELECT memory_notes FROM gitgud_users WHERE email = 'your@email.com'`

### 4. Test Rockstar Check

#### Option A: Manual (Recommended for Testing)
1. Go to `/admin/users`
2. Click "⭐ Run Rockstar Check"
3. Wait for completion alert
4. Refresh page to see red stars

#### Option B: API Call
```bash
curl -X PUT http://localhost:3001/api/rockstar-check \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"
```

---

## Visual Indicators

### Red Star (Rockstar)
- **Color**: Red-to-pink gradient background
- **Position**: Top-right of user card
- **Meaning**: Famous founder detected by AI
- **Hover**: Shows reason why they're famous

### Yellow Star (High Demo Score)
- **Color**: White/transparent background
- **Position**: Top-right of user card (if not rockstar)
- **Meaning**: Demo score >= 50 (ready for event demos)

---

## AI Research Process

When checking if a founder is a rockstar:

1. **Gather Data**: Name, bio, LinkedIn URL, email
2. **AI Prompt**: GPT-4o researches founder with strict criteria
3. **Analysis**: Looks for funding, exits, media coverage, leadership roles
4. **Response**: JSON with `isFamous`, `confidenceScore`, `reason`, `achievements`
5. **Storage**: Results saved to database
6. **Cache**: `rockstar_checked_at` prevents re-checking same user

---

## Rate Limits

- Rockstar check uses GPT-4o (cheaper/faster than GPT-5)
- Batch check includes 1-second delay between users to avoid throttling
- Recommended: Run batch check during off-peak hours

---

## Future Enhancements

1. **Auto-run on profile creation**: Check famous status when bio is first generated
2. **Webhook integration**: Real-time checks when LinkedIn URL is added
3. **Quick check**: Use bio pattern matching before AI call (faster)
4. **Tiered stars**: Bronze/Silver/Gold based on confidence score
5. **Public API**: Allow founders to verify their own rockstar status

---

## Troubleshooting

### Memory not saving
- Check console logs for "📝 [User Info] Extracted from chat"
- Verify `memory_notes` column exists in database
- Ensure user is authenticated

### Rockstar check fails
- Check OpenAI API key is valid
- Review console errors in browser and server
- Verify database columns exist
- Check rate limits on OpenAI account

### Red stars not showing
- Run migration SQL to add `is_rockstar` column
- Check `/api/users?all=true` returns rockstar fields
- Clear browser cache
- Reload users in admin panel

---

## Summary

✅ **Memory Storage**: Automatically captures user context from conversations
✅ **Rockstar Detection**: AI-powered famous founder identification
✅ **Visual Indicators**: Red stars for rockstars, yellow for high performers
✅ **Admin Tools**: One-click batch checking for all users
✅ **Database Integration**: Persistent storage with confidence scores

Both features work together to give AI agents richer context about users while highlighting notable founders in the community.
