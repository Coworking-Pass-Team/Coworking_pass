import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const points = await prisma.loyaltyPoint.findMany({
      include: {
        user: { select: { name: true, email: true } }
      }
    })
    return NextResponse.json(points)
  } catch (error) {
    console.error('❌ Error fetching loyalty points:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب نقاط الولاء' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, totalEarned = 0, totalRedeemed = 0 } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    const points = await prisma.loyaltyPoint.create({
      data: {
        userId,
        totalEarned,
        totalRedeemed,
        availableBalance: totalEarned - totalRedeemed
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    })

    return NextResponse.json(points, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating loyalty points:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء نقاط الولاء' },
      { status: 500 }
    )
  }
}