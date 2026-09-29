import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";


export async function GET(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);

    // Every account, including admins, only receives its own notifications
    const notifications = await prisma.notification.findMany({
      where: { userId: user.userId },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications.' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: إنشاء إشعار
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, type, title, message, channel]
 *             properties:
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               channel:
 *                 type: string
 *                 enum: [EMAIL, IN_APP, BOTH]
 *     responses:
 *       201:
 *         description: تم إنشاء الإشعار
 */

export async function POST(request: NextRequest) {
  try {
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    const body = await request.json()
    const { userId, type, title, message, channel = 'IN_APP' } = body

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      )
    }

    // Notifications may target the caller, or (admin / venue owner alerts) another account of an allowed kind
    if (userId !== user.userId && user.role !== 'SUPER_ADMIN') {
      const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
      if (!target || target.role !== 'PARTNER_ADMIN') {
        return NextResponse.json(
          { error: 'You are not allowed to send notifications to this account.' },
          { status: 403 }
        )
      }
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
      { error: 'Failed to create notification.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);

    const { id, isRead } = await request.json()

    // Only the recipient may change a notification
    const existing = await prisma.notification.findUnique({ where: { id }, select: { userId: true } })
    if (!existing) {
      return NextResponse.json({ error: 'Notification not found.' }, { status: 404 })
    }
    if (existing.userId !== user.userId) {
      return NextResponse.json({ error: 'You are not allowed to modify this notification.' }, { status: 403 })
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead }
    })
    
    return NextResponse.json(notification)
  } catch (error) {
    console.error('❌ Error updating notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification.' },
      { status: 500 }
    )
  }
}