import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(notifications)
  } catch (error) {
    console.error('❌ Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الإشعارات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, title, message, channel = 'IN_APP' } = body

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        channel,
        isRead: false,
        sentAt: new Date()
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating notification:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الإشعار' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, isRead } = await request.json()
    
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead }
    })
    
    return NextResponse.json(notification)
  } catch (error) {
    console.error('❌ Error updating notification:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الإشعار' },
      { status: 500 }
    )
  }
}