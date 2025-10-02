import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import postgres from 'postgres';

/**
 * Users API
 * Stores all user data in a single Supabase table row
 *
 * One row per user containing:
 * - Bio, LinkedIn URL, archetype
 * - Research data (raw JSON)
 * - Chat history (array of messages)
 * - Challenge deliverables (video, 5-liner, code)
 * - Submission timestamps and duration
 */

const getDb = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not configured');
  }
  return postgres(process.env.DATABASE_URL);
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;
    const body = await request.json();

    console.log('💾 [Users API] Saving user data:', {
      email,
      dataKeys: Object.keys(body),
    });

    const sql = getDb();

    // Upsert user data
    const result = await sql`
      INSERT INTO gitgud_users (
        email,
        name,
        bio,
        linkedin_url,
        archetype,
        research_data,
        startup_name,
        challenge_started_at,
        challenge_completed_at,
        challenge_duration_seconds,
        video_url,
        website_url,
        five_liner,
        code_url,
        house_decision,
        house_reasoning,
        chat_history,
        memory_notes,
        extracted_info,
        last_login_at
      ) VALUES (
        ${email},
        ${body.name || session.user.name || null},
        ${body.bio || null},
        ${body.linkedinUrl || null},
        ${body.archetype || null},
        ${body.researchData ? JSON.stringify(body.researchData) : null},
        ${body.startupName || null},
        ${body.challengeStartedAt || null},
        ${body.challengeCompletedAt || null},
        ${body.challengeDurationSeconds || null},
        ${body.videoUrl || null},
        ${body.websiteUrl || null},
        ${body.fiveLiner || null},
        ${body.codeUrl || null},
        ${body.houseDecision || null},
        ${body.houseReasoning || null},
        ${body.chatHistory ? JSON.stringify(body.chatHistory) : '[]'},
        ${body.memoryNotes || null},
        ${body.extractedInfo ? JSON.stringify(body.extractedInfo) : null},
        NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, gitgud_users.name),
        bio = COALESCE(EXCLUDED.bio, gitgud_users.bio),
        linkedin_url = COALESCE(EXCLUDED.linkedin_url, gitgud_users.linkedin_url),
        archetype = COALESCE(EXCLUDED.archetype, gitgud_users.archetype),
        research_data = COALESCE(EXCLUDED.research_data, gitgud_users.research_data),
        startup_name = COALESCE(EXCLUDED.startup_name, gitgud_users.startup_name),
        challenge_started_at = COALESCE(EXCLUDED.challenge_started_at, gitgud_users.challenge_started_at),
        challenge_completed_at = COALESCE(EXCLUDED.challenge_completed_at, gitgud_users.challenge_completed_at),
        challenge_duration_seconds = COALESCE(EXCLUDED.challenge_duration_seconds, gitgud_users.challenge_duration_seconds),
        video_url = COALESCE(EXCLUDED.video_url, gitgud_users.video_url),
        website_url = COALESCE(EXCLUDED.website_url, gitgud_users.website_url),
        five_liner = COALESCE(EXCLUDED.five_liner, gitgud_users.five_liner),
        code_url = COALESCE(EXCLUDED.code_url, gitgud_users.code_url),
        house_decision = COALESCE(EXCLUDED.house_decision, gitgud_users.house_decision),
        house_reasoning = COALESCE(EXCLUDED.house_reasoning, gitgud_users.house_reasoning),
        chat_history = COALESCE(EXCLUDED.chat_history, gitgud_users.chat_history),
        memory_notes = CASE WHEN EXCLUDED.memory_notes IS NOT NULL THEN
          COALESCE(gitgud_users.memory_notes || E'\n' || EXCLUDED.memory_notes, EXCLUDED.memory_notes)
          ELSE gitgud_users.memory_notes END,
        extracted_info = COALESCE(EXCLUDED.extracted_info, gitgud_users.extracted_info),
        last_login_at = NOW()
      RETURNING *
    `;

    await sql.end();

    console.log('✅ [Users API] User data saved');

    return NextResponse.json({
      success: true,
      user: result[0],
    });
  } catch (error) {
    console.error('❌ [Users API] Failed to save user data:', error);
    return NextResponse.json(
      { error: 'Failed to save user data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;
    const { searchParams } = new URL(request.url);
    const getAll = searchParams.get('all') === 'true';

    // Admin only: Get all users
    if (getAll && email === 'franck@recorp.co') {
      console.log('📖 [Users API] Loading all users (admin)');

      const sql = getDb();

      const result = await sql`
        SELECT
          id, email, name, bio, linkedin_url, archetype,
          startup_name, house_decision, challenge_completed_at,
          created_at, last_login_at, is_rockstar, rockstar_reason, rockstar_confidence
        FROM gitgud_users
        ORDER BY created_at DESC
      `;

      await sql.end();

      console.log(`✅ [Users API] Loaded ${result.length} users`);

      return NextResponse.json({
        success: true,
        users: result,
      });
    }

    // Regular user: Get own data
    console.log('📖 [Users API] Loading user data:', { email });

    const sql = getDb();

    const result = await sql`
      SELECT * FROM gitgud_users WHERE email = ${email}
    `;

    await sql.end();

    if (result.length === 0) {
      console.log('📭 [Users API] No user data found');
      return NextResponse.json({
        success: true,
        user: null,
      });
    }

    console.log('✅ [Users API] User data loaded');

    return NextResponse.json({
      success: true,
      user: result[0],
    });
  } catch (error) {
    console.error('❌ [Users API] Failed to load user data:', error);
    return NextResponse.json(
      { error: 'Failed to load user data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
