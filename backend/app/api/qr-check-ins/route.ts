import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";


function generateQRHash() {
  return crypto.randomBytes(16).toString('hex')
}

export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const checkIns = await prisma.qrCheckIn.findMany({
      include: {
        user: { select: { name: true, email: true } },
        workspace: true,
        section: true
      },
      orderBy: { scannedAt: 'desc' }
    })
    return NextResponse.json(checkIns)
  } catch (error) {
    console.error('❌ Error fetching QR check-ins:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب مسحات QR' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const body = await request.json()
    const { userId, workspaceId, sectionId, status = 'VALID' } = body

    if (!userId || !workspaceId || !sectionId) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    // 1. إنشاء سجل QR Check-in
    const checkIn = await prisma.qrCheckIn.create({
      data: {
        userId,
        workspaceId,
        sectionId,
        qrCodeHash: generateQRHash(),
        status,
        scannedAt: new Date()
      },
      include: {
        user: { select: { name: true, email: true } },
        workspace: true,
        section: true
      }
    })

    // ✅ 2. منح نقاط ولاء عند مسح QR
    try {
      // البحث عن حجز نشط للمستخدم في هذا القسم
      const activeBooking = await prisma.directBooking.findFirst({
        where: {
          userId: userId,
          sectionId: sectionId,
          status: 'CONFIRMED',
          bookingDate: { lte: new Date() }
        }
      })

      // إذا كان هناك حجز نشط، نمنح نقاط
      if (activeBooking) {
        const pointsToEarn = 10 // 10 نقاط لكل حجز

        await prisma.pointsTransaction.create({
          data: {
            userId: userId,
            type: 'EARNED',
            points: pointsToEarn,
            description: `نقاط من حجز ${activeBooking.durationType} في ${activeBooking.workspaceId}`,
            referenceId: activeBooking.id
          }
        })

        // تحديث رصيد النقاط
        const loyaltyPoints = await prisma.loyaltyPoint.findUnique({
          where: { userId }
        })

        if (loyaltyPoints) {
          await prisma.loyaltyPoint.update({
            where: { userId },
            data: {
              totalEarned: { increment: pointsToEarn },
              availableBalance: { increment: pointsToEarn }
            }
          })
        }
      }
    } catch (pointsError) {
      // نطبع الخطأ بس ما نوقف الـ API
      console.error('❌ Error earning loyalty points:', pointsError)
    }

    return NextResponse.json(checkIn, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating QR check-in:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء مسح QR' },
      { status: 500 }
    )
  }
}