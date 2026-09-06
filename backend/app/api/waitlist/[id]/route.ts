import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE: إزالة من قائمة الانتظار
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.directBooking.delete({
      where: { id }
    })
    return NextResponse.json(
      { message: 'تم إزالتك من قائمة الانتظار' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'حدث خطأ في الإزالة' },
      { status: 500 }
    )
  }
}