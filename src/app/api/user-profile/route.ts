import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { memory } from '@/lib/mastra/config';

/**
 * User Profile API
 * Stores and retrieves user profile data in PostgreSQL via Mastra Memory
 *
 * Stores:
 * - Bio (from profiler agent)
 * - LinkedIn URL
 * - Archetype
 * - All research data
 * - Profile metadata
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;
    const body = await request.json();
    const { bio, linkedinUrl, archetype, research, metadata } = body;

    console.log('💾 [UserProfile] Saving profile data:', {
      userId,
      hasBio: !!bio,
      hasLinkedIn: !!linkedinUrl,
      archetype,
      researchKeys: research ? Object.keys(research) : [],
    });

    // Save to memory with structured format
    const profileData = {
      bio,
      linkedinUrl,
      archetype,
      research,
      metadata: {
        ...metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    // Store in memory thread
    await memory.saveMessages({
      messages: [{
        role: 'system',
        content: `User profile data: ${JSON.stringify(profileData, null, 2)}`,
      }],
      resourceId: userId,
      threadId: `profile-${userId}`,
    });

    console.log('✅ [UserProfile] Profile saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Profile saved',
    });
  } catch (error) {
    console.error('❌ [UserProfile] Failed to save profile:', error);
    return NextResponse.json(
      { error: 'Failed to save profile' },
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

    const userId = session.user.email;

    console.log('📖 [UserProfile] Loading profile data:', { userId });

    // Retrieve from memory thread
    const messages = await memory.getMessages({
      resourceId: userId,
      threadId: `profile-${userId}`,
    });

    if (!messages || messages.length === 0) {
      console.log('📭 [UserProfile] No profile data found');
      return NextResponse.json({
        success: true,
        profile: null,
      });
    }

    // Get the latest profile data
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.content;

    // Extract JSON from content
    const match = content.match(/User profile data: (.+)/s);
    if (!match) {
      return NextResponse.json({
        success: true,
        profile: null,
      });
    }

    const profileData = JSON.parse(match[1]);

    console.log('✅ [UserProfile] Profile loaded:', {
      hasBio: !!profileData.bio,
      archetype: profileData.archetype,
    });

    return NextResponse.json({
      success: true,
      profile: profileData,
    });
  } catch (error) {
    console.error('❌ [UserProfile] Failed to load profile:', error);
    return NextResponse.json(
      { error: 'Failed to load profile' },
      { status: 500 }
    );
  }
}
