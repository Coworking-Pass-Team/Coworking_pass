import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        plan: true
      }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'الاشتراك غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('❌ Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const subscription = await prisma.subscription.update({
      where: { id },
      data: body,
      include: {
        user: { select: { name: true, email: true } },
        plan: true
      }
    })
    return NextResponse.json(subscription)
  } catch (error) {
    console.error('❌ Error updating subscription:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في التحديث' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.subscription.delete({
      where: { id }
    })
    return NextResponse.json(
      { message: 'تم الحذف بنجاح' },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error deleting subscription:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الحذف' },
      { status: 500 }
    )
  }
}