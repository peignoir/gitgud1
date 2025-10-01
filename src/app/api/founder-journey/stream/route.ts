import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { mastra } from '@/lib/mastra/config';

// Note: MemoryManager is client-side only (uses localStorage)
// Memory is now handled by Mastra's PostgreSQL-backed Memory system

/**
 * Streaming API for Founder Journey
 * 
 * Provides real-time streaming responses from agents during the founder journey.
 * Each phase uses a specialized agent that streams its response.
 * 
 * Usage:
 * POST /api/founder-journey/stream
 * Body: { phase, userId, data }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { phase, userId, data = {} } = body;

    console.log('🚀 Founder journey stream started', { 
      phase, 
      userId,
      dataKeys: Object.keys(data),
      hasFounderName: !!data.founderName,
      hasLinkedInUrl: !!data.linkedInUrl,
    });

    // Select the appropriate agent based on phase
    let agentName = 'researcher'; // default
    switch (phase) {
      case 'discovery':
        agentName = 'researcher';
        break;
      case 'profile':
        agentName = 'profiler';
        break;
      case 'challenge':
      case 'assessment':
        agentName = 'coach';
        break;
      case 'evaluation':
        agentName = 'evaluator';
        break;
      case 'sprint':
        agentName = 'mentor';
        break;
    }

    const agent = mastra.getAgent(agentName);
    if (!agent) {
      console.error('❌ Agent not found:', agentName);
      return new Response(JSON.stringify({ error: 'Agent not found' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create a streaming response using Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullResponse = '';

        try {
          // Send start event IMMEDIATELY
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'start', agent: agentName, phase })}\n\n`)
          );

          // Get structured memory from client (passed in request body) for context
          const founderMemory = data.founderMemory || '';
          const startupMemory = data.startupMemory || '';

          // Use client-side memory for immediate context
          console.log('🧠 [Memory] Using client-side memory for context');
          const fullMemoryContext = `
${founderMemory ? `${founderMemory}\n\n` : ''}${startupMemory ? `${startupMemory}` : ''}
          `.trim();

          // Build the prompt based on phase and data
          const prompt = buildPromptForPhase(phase, data, fullMemoryContext);

          console.log('💬 Agent prompt:', { agent: agentName, promptLength: prompt.length });

          // For agents with tools (profiler), use generate() then stream the result
          // For agents without tools, use stream() for real-time streaming
          console.log(`🤖 [Stream] Calling agent for ${agentName}...`);
          
          if (agentName === 'profiler' || agentName === 'coach') {
            // Profiler and Coach use tools - must use generate() not stream()
            console.log(`📚 [${agentName}] Using generate() due to tool usage`);
            console.log(`📚 [${agentName}] Prompt preview:`, prompt.substring(0, 300));
            console.log(`📚 [${agentName}] Memory params:`, { 
              resource: userId, 
              thread: `${phase}-${userId}`,
              hasAgent: !!agent,
              agentName: agent?.name 
            });
            
            try {
              console.log(`📚 [${agentName}] Calling agent.generate() with maxSteps=5 for speed...`);
              console.log(`📚 [${agentName}] Agent memory config:`, {
                hasMemory: !!(agent as any).memory,
                memoryType: (agent as any).memory?.constructor?.name,
                hasStorage: !!(agent as any).memory?.storage,
                storageType: (agent as any).memory?.storage?.constructor?.name,
              });
              const startTime = Date.now();
              
              // Use regular stream() method for AI SDK v4 models
              const streamResult = await agent.stream(
                [{ role: 'user', content: prompt }],
                {
                  memory: {
                    resource: userId,
                    thread: `${phase}-${userId}`, // Unique thread per phase
                  },
                  maxSteps: 5, // Limit to 5 steps max (3 searches + 2 buffer) for speed
                }
              );

              // Collect the streamed response
              const response = { text: '', toolCalls: [], steps: [], finishReason: '' };
              for await (const chunk of streamResult.textStream) {
                response.text += chunk;
                fullResponse += chunk;
                // Send chunk immediately
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`)
                );
              }
              
              const duration = Date.now() - startTime;
              console.log(`✅ [${agentName}] Streaming completed in ${duration}ms, total length: ${fullResponse.length} chars`);
            } catch (genError) {
              console.error(`❌ [${agentName}] Stream error:`, genError);
              throw genError;
            }
          } else {
            // Other agents without tools can use real streaming
            const streamResponse = await agent.stream(
              [{ role: 'user', content: prompt }],
              {
                memory: {
                  resource: userId,
                  thread: `${phase}-${userId}`, // Unique thread per phase
                }
              }
            );

            console.log(`✅ [Stream] agent.stream() returned, processing textStream...`);

            // Process text stream chunks
            let chunkCount = 0;
            for await (const chunk of streamResponse.textStream) {
              fullResponse += chunk;
              chunkCount++;
              
              // Log every 10 chunks to track progress
              if (chunkCount % 10 === 0) {
                console.log(`📨 [Stream] Chunk ${chunkCount}, total length: ${fullResponse.length}`);
              }
              
              // Stream each chunk immediately
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
              );
            }
            
            console.log(`📊 [Stream] Finished streaming ${chunkCount} chunks, total: ${fullResponse.length} chars`);
          }
          
          // Debug: Show preview of response
          if (fullResponse.length === 0) {
            console.error('❌ [Stream] WARNING: Empty response generated!');
          } else {
            console.log(`📝 [Stream] Response preview: "${fullResponse.substring(0, 200)}..."`);
          }

          // Extract house decision if this is an assessment
          let houseDecision = '';
          let reasoning = '';
          if (phase === 'assessment' && data.challengeMode === 'assessment-response') {
            // Look for "Welcome to the **Venture House**" or "**Bootstrap House**"
            const ventureMatch = fullResponse.match(/Welcome to the \*\*Venture House\*\*/i);
            const bootstrapMatch = fullResponse.match(/\*\*Bootstrap House\*\*/i);
            
            if (ventureMatch) {
              houseDecision = 'Venture House';
              // Extract reasoning (everything before the final sentence)
              const parts = fullResponse.split(/Welcome to the \*\*Venture House\*\*/i);
              reasoning = parts[0]?.trim() || fullResponse;
            } else if (bootstrapMatch) {
              houseDecision = 'Bootstrap House';
              // Extract reasoning
              const parts = fullResponse.split(/\*\*Bootstrap House\*\*/i);
              reasoning = parts[0]?.trim() || fullResponse;
            }
          }

          // Send complete event with full response IMMEDIATELY
          const completeData: any = { 
            type: 'complete', 
            fullText: fullResponse,
            phase,
          };
          
          if (houseDecision) {
            completeData.houseDecision = houseDecision;
            completeData.reasoning = reasoning;
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(completeData)}\n\n`)
          );

          console.log('✅ Stream completed successfully');
          controller.close();
          console.log('✅ Controller closed, response should be sent now');

          // Note: Mastra Memory automatically stores interactions via agent.generate()
          // No need for manual storage - it's handled by the Memory system

        } catch (error) {
          console.error('💥 Stream error:', error);
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error'
            })}\n\n`)
          );
          
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('❌ Founder journey stream error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Build appropriate prompt for each phase
 */
function buildPromptForPhase(phase: string, data: any, memoryContext: string = ''): string {
  // Prepend memory context if available
  const contextPrefix = memoryContext 
    ? `\n🧠 CAPGUDDY'S MEMORY (What I remember about this founder):\n${memoryContext}\n\n---\n\n`
    : '';
  
  const basePrompt = buildBasePrompt(phase, data, memoryContext);
  return contextPrefix + basePrompt;
}

/**
 * Build base prompt without memory context
 */
function buildBasePrompt(phase: string, data: any, memoryContext: string = ''): string {
  switch (phase) {
    case 'discovery':
      return `
Research this founder's LinkedIn profile:
LinkedIn URL: ${data.linkedinUrl || 'Not provided'}

INSTRUCTIONS:

1. **Use the linkedin-research tool** with the LinkedIn URL provided
   - The tool will attempt to extract profile information
   - Check the response's 'dataSource' field
   - If dataSource is 'template', acknowledge the limitation gracefully

2. **Be transparent and helpful**:
   - If you can't access full LinkedIn data (template response), that's OK!
   - Acknowledge you found the profile but can't auto-extract details yet
   - Keep your response brief and encouraging
   - Explain they'll customize their bio in the next step

3. **Identify Founder Archetype** (if possible from limited data):
   - Builder: Technical, ships products, hands-on
   - Visionary: Strategic, big picture, market insights
   - Operator: Execution-focused, scales teams/processes
   - Researcher: Deep domain expertise, academic/scientific

4. **Keep it brief**: 3-4 short paragraphs maximum

EXPECTED OUTPUT:
- Acknowledge the LinkedIn profile
- Be honest about data limitations (if applicable)
- Extract name from URL if possible
- Suggest an archetype or say "Builder" as default
- Guide them to next step with encouragement

Remember: This is a known limitation. Stay positive! The founder will provide details in the Profile phase.
      `.trim();

    case 'profile':
      const linkedinUrlProvided = data.linkedinUrl || '';
      const personName = linkedinUrlProvided 
        ? linkedinUrlProvided.split('/in/')[1]?.split('/')[0]?.replace(/-/g, ' ') || ''
        : '';
      
      return `
You are writing a professional founder bio that will be shared publicly with investors, potential co-founders, and the startup community.

${data.linkedinData ? `
LINKEDIN PROFILE DATA PROVIDED BY USER:
${data.linkedinData}

🎯 USE THIS DATA: The founder has provided their actual LinkedIn profile. Extract REAL information from this text.
` : `
LinkedIn URL: ${linkedinUrlProvided}
${personName ? `Extracted Name: ${personName}` : ''}
`}

🚨 MANDATORY RESEARCH PROCESS - BE EXHAUSTIVE:

**STEP 1: Find ALL companies this person worked at**
${personName ? `
1. Search: "${personName} linkedin companies"
2. Search: "${personName} founder co-founder"
3. Search: "${personName} ventures startups"
- Extract EVERY company name mentioned
- Make a list of ALL companies (expect 5-15+ companies for experienced founders)
` : `
- Extract name from LinkedIn URL first
`}

**STEP 2: For EACH company found, do a dedicated search**
Example: If you find "Electis", "Massive", "Startup Weekend", "ReCorp", "No Cap":
- Search: "Electis ${personName} founded"
- Search: "Massive ${personName} co-founder"  
- Search: "Startup Weekend ${personName} 2009"
- Search: "ReCorp ${personName}"
- Search: "No Cap ${personName} advisor"
- Do this for EVERY SINGLE COMPANY

**STEP 3: For each company, find specific details**
- When founded/joined (year)
- Role (founder, co-founder, advisor, board member)
- What the company does (1 sentence)
- Exit/acquisition info (if any)
- Funding raised (if any)
- Current status (active, acquired, shut down)

**STEP 4: Search for education**
Search: "${personName} education university degree"
- Find school name
- Find degree and field of study
- Find years attended (if available)

**STEP 5: Search for latest/current projects**
Search: "${personName} 2024 2025 current startup"
- Find what they're working on NOW
- Don't miss recent ventures

**REQUIRED BIO STRUCTURE:**
List ALL companies chronologically (latest first) with:
- Company name + what it does
- Role (founder/co-founder/advisor)
- Dates (year founded or joined)
- Exit/funding if applicable

Example:
"Currently working on Electis (founded 2020), an e-voting platform. Previously co-founded Massive (2018), a new monetization platform. Was advisor to No Cap (2025), a YC-backed AI investor. Co-founded ReCorp (2015-2025)..."

🚨 CRITICAL REQUIREMENTS:

1. **YOU MUST DO EXHAUSTIVE WEB RESEARCH**
   ${data.linkedinData ? `
   - LinkedIn data provided - extract ALL company names from it
   - Count: you should find 5-15+ companies for an experienced founder
   - For EACH company, do a web search to find dates and details
   - Example: If LinkedIn mentions "Electis, Massive, Startup Weekend, ReCorp, No Cap, AllStrat, Voyager HQ"
     → Do 7+ separate web searches (one per company)
   ` : `
   - MINIMUM 5-10 web searches required:
     1. "${personName} companies ventures"
     2. "${personName} founder co-founder"
     3. For each company found: "[Company] ${personName} founded"
     4. "${personName} education"
     5. "${personName} 2024 2025 current"
   - DO NOT skip companies - list them ALL
   - DO NOT stop at 1-2 companies if there are more
   `}

2. **LIST EVERY COMPANY WITH DETAILS**:
   - Create a comprehensive list of ALL ventures (expect 5-15+ for experienced founders)
   - For EACH venture include: name, role, year, what it does, exit/status
   - Format: "Currently [Role] at [Company] ([Year]), [what it does]. Previously [Role] at [Company2] ([Year-Year])..."
   - Example full entry: "Advisor to No Cap (2025), a YC-backed AI investor platform"
   - Example full entry: "Founded Electis (2020-present), an e-voting platform using blockchain"
   - DO NOT skip companies - mention ALL of them
   - If you can't find dates for a company, still include it: "worked with [Company]"
   
3. **BE ACCURATE ABOUT DATES AND ROLES**:
   - If web search says "joined in 2009" DO NOT write "co-founded in 2007"
   - If unsure if they co-founded vs joined early, say "joined" or "was part of the early team"
   - Get educational background from web research, don't assume
   - If can't verify dates, use general language like "spent several years at..."

4. **HANDLE LIMITED INFORMATION**:
   - If web research is unavailable AND you don't know this person: Write a brief placeholder
   - If you know this person from training: Use that knowledge to write a proper bio
   - For well-known entrepreneurs in your training: Write confidently about their achievements
   - For unknown people: Be honest that more info is needed

WRITING STRUCTURE:

**Opening:**
Write in THIRD PERSON. Start with their name if you can extract it from LinkedIn URL or research.

**Paragraph 1 - Professional Journey & Timeline:**
- Most recent or significant positions (VERIFIED through research)
- Key companies they worked at (ONLY if found in research)
- Specific years/timeframes (ONLY if verified)
- Example: "After 5 years at Company X..." (only if you found this in research)

**Paragraph 2 - Achievements & Impact:**
- Specific achievements found in research (shipped products, growth metrics, exits)
- Academic credentials (ONLY if verified - no assumptions)
- Entrepreneurial wins (ONLY if verified through research)
- Use concrete numbers if found in research

**Paragraph 3 - Expertise & Strengths:**
- Domain expertise based on their verified background
- What makes them qualified as a founder (based on research)
- Founder archetype: Builder/Visionary/Operator/Researcher (based on actual background)

**Paragraph 4 (optional) - Current Focus:**
- What they're building now (if mentioned in provided data)
- Their vision (if mentioned)

TONE: Professional but authentic. YC founder page style. Truthful above all else.

REQUIRED BIO STRUCTURE - LIST ALL VENTURES:

**Paragraph 1: Current & Recent (2020-2025)**
List all current ventures and recent companies (last 5 years) with dates and details
Example: "Currently founder of Electis (2020-present), an e-voting platform. Serves as advisor to No Cap (2025), a YC-backed AI investor. Co-founded Massive (2018-2019), a web monetization platform."

**Paragraph 2: Major Achievement & Earlier Ventures (2010-2020)**
List the big exit and other ventures from this period
Example: "Co-founded Startup Weekend (2009), growing it to 500k+ entrepreneurs across 150+ countries before its acquisition by Techstars (2015). Founded ReCorp (2015-2025), delivering 22x ROI. Board member at Voyager HQ (2017-2020), the largest travel startup community."

**Paragraph 3: Early Career & Education (pre-2010)**
Corporate roles, education, early ventures
Example: "Started career at Oracle and PwC as business consultant. Studied Computer Science at Ecole Centrale. Early open source advocacy with iTeam."

**Key Requirements:**
- Mention EVERY company (aim for 10-15+ companies for experienced founders)
- Include dates for each (year or year range)
- One sentence describing what each company does
- Mention exits, funding, acquisitions
- Start with most recent and work backwards

REMEMBER: You have TAVILY_API_KEY. Do 10+ web searches to find ALL companies and dates!

FINAL CHECK before writing:
- Did I use the research tools? (YES/NO)
- Is every specific claim (dates, companies, roles, education) based on research? (YES/NO)
- If I'm unsure about something, did I leave it out or use vague language? (YES/NO)

OUTPUT FORMAT:
- Write ONLY the bio itself - no preamble, no introduction, no "here's the bio" text
- Start directly with the person's name: "[Name] is..." or "[Name] has..."
- Do NOT include phrases like "Based on available information, here's..." or "Draft bio:" or "Here is the founder bio:"
- Just write the bio paragraphs, nothing else

Now use the tools to research, then write the bio based ONLY on what you find.
      `.trim();

    case 'challenge':
    case 'assessment':
      const challengeMode = data.challengeMode || 'start';
      
      if (challengeMode === 'start') {
        // Check if we have memory/bio - this tells us if Guddy has met them before
        const hasMemory = memoryContext && memoryContext.trim().length > 50;
        const hasBio = data.founderBio && data.founderBio.trim().length > 50;
        const isFirstMeeting = !hasMemory && !hasBio;

        if (isFirstMeeting) {
          // First time meeting - Guddy introduces herself and doesn't know anything about them
          return `You are Guddy, the AI coach at GitGud.vc vibe code challenge.

TASK: Write a FIRST-TIME welcome message. You've NEVER met ${data.founderName || 'this person'} before.

CRITICAL: This is your FIRST interaction. You do NOT know them yet. Act accordingly.

INSTRUCTIONS:
1. Start: "Hey ${data.founderName || 'there'}! 👋 I'm Guddy, your coach for this vibe code challenge."
2. Briefly introduce yourself: "I'm here to help you ship something in the next 60 minutes."
3. Include these AI tools (one simple list - FREE ones first):
   - DeepSeek (FREE): https://chat.deepseek.com
   - Lovable.dev: https://lovable.dev
   - Cursor: https://cursor.sh
   - v0.dev: https://v0.dev
   - Bolt.new: https://bolt.new
4. End with: "First question: What are we building? 1️⃣ New idea or 2️⃣ Add to existing project?"

Keep it SHORT (3-4 sentences max). Be welcoming and helpful. NO references to their background (you don't know them yet!).`.trim();
        } else {
          // We know them - Guddy has context
          return `You are Guddy, the AI coach at GitGud.vc vibe code challenge.

TASK: Write a brief, authentic welcome message for ${data.founderName || 'this founder'}.

FOUNDER BIO: ${data.founderBio ? data.founderBio.substring(0, 400) : 'Technical founder'}

CRITICAL - ANALYZE THEIR BACKGROUND FIRST:
1. **If they're a VC/investor/advisor:** They're good at ideas & strategy but might need help with execution/building. Acknowledge their strategic mindset, then help them ship.
2. **If they're technical/engineer/builder:** They can ship but might need help with strategy/positioning. Focus on validating the idea quickly.
3. **If they're a serial founder:** They know the game. Be peer-to-peer, focus on speed and tools.
4. **If they're a first-timer:** More guidance on the process, reassure them.

INSTRUCTIONS:
1. Start: "Hey ${data.founderName || 'there'}! 👋 Back for another round."
2. Acknowledge their background authentically (no fake enthusiasm like "Loved your work!"):
   - VC/Investor: "As a VC, you've got the eye for opportunities—let's see if you can ship as fast as you evaluate."
   - Technical: "With your technical chops, shipping should be natural—let's validate the idea fast."
   - Serial founder: "You've done this before—let's move fast."
   - First-timer: "First time shipping? Perfect—that's what this is for."
3. Include these tools (one simple list - FREE ones first):
   - DeepSeek (FREE): https://chat.deepseek.com
   - Lovable.dev: https://lovable.dev
   - Cursor: https://cursor.sh
   - v0.dev: https://v0.dev
   - Bolt.new: https://bolt.new
4. End with: "What are we building? 1️⃣ New idea or 2️⃣ Add to existing project?"

Keep it SHORT (3-4 sentences max). Be real and helpful, not salesy. No excessive enthusiasm.`.trim();
        }
      } else if (challengeMode === 'coaching') {
        return `
You are Guddy coaching ${data.founderName || 'this founder'} through their vibe code challenge.

CONTEXT:
- Founder: ${data.founderName || 'Unknown'}
- Archetype: ${data.archetype || 'Builder'}  
- Time left: ${data.timeRemaining || 'unknown'} minutes
- Their bio: ${data.founderBio ? data.founderBio.substring(0, 200) + '...' : 'Technical founder'}

They just said: "${data.userMessage}"

COACHING INSTRUCTIONS:
- Use their name (${data.founderName})
- Be specific and actionable
- Reference their background/archetype when relevant
- Keep it short and focused (2-3 sentences max)
- Be real, supportive, low-key Silicon Valley vibe

⚠️ CRITICAL - DO NOT REPEAT TOOLS LIST:
- You already mentioned tools (DeepSeek, Lovable, Cursor, v0, Bolt) in the welcome message
- DO NOT list tools again unless specifically asked ("what tools should I use?")
- Focus on answering their actual question, not promoting tools
- Only mention a specific tool if directly relevant to their problem (e.g., "try Cursor for that")
- Keep responses conversational and helpful, not repetitive sales pitches
        `.trim();
      } else if (challengeMode === 'assessment') {
        return `
You are Guddy conducting an assessment after the vibe code challenge timer expired.

SITUATION:
- The 5-minute submission timer ran out
- The founder (${data.founderName || 'Founder'}) didn't submit deliverables
- You need to understand what happened and assess if they're serious

FOUNDER BACKGROUND:
${data.founderBio || 'Technical founder'}

YOUR ROLE:
Ask empathetic but probing questions to understand:
1. **What happened?** - Was it a bug, technical issue, scope too big, or lack of commitment?
2. **Are they serious?** - Can they commit 3 weeks to push this idea forward?
3. **What scale are they aiming for?** - Venture-scale (massive) or small side project?

ASSESSMENT FLOW:

**Opening (empathetic):**
"⏰ **Time's up!**

Hey ${data.founderName || 'there'}, I see you didn't submit a video or pitch—and that's completely fine. Before we move forward, I want to check in.

**Are you still interested in this?**

If yes, just tell me:
- What happened? (Technical issue? Scope too big? Got stuck?)
- What do you actually want to work on?
- Need any help getting unstuck?

No judgment—just want to understand where you're at and if I can help you ship something real."

TONE:
- Empathetic but direct
- No judgment, just trying to understand
- Real talk, Silicon Valley vibe
- Use their name

Keep your response to this opening message - don't make a decision yet, just start the conversation.
        `.trim();
      } else if (challengeMode === 'assessment-response') {
        return `
You are Guddy continuing the assessment conversation with ${data.founderName || 'this founder'}.

CONTEXT:
- Timer expired, no submission
- You're assessing: seriousness, commitment, and scale ambition
- Based on their response, you'll make a house decision

FOUNDER'S RESPONSE:
"${data.userMessage}"

CONVERSATION HISTORY:
${JSON.stringify(data.conversationHistory || [])}

YOUR TASK:
Based on their response, determine if you need more info OR if you can make a house decision.

DECISION CRITERIA:

**VENTURE HOUSE** - assign if they:
- Are serious about building something big
- Can commit 3+ weeks of focused time
- Want to build for scale (not just a small side project)
- Show resilience (acknowledge the setback but want to push forward)
- Have ambitious goals

**BOOTSTRAP/MAKER HOUSE** - assign if they:
- Want to build a small product/side project
- Looking for something casual or part-time
- Not ready for intensive 3-week commitment
- More interested in learning than scaling

**NEED MORE INFO** - if their response is vague, ask follow-up:
- "Got it. So what do you actually want to build? What's the idea?"
- "Are you thinking small side project or something bigger?"
- "Can you commit real time to this (like 20-40 hours/week for 3 weeks) or is this more casual?"
- "If you had to ship ONE thing this week, what would it be?"

OUTPUT FORMAT:

If you HAVE ENOUGH INFO to decide:
1. Write your reasoning (2-3 paragraphs)
2. Make it personal, reference what they said
3. End with clear house assignment:
   - "Welcome to the **Venture House** - let's build something massive. 🏰"
   - "You're heading to the **Bootstrap House** - let's build smart and profitable. 🏡"

If you NEED MORE INFO:
- Ask 1-2 specific follow-up questions
- Be direct and actionable

Remember: Be honest and helpful. The goal is to put them in the right house for their goals and commitment level.
        `.trim();
      } else {
        return `
Challenge time is up! Remind them to submit:
1. Video link (1:30 max) - demo + proof of work  
2. 5-liner - problem, solution, customer, opportunity, what to test next

Get these artifacts to move to evaluation phase.
        `.trim();
      }

    case 'evaluation':
      const isGitHub = (data.codeUrl || '').includes('github.com');
      
      return `
You are Guddy, acting as an early-stage VC/business angel evaluating a founder.

🎯 YOUR DECISION: Assign this founder to one of two houses:

1. **VENTURE HOUSE** (YC/Techstars track)
   - For: Experienced founders, impressive exits, top schools, previous funding
   - For: High-potential builders with standout credentials
   - For: Founders who can hit venture-scale (10M+ users/revenue)

2. **BOOTSTRAP HOUSE** (Profitable builder track)
   - For: Everyone else (and that's great!)
   - For: First-time founders, learning mode, building skills
   - For: Great builders who aren't ready for venture scale yet

---

📊 EVALUATION CRITERIA (Weighted):

**FOUNDER PROFILE (80% weight):**
${data.founderBio || 'Not provided'}

Look for:
- Previous companies founded (especially if exited/acquired)
- Work at notable tech companies (FAANG, unicorns, well-known startups)
- Education (MIT, Stanford, top CS programs = bonus points)
- Previous funding raised
- Impressive titles (CTO, VP Eng, etc.)
- Years of experience building products

**VIBE CODE EXECUTION (20% weight):**
- Time spent: ${Math.floor((data.timeSpent || 3600) / 60)} minutes
- Video demo: ${data.videoUrl ? 'Provided ✅' : 'Missing ❌'}
- 5-liner: ${data.fiveLiner ? 'Provided ✅' : 'Missing ❌'}
- Code/GitHub: ${data.codeUrl ? (isGitHub ? 'GitHub repo ✅' : 'Link provided ✅') : 'Not provided'}

${isGitHub ? `
📝 GitHub repo detected: ${data.codeUrl}
You MAY briefly mention if it looks substantial (many commits, real code) or basic (template, starter).
But DON'T spend much time on this - it's only 20% of the decision.
` : ''}

---

🧠 YOUR THINKING PROCESS (show this to the founder):

Write 2-4 paragraphs walking through your reasoning:

1. **Founder Background Analysis** (your main focus)
   - What stands out from their bio?
   - Companies founded? Exits? Top schools?
   - Are they experienced or first-time?
   - What's their archetype: ${data.founderArchetype || 'Builder'}

2. **Vibe Code Performance** (quick assessment)
   - Did they ship something in 60 min?
   - Quality of the 5-liner business summary?
   ${isGitHub ? '- Quick glance at GitHub commits/code?' : ''}

3. **House Decision Rationale**
   - Why Venture House? (If they have impressive background + execution)
   - Why Bootstrap House? (If they're building skills, first-time, or not venture-scale yet)

Be honest, specific, and reference actual details from their bio.

---

🎭 OUTPUT FORMAT:

Write your thinking process naturally, like talking to the founder.

CRITICAL: In your FINAL SENTENCE, clearly state the house:

Examples:
- "Welcome to the **Venture House** - let's build something massive."
- "You're heading to the **Bootstrap House** - let's build profitably."

Make it clear and obvious which house you chose.

---

🎯 HOUSE ASSIGNMENT EXAMPLES:

**VENTURE HOUSE candidates:**
- "Co-founded 3 startups, one acquired by Google" → Venture
- "Ex-Stripe engineer, MIT CS degree" → Venture
- "Raised $2M seed round for previous startup" → Venture
- "Built products used by 100K+ users" → Venture

**BOOTSTRAP HOUSE candidates:**
- "First-time founder, learning to code" → Bootstrap
- "Junior developer, 2 years experience" → Bootstrap
- "Side project builder, no exits" → Bootstrap
- "Good execution but no standout credentials" → Bootstrap

Remember: Bootstrap House is GREAT! Most successful founders start there. It's not a rejection.

---

Now evaluate this founder. Be real, be specific, and make the call! 🚀
      `.trim();

    case 'sprint':
      const sprintAction = data.sprintAction || 'setup';
      
      if (sprintAction === 'setup') {
        return `
Set up the 3-week sprint program for this founder.

**Their Evaluation:**
${data.evaluationFeedback || 'VC-backable track'}

**Time Commitment:**
${data.timeCommitment || '10-15'} hours/week

Create Week 1 OKRs (3 objectives, measurable and realistic).
Explain the sprint structure and community features.
        `.trim();
      } else if (sprintAction === 'checkin') {
        return `
Weekly check-in (Week ${data.currentWeek || 1}). 

Founder update: "${data.userUpdate}"

Provide mentorship:
- Celebrate wins
- Address blockers  
- Adjust OKRs if needed
- Share relevant startup wisdom (YC, Steve Blank, Eric Ries, etc.)
        `.trim();
      } else {
        return `
3-week sprint completed! Provide:
- Overall assessment of progress
- Next steps (fundraising or growth strategy)
- Introduction to community and alumni network
        `.trim();
      }

    default:
      return 'How can I help you with your founder journey?';
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
