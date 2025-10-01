# Challenge Phase Assessment Update

## Overview
Updated the Challenge Phase to include an intelligent assessment conversation when the submission timer expires without deliverables. This ensures founders are properly evaluated and placed in the right house based on their commitment level and ambitions.

## Changes Made

### 1. Frontend - ChallengePhase Component (`/mobile-app/src/components/journey/ChallengePhase.tsx`)

#### New State Variables
- `submissionTimeExpired`: Tracks when submission timer runs out
- `isAssessmentPhase`: Indicates we're in assessment conversation mode
- `assessmentComplete`: Marks when assessment is done and house decision made
- `houseDecision`: Stores the house assignment (Venture House or Bootstrap House)
- `houseReasoning`: Stores the explanation for the decision

#### Updated Functions

**`autoSubmit()`**
- Instead of showing alert, now triggers `startAssessment()` when no submission
- If deliverables exist, proceeds with normal submission

**`startAssessment()`** (NEW)
- Calls API with `challengeMode: 'assessment'`
- Guddy asks empathetic questions about what happened
- Opens conversation to understand commitment level

**`handleSendMessage()`**
- Enhanced to handle assessment-response mode
- Extracts house decision and reasoning from AI response
- Sets `assessmentComplete` when decision is made

#### UI Updates

**Deliverables Panel**
- Shows "⏰ Time is up!" alert when expired
- Displays house decision card with:
  - House name (Venture House 🏰 or Bootstrap House 🏡)
  - Detailed reasoning from AI
  - Gradient styling based on house
- Three button states:
  1. Normal: "✅ Submit Challenge" (when not expired)
  2. Waiting: "Complete the conversation above" (disabled during assessment)
  3. Ready: "➡️ Continue to [House Name]" (after assessment complete)
- All input fields greyed out when expired

**Chat Interface**
- Updated placeholder text during assessment: "Answer Guddy's questions..."
- Shows empathy message: "💬 Answer honestly so we can find the right path for you!"

### 2. Backend - API Route (`/mobile-app/src/app/api/founder-journey/stream/route.ts`)

#### Phase Handling
- Added `assessment` to phase switch cases (uses coach agent)

#### New Assessment Prompts

**`challengeMode: 'assessment'`** (Initial Message)
- Empathetic opening: acknowledges no submission
- Asks what happened (bug, technical issue, roadblock?)
- Probes commitment: "Can you commit 3 weeks?"
- Assesses scale: "Small side project or something massive?"

**`challengeMode: 'assessment-response'`** (Follow-up)
- Analyzes founder's response
- Decision criteria:
  - **Venture House**: Serious, can commit 3+ weeks, wants scale
  - **Bootstrap House**: Small project, casual, learning mode
- Can ask follow-up questions if response is vague
- Outputs house decision in final sentence

#### Response Parsing
- Detects house decision keywords in AI response
- Extracts reasoning (text before house announcement)
- Returns in complete event: `{ houseDecision, reasoning }`

## User Flow

### Normal Flow (With Submission)
1. Timer expires → switches to submission phase (5 min)
2. Founder submits video + 5-liner
3. Proceeds to evaluation phase

### Assessment Flow (No Submission)
1. Timer expires → no deliverables submitted
2. Guddy asks: "What happened? Are you serious? Can you commit 3 weeks?"
3. Founder responds honestly
4. Guddy may ask follow-ups or make decision
5. House assigned with explanation:
   - "Welcome to the **Venture House** - let's build something massive. 🏰"
   - "You're heading to the **Bootstrap House** - let's build smart and profitable. 🏡"
6. Founder clicks "Continue to [House Name]"
7. Proceeds to next phase with house assignment data

## House Decision Logic

### Venture House
- Serious about building big
- Can commit 3+ weeks focused time
- Wants to build for scale (not side project)
- Shows resilience and ambition

### Bootstrap House
- Small product/side project goals
- Casual or part-time commitment
- Not ready for intensive sprint
- Learning mode, not scaling mode

## Design Decisions

### Why Assessment vs Auto-Continue?
- **User Intent**: Understand if founder is serious or just exploring
- **Right Placement**: Put founders in house that matches their goals
- **Empathy**: Acknowledge that failures happen, give second chance
- **Quality**: Filter out those who aren't ready for 3-week commitment

### Why House Decision Here?
- **Natural Timing**: No submission = perfect moment to assess commitment
- **Personalized**: AI can ask follow-ups based on specific responses
- **Transparent**: Founder understands WHY they were placed in that house

## Next Steps

The next phase should show Guddy with different personalities based on house:
- **Venture House Guddy**: Intense, ambitious, high-growth focused
- **Bootstrap House Guddy**: Profitable, sustainable, community-focused

## Technical Notes

- Assessment state persisted in localStorage
- Conversation history passed to AI for context
- House decision regex pattern matching
- Graceful fallback if AI doesn't return decision format
