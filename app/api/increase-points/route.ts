import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { inviterId } = await req.json();

        if (!inviterId) {
            return NextResponse.json({ error: 'Invalid inviterId' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { telegramId: inviterId },
            data: { points: { increment: 2500 } }
        });

        return NextResponse.json({ success: true, points: updatedUser.points });
    } catch (error) {
        console.error('Error increasing points:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
