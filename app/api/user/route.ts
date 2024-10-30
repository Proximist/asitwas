import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const LEVELS = [
    { name: 'Rookie', threshold: 100, pointsPerHundredXP: 1 },
    { name: 'Bronze', threshold: 101, pointsPerHundredXP: 3 },
    { name: 'Silver', threshold: 300, pointsPerHundredXP: 5 },
    { name: 'Gold', threshold: 700, pointsPerHundredXP: 7 },
    { name: 'Diamond', threshold: 1100, pointsPerHundredXP: 10 },
    { name: 'Platinum', threshold: 1500, pointsPerHundredXP: 15 },
    { name: 'Infinite', threshold: Infinity, pointsPerHundredXP: 15 }
];

function calculateProfileMetrics(piAmountArray: number[]) {
    const totalPiSold = piAmountArray.reduce((sum, amount) => sum + amount, 0);
    const xp = totalPiSold;
    const currentLevel = LEVELS.findIndex(lvl => xp < lvl.threshold);
    const level = currentLevel === -1 ? LEVELS.length : currentLevel;
    const pointsRate = LEVELS[level - 1]?.pointsPerHundredXP || LEVELS[LEVELS.length - 1].pointsPerHundredXP;
    const piPoints = Math.floor(xp / 100) * pointsRate;

    return {
        totalPiSold,
        xp,
        level,
        piPoints
    };
}

function canInitiateNewTransaction(transactionStatus: string[]) {
    if (transactionStatus.length === 0) return true;
    const lastStatus = transactionStatus[transactionStatus.length - 1];
    return lastStatus === 'completed' || lastStatus === 'failed';
}

export async function POST(req: NextRequest) {
    try {
        const userData = await req.json();

        if (!userData || !userData.id) {
            return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
        }

        let user = await prisma.user.findUnique({
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
                transactionStatus: true,
                introSeen: true,
            }
        });

        const inviterId = userData.start_param ? parseInt(userData.start_param) : null;

        if (!user) {
            if (inviterId) {
                const inviterInfo = await prisma.user.findUnique({
                    where: { telegramId: inviterId },
                    select: { username: true, firstName: true, lastName: true }
                });

                if (inviterInfo) {
                    user = await prisma.user.create({
                        data: {
                            telegramId: userData.id,
                            username: userData.username || '',
                            firstName: userData.first_name || '',
                            lastName: userData.last_name || '',
                            invitedBy: `@${inviterInfo.username || inviterId}`,
                            level: 1,
                            points: 0,
                            transactionStatus: [],
                            introSeen: false
                        }
                    });

                    await fetch('/api/increase-points', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            telegramId: inviterId,
                            invitedUserId: userData.id,
                            invitedUsername: userData.username
                        })
                    });
                } else {
                    user = await prisma.user.create({
                        data: {
                            telegramId: userData.id,
                            username: userData.username || '',
                            firstName: userData.first_name || '',
                            lastName: userData.last_name || '',
                            level: 1,
                            transactionStatus: [],
                            introSeen: false
                        }
                    });
                }
            } else {
                user = await prisma.user.create({
                    data: {
                        telegramId: userData.id,
                        username: userData.username || '',
                        firstName: userData.first_name || '',
                        lastName: userData.last_name || '',
                        level: 1,
                        transactionStatus: [],
                        introSeen: userData.introSeen || false
                    }
                });
            }
        } else if (userData.introSeen) {
            user = await prisma.user.update({
                where: { telegramId: userData.id },
                data: { introSeen: true },
            });
        }

        if (userData.newTransaction) {
            if (!canInitiateNewTransaction(user.transactionStatus)) {
                return NextResponse.json({
                    error: 'Cannot start new transaction while previous transaction is processing'
                }, { status: 400 });
            }

            user = await prisma.user.update({
                where: { telegramId: userData.id },
                data: {
                    transactionStatus: {
                        push: 'processing'
                    }
                },
            });
        }

        if (userData.updateTransactionStatus) {
            const { index, status } = userData.updateTransactionStatus;
            if (index >= 0 && ['processing', 'completed', 'failed'].includes(status)) {
                const newStatuses = [...user.transactionStatus];
                newStatuses[index] = status;
                user = await prisma.user.update({
                    where: { telegramId: userData.id },
                    data: { transactionStatus: newStatuses },
                });
            }
        }

        if (userData.updateLevel) {
            user = await prisma.user.update({
                where: { telegramId: userData.id },
                data: { level: userData.level },
            });
        }

        const inviterInfo = inviterId
            ? await prisma.user.findUnique({
                where: { telegramId: inviterId },
                select: { username: true, firstName: true, lastName: true }
            })
            : null;

        const metrics = calculateProfileMetrics(user.piAmount);

        return NextResponse.json({
            user,
            inviterInfo,
            ...metrics,
            status: user.transactionStatus
        });

    } catch (error) {
        console.error('Error processing user data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
