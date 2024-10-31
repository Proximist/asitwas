import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const data = await req.json()
        const { userId, inviterId, action } = data

        if (!userId) {
            return NextResponse.json({ error: 'Invalid user data' }, { status: 400 })
        }

        // Handle processing an invite
        if (action === 'process' && inviterId) {
            const inviter = await prisma.user.findUnique({
                where: { telegramId: parseInt(inviterId) },
                select: { 
                    telegramId: true,
                    username: true,
                    invitedUsers: true,
                    points: true
                }
            })

            const invitedUser = await prisma.user.findUnique({
                where: { telegramId: parseInt(userId) },
                select: {
                    telegramId: true,
                    username: true,
                    invitedBy: true
                }
            })

            if (!inviter) {
                return NextResponse.json({ error: 'Inviter not found' }, { status: 404 })
            }

            if (!invitedUser) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 })
            }

            // Check if user was already invited
            if (invitedUser.invitedBy) {
                return NextResponse.json({ error: 'User already invited' }, { status: 400 })
            }

            // Update inviter with new points and add to their invited users list
            const updatedInviter = await prisma.user.update({
                where: { telegramId: inviter.telegramId },
                data: {
                    points: inviter.points + 2500,
                    invitedUsers: {
                        push: invitedUser.username || `User${invitedUser.telegramId}`
                    }
                }
            })

            // Update invited user to record who invited them
            const updatedInvitedUser = await prisma.user.update({
                where: { telegramId: invitedUser.telegramId },
                data: {
                    invitedBy: inviter.username || `User${inviter.telegramId}`
                }
            })

            return NextResponse.json({
                success: true,
                inviter: {
                    telegramId: updatedInviter.telegramId,
                    points: updatedInviter.points,
                    invitedUsers: updatedInviter.invitedUsers
                },
                invitedUser: {
                    telegramId: updatedInvitedUser.telegramId,
                    invitedBy: updatedInvitedUser.invitedBy
                }
            })
        }

        // Get user's invite data
        if (action === 'get') {
            const user = await prisma.user.findUnique({
                where: { telegramId: parseInt(userId) },
                select: {
                    telegramId: true,
                    username: true,
                    points: true,
                    invitedUsers: true,
                    invitedBy: true
                }
            })

            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 })
            }

            return NextResponse.json({
                success: true,
                inviteData: {
                    telegramId: user.telegramId,
                    points: user.points,
                    invitedUsers: user.invitedUsers,
                    invitedBy: user.invitedBy
                }
            })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    } catch (error) {
        console.error('Error processing invite:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
