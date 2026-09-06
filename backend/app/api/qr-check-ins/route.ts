import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

function generateQRHash() {
  return crypto.randomBytes(16).toString('hex')
}

export async function GET() {
  try {
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
    const body = await request.json()
    const { userId, workspaceId, sectionId, status = 'VALID' } = body

    if (!userId || !workspaceId || !sectionId) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

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

    return NextResponse.json(checkIn, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating QR check-in:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء مسح QR' },
      { status: 500 }
    )
  }
}