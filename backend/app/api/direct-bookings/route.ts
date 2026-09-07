import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const bookings = await prisma.directBooking.findMany({
      include: {
        user: { select: { name: true, email: true } },
        workspace: true,
        section: true
      }
    })
    return NextResponse.json(bookings)
  } catch (error) {
    console.error('❌ Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الحجوزات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, workspaceId, sectionId, durationType, bookingDate, status = 'CONFIRMED' } = body  

    if (!userId || !workspaceId || !sectionId || !durationType || !bookingDate) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    const booking = await prisma.directBooking.create({
      data: {
        userId,         
        workspaceId, 
        sectionId,      
        durationType,   
        bookingDate: new Date(bookingDate),  
        status
      },
      include: {
        user: { select: { name: true, email: true } },
        workspace: true,
        section: true
      }
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating booking:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الحجز' },
      { status: 500 }
    )
  }
}
