// app/api/getInvitedUsersDetails/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { telegramId } = await req.json();

    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: {
        invitedUsers: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const invitedUsersDetails = await Promise.all(
      user.invitedUsers.map(async (username) => {
        const cleanUsername = username.startsWith('@') 
          ? username.slice(1) 
          : username;

        const invitedUser = await prisma.user.findFirst({
          where: { username: cleanUsername },
          select: {
            username: true,
            totalPoints: true
          }
        });

        if (invitedUser) {
          return {
            username,
            totalPoints: invitedUser.totalPoints,
            earnedPoints: Math.floor(invitedUser.totalPoints * 0.2)
          };
        }

        return {
          username,
          totalPoints: 0,
          earnedPoints: 0
        };
      })
    );

    return NextResponse.json({ invitedUsersDetails });
  } catch (error) {
    console.error('Error fetching invited users details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
