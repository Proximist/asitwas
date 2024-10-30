// route.ts (increase-points route)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const { telegramId, invitedUserId, invitedUsername } = await req.json()

        if (!telegramId) {
            return NextResponse.json({ error: 'Invalid telegramId' }, { status: 400 })
        }

        // If this is an invite points increase
        if (invitedUserId && invitedUsername) {
            const updatedUser = await prisma.user.update({
                where: { telegramId },
                data: {
                    invitedUsers: {
                        push: `@${invitedUsername || invitedUserId}`
                    },
                    points: {
                        increment: 2500
                    }
                }
            })
            return NextResponse.json({ success: true, points: updatedUser.points })
        }

        // Regular points increase
        const updatedUser = await prisma.user.update({
            where: { telegramId },
            data: { points: { increment: 1 } }
        })

        return NextResponse.json({ success: true, points: updatedUser.points })
    } catch (error) {
        console.error('Error increasing points:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
