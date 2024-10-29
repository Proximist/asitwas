import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    
    // Remove @ from username if present
    const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

    const user = await prisma.user.findFirst({
      where: {
        username: cleanUsername
      },
      select: {
        username: true,
        totalPoints: true,
        invitePoints: true
      }
    });

    return NextResponse.json(user || { totalPoints: 0, invitePoints: 0 });
  } catch (error) {
    console.error('Error fetching user points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
