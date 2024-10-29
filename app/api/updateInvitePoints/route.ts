// app/api/updateInvitePoints/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { telegramId } = await req.json();

    // Get user and their invited users
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: {
        invitedUsers: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate total invite points from all invited users
    let totalInvitePoints = 0;
    
    for (const invitedUsername of user.invitedUsers) {
      const cleanUsername = invitedUsername.startsWith('@') 
        ? invitedUsername.slice(1) 
        : invitedUsername;

      const invitedUser = await prisma.user.findFirst({
        where: { username: cleanUsername },
        select: { totalPoints: true }
      });

      if (invitedUser) {
        // Calculate 20% of invited user's total points
        totalInvitePoints += Math.floor(invitedUser.totalPoints * 0.2);
      }
    }

    // Update user's invite points
    const updatedUser = await prisma.user.update({
      where: { telegramId },
      data: {
        invitePoints: totalInvitePoints
      },
      select: {
        invitePoints: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating invite points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
