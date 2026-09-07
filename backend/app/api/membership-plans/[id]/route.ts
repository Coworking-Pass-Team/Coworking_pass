import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: جلب خطة معينة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  
) {
  try {
    const { id } = await params  

    const plan = await prisma.membershipPlan.findUnique({
      where: { id }
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'الخطة غير موجودة' },
        { status: 404 }
      )
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error('❌ Error fetching plan:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الخطة' },
      { status: 500 }
    )
  }
}

// PUT: تحديث خطة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  
) {
  try {
    const { id } = await params  
    const body = await request.json()

    const plan = await prisma.membershipPlan.update({
      where: { id },
      data: body
    })
    return NextResponse.json(plan)
  } catch (error) {
    console.error('❌ Error updating plan:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في التحديث' },
      { status: 500 }
    )
  }
}

// DELETE: حذف خطة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  
) {
  try {
    const { id } = await params  

    await prisma.membershipPlan.delete({
      where: { id }
    })
    return NextResponse.json(
      { message: 'تم الحذف بنجاح' },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error deleting plan:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الحذف' },
      { status: 500 }
    )
  }
}