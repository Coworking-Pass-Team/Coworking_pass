import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const booking = await prisma.hourlyBooking.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        section: true,
        package: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'الحجز غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('❌ Error fetching booking:', error)
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
    const booking = await prisma.hourlyBooking.update({
      where: { id },
      data: body,
      include: {
        user: { select: { name: true, email: true } },
        section: true,
        package: true
      }
    })
    return NextResponse.json(booking)
  } catch (error) {
    console.error('❌ Error updating booking:', error)
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
    await prisma.hourlyBooking.delete({
      where: { id }
    })
    return NextResponse.json(
      { message: 'تم إلغاء الحجز بنجاح' },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error deleting booking:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الإلغاء' },
      { status: 500 }
    )
  }
}