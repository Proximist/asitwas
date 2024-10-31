import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const userData = await req.json();

    if (!userData || !userData.id) {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
    }

    // Get current user data including referral info
    const user = await prisma.user.findUnique({
      where: { telegramId: userData.id },
      select: {
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        points: true,
        invitedUsers: true,
        invitedBy: true,
        level: true,
        piAmount: true,
        transactionStatus: true
      }
    });

    const inviterId = userData.start_param ? parseInt(userData.start_param) : null;

    if (!user) {
      // Handle new user with referral
      if (inviterId) {
        const inviter = await prisma.user.findUnique({
          where: { telegramId: inviterId },
          select: { username: true, firstName: true, lastName: true }
        });

        if (inviter) {
          // Create new user with referral info
          const newUser = await prisma.user.create({
            data: {
              telegramId: userData.id,
              username: userData.username || '',
              firstName: userData.first_name || '',
              lastName: userData.last_name || '',
              invitedBy: `@${inviter.username || inviterId}`,
              level: 1,
              piAmount: [],
              transactionStatus: []
            }
          });

          // Update inviter's data
          await prisma.user.update({
            where: { telegramId: inviterId },
            data: {
              invitedUsers: {
                push: `@${userData.username || userData.id}`
              },
              points: {
                increment: 2500
              }
            }
          });

          return NextResponse.json({ user: newUser });
        }
      }

      // Create new user without referral
      const newUser = await prisma.user.create({
        data: {
          telegramId: userData.id,
          username: userData.username || '',
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          level: 1,
          piAmount: [],
          transactionStatus: []
        }
      });

      return NextResponse.json({ user: newUser });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error processing invite data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
