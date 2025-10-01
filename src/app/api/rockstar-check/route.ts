import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { checkIfRockstar } from '@/lib/utils/rockstar-check';
import postgres from 'postgres';

/**
 * Rockstar Check API
 * Determines if a founder is famous and updates their profile with a red star
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

    // Admin only for now (can expand later)
    if (session.user.email !== 'franck@recorp.co') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    console.log('🌟 [Rockstar Check] Starting for user:', userId);

    const sql = getDb();

    // Get user data
    const users = await sql`
      SELECT id, email, name, bio, linkedin_url
      FROM gitgud_users
      WHERE id = ${userId}
    `;

    if (users.length === 0) {
      await sql.end();
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    // Run rockstar check
    const result = await checkIfRockstar({
      name: user.name,
      bio: user.bio,
      linkedinUrl: user.linkedin_url,
      email: user.email,
    });

    console.log('✅ [Rockstar Check] Result:', {
      userId,
      isFamous: result.isFamous,
      confidence: result.confidenceScore,
    });

    // Update database with result
    await sql`
      UPDATE gitgud_users
      SET
        is_rockstar = ${result.isFamous},
        rockstar_reason = ${result.famousReason || null},
        rockstar_confidence = ${result.confidenceScore || 0},
        rockstar_checked_at = NOW()
      WHERE id = ${userId}
    `;

    await sql.end();

    return NextResponse.json({
      success: true,
      result: {
        isFamous: result.isFamous,
        reason: result.famousReason,
        confidence: result.confidenceScore,
        achievements: result.notableAchievements,
      },
    });

  } catch (error) {
    console.error('❌ [Rockstar Check] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check rockstar status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Run rockstar check on all users
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin only
    if (session.user.email !== 'franck@recorp.co') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    console.log('🌟 [Rockstar Check] Running for all users...');

    const sql = getDb();

    // Get all users with bios
    const users = await sql`
      SELECT id, email, name, bio, linkedin_url
      FROM gitgud_users
      WHERE bio IS NOT NULL
        AND (is_rockstar IS NULL OR rockstar_checked_at IS NULL)
      ORDER BY created_at DESC
    `;

    console.log(`🔍 [Rockstar Check] Checking ${users.length} users...`);

    const results = [];
    for (const user of users) {
      try {
        const result = await checkIfRockstar({
          name: user.name,
          bio: user.bio,
          linkedinUrl: user.linkedin_url,
          email: user.email,
        });

        await sql`
          UPDATE gitgud_users
          SET
            is_rockstar = ${result.isFamous},
            rockstar_reason = ${result.famousReason || null},
            rockstar_confidence = ${result.confidenceScore || 0},
            rockstar_checked_at = NOW()
          WHERE id = ${user.id}
        `;

        results.push({
          userId: user.id,
          name: user.name,
          isFamous: result.isFamous,
          confidence: result.confidenceScore,
        });

        console.log(`✅ [Rockstar Check] ${user.name}: ${result.isFamous ? '⭐ FAMOUS' : '❌ Not famous'} (${result.confidenceScore}%)`);

        // Rate limit: wait 1 second between checks to avoid API throttling
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ [Rockstar Check] Failed for ${user.name}:`, error);
        results.push({
          userId: user.id,
          name: user.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    await sql.end();

    const famousCount = results.filter(r => r.isFamous).length;
    console.log(`🌟 [Rockstar Check] Complete: ${famousCount} famous founders found out of ${results.length} checked`);

    return NextResponse.json({
      success: true,
      totalChecked: results.length,
      famousCount,
      results,
    });

  } catch (error) {
    console.error('❌ [Rockstar Check] Batch error:', error);
    return NextResponse.json(
      { error: 'Failed to run batch rockstar check', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
