import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

/**
 * Memory API
 * 
 * GET /api/memory - Get founder + startup memory
 * POST /api/memory - Update memory
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, memory is client-side only (localStorage)
    // In production, you'd fetch from database here
    return NextResponse.json({
      message: 'Memory is stored client-side. Use MemoryManager in frontend.',
      userId: session.user.email,
    });
  } catch (error) {
    console.error('Memory GET error:', error);
    return NextResponse.json({ error: 'Failed to get memory' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, action, data } = body;

    console.log(`💾 [Memory API] ${type} - ${action}:`, data);

    // In production, save to database here
    // For now, this is just for logging and future expansion

    return NextResponse.json({
      success: true,
      message: `Memory ${action} recorded`,
      userId: session.user.email,
    });
  } catch (error) {
    console.error('Memory POST error:', error);
    return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 });
  }
}
