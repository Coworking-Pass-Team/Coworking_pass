import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const transactions = await prisma.pointsTransaction.findMany({
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('❌ Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب معاملات النقاط' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, points, description, referenceId } = body

    if (!userId || !type || !points) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    const transaction = await prisma.pointsTransaction.create({
      data: {
        userId,
        type,
        points,
        description,
        referenceId
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    })

    // تحديث رصيد المستخدم
    const loyaltyPoints = await prisma.loyaltyPoint.findUnique({
      where: { userId }
    })

    if (loyaltyPoints) {
      const updateData = type === 'EARNED'
        ? { totalEarned: { increment: points }, availableBalance: { increment: points } }
        : { totalRedeemed: { increment: points }, availableBalance: { decrement: points } }

      await prisma.loyaltyPoint.update({
        where: { userId },
        data: updateData
      })
    }

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating transaction:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المعاملة' },
      { status: 500 }
    )
  }
}