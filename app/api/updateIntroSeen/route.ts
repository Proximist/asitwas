import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { telegramId } = await req.json()
    
    if (!telegramId) {
      return NextResponse.json({ error: 'Telegram ID is required' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: {
        telegramId: telegramId
      },
      data: {
        introSeen: true
      }
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error updating intro seen status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
