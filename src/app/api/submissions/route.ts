import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

/**
 * Submissions API
 * Publicly accessible endpoint to view all challenge submissions
 *
 * Returns list of all users who completed the challenge with:
 * - Startup name (main identifier)
 * - Founder name and bio
 * - Video URL and 5-liner
 * - Duration and completion date
 * - House decision and archetype
 */

const getDb = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not configured');
  }
  return postgres(process.env.DATABASE_URL);
};

export async function GET(request: NextRequest) {
  try {
    console.log('📊 [Submissions API] Fetching all submissions...');

    const sql = getDb();

    // Get all completed submissions
    const submissions = await sql`
      SELECT
        id,
        email,
        name,
        startup_name,
        bio,
        archetype,
        video_url,
        five_liner,
        code_url,
        house_decision,
        challenge_duration_seconds,
        challenge_completed_at,
        created_at
      FROM gitgud_users
      WHERE challenge_completed_at IS NOT NULL
      ORDER BY challenge_completed_at DESC
    `;

    await sql.end();

    console.log('✅ [Submissions API] Found', submissions.length, 'submissions');

    return NextResponse.json({
      success: true,
      submissions,
      count: submissions.length,
    });
  } catch (error) {
    console.error('❌ [Submissions API] Failed to fetch submissions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch submissions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
