import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const payouts = await prisma.payout.findMany({
      include: {
        partner: true
      },
      orderBy: { billingMonth: 'desc' }
    })
    return NextResponse.json(payouts)
  } catch (error) {
    console.error('❌ Error fetching partner payouts:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب مستحقات الشركاء' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { partnerId, billingMonth, totalVisitsReceived, amountDue, status = 'PENDING' } = body

    if (!partnerId || !billingMonth || !totalVisitsReceived || !amountDue) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    const payout = await prisma.payout.create({
      data: {
        partnerId,
        billingMonth,
        totalVisitsReceived,
        amountDue,
        status
      },
      include: {
        partner: true
      }
    })

    return NextResponse.json(payout, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating partner payout:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المستحقات' },
      { status: 500 }
    )
  }
}