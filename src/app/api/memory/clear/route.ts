import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { mastra } from '@/lib/mastra/config';

/**
 * Clear All Memories API
 *
 * DELETE /api/memory/clear - Clear all Mastra memories for the current user
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;
    console.log(`🗑️ [API] Clearing all Mastra memories for ${userId}`);

    // Clear Mastra memory threads for all phases
    const phases = ['welcome', 'discovery', 'profile', 'challenge', 'assessment', 'evaluation', 'sprint'];
    const memory = mastra.getMemory();

    console.log('🔍 [API] Memory instance:', { hasMemory: !!memory, type: memory?.constructor.name });

    let clearedThreads = 0;
    if (memory) {
      for (const phase of phases) {
        const threadId = `${phase}-${userId}`;
        try {
          console.log(`🗑️ [API] Attempting to delete thread: ${threadId}`);
          await memory.deleteThread(threadId);
          clearedThreads++;
          console.log(`✅ [API] Cleared Mastra thread: ${threadId}`);
        } catch (err) {
          // Thread might not exist, that's OK
          console.log(`ℹ️ [API] Thread ${threadId} not found or already deleted:`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `All memories cleared (${clearedThreads} Mastra threads)`,
      userId,
    });
  } catch (error) {
    console.error('❌ [API] Failed to clear Mastra memories:', error);
    return NextResponse.json(
      { error: 'Failed to clear memories' },
      { status: 500 }
    );
  }
}
