import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ✅ التحقق من التوكن (الحماية)
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params

    // 1. جلب المساحة مع سعتها الإجمالية
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: {
        id: true,
        totalCapacity: true,
        name: true
      }
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'المساحة غير موجودة' },
        { status: 404 }
      )
    }

    // 2. حساب عدد الحجوزات النشطة حالياً
    const now = new Date()
    const activeBookings = await prisma.directBooking.count({
    where: {
    workspaceId: id,
    status: 'CONFIRMED',
    bookingDate: { lte: now }
  }
})

    // 3. حساب نسبة الإشغال
    const totalCapacity = workspace.totalCapacity
    const occupancyRate = totalCapacity > 0
      ? Math.round((activeBookings / totalCapacity) * 100)
      : 0

    return NextResponse.json({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      totalCapacity,
      activeBookings,
      occupancyRate
    })

  } catch (error) {
    console.error('❌ Error calculating occupancy:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حساب الإشغال' },
      { status: 500 }
    )
  }
}