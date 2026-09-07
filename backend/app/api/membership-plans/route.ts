import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const plans = await prisma.membershipPlan.findMany()
    return NextResponse.json(plans)
  } catch (error) {
    console.error('❌ Error fetching plans:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الخطط' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planName, type, totalVisitsAllowed, price } = body 

    if (!planName || !type || !totalVisitsAllowed || !price) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    const plan = await prisma.membershipPlan.create({
      data: { 
        planName,        
        type, 
        totalVisitsAllowed, 
        price 
      }
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating plan:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الخطة' },
      { status: 500 }
    )
  }
}