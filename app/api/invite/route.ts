// File: root/app/api/invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const inviteData = await req.json();

    // Validate incoming data
    if (!inviteData || !inviteData.inviterId || !inviteData.inviteeId) {
      return NextResponse.json({ error: 'Invalid invite data' }, { status: 400 });
    }

    // Check if the inviter exists
    const inviter = await prisma.user.findUnique({
      where: { telegramId: inviteData.inviterId },
    });

    if (!inviter) {
      return NextResponse.json({ error: 'Inviter not found' }, { status: 404 });
    }

    // Create a new invite record
    const invite = await prisma.invite.create({
      data: {
        inviterId: inviteData.inviterId,
        inviteeId: inviteData.inviteeId,
        createdAt: new Date(),
      },
    });

    // Update the inviter's points and invited users list
    await prisma.user.update({
      where: { telegramId: inviteData.inviterId },
      data: {
        points: {
          increment: 2500, // Award points for sending an invite
        },
        invitedUsers: {
          push: inviteData.inviteeId, // Add invitee to the inviter's list
        },
      },
    });

    return NextResponse.json({ invite }, { status: 201 });
  } catch (error) {
    console.error('Error processing invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
