import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, approvedBy, isActive } = body

    const rule = await prisma.loyaltyRule.update({
      where: { id },
      data: {
        status,
        approvedBy,
        isActive: status === 'APPROVED'
      },
      include: {
        proposer: { select: { name: true, email: true } },
        approver: { select: { name: true, email: true } }
      }
    })

    return NextResponse.json(rule)
  } catch (error) {
    console.error('❌ Error updating rule:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث القاعدة' },
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
    await prisma.loyaltyRule.delete({
      where: { id }
    })
    return NextResponse.json(
      { message: 'تم حذف القاعدة بنجاح' },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error deleting rule:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في حذف القاعدة' },
      { status: 500 }
    )
  }
}