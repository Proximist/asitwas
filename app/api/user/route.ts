import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

// Helper function to check if a new transaction is allowed
function canInitiateNewTransaction(transactionStatus: string[]) {
    if (transactionStatus.length === 0) return true;
    const lastStatus = transactionStatus[transactionStatus.length - 1];
    return lastStatus === 'completed' || lastStatus === 'failed';
}

export async function POST(req: NextRequest) {
    try {
        const userData = await req.json()

        if (!userData || !userData.id) {
            return NextResponse.json({ error: 'Invalid user data' }, { status: 400 })
        }

        let user = await prisma.user.findUnique({
            where: { telegramId: userData.id }
        })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    telegramId: userData.id,
                    username: userData.username || '',
                    firstName: userData.first_name || '',
                    lastName: userData.last_name || '',
                    level: 1,
                    transactionStatus: []  // Initialize empty status array
                }
            })
        }

        // Handle new transaction initiation
        if (userData.newTransaction) {
            if (!canInitiateNewTransaction(user.transactionStatus)) {
                return NextResponse.json({ 
                    error: 'Cannot start new transaction while previous transaction is processing'
                }, { status: 400 })
            }

            user = await prisma.user.update({
                where: { telegramId: userData.id },
                data: { 
                    transactionStatus: {
                        push: 'processing'  // Add new processing status
                    }
                }
            })
        }

        // Handle transaction status update if provided
        if (userData.updateTransactionStatus) {
            const { index, status } = userData.updateTransactionStatus
            if (index >= 0 && ['processing', 'completed', 'failed'].includes(status)) {
                const newStatuses = [...user.transactionStatus]
                newStatuses[index] = status
                user = await prisma.user.update({
                    where: { telegramId: userData.id },
                    data: { 
                        transactionStatus: newStatuses
                    }
                })
            }
        }

        // Handle level update if requested
        if (userData.updateLevel) {
            user = await prisma.user.update({
                where: { telegramId: userData.id },
                data: { 
                    level: userData.level
                }
            })
        }

        // Calculate profile metrics
        const metrics = calculateProfileMetrics(user.piAmount);

        // Return combined user data and metrics
        return NextResponse.json({
            ...user,
            ...metrics,
            status: user.transactionStatus  // Include status in response
        })
    } catch (error) {
        console.error('Error processing user data:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
