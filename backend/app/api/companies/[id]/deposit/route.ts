import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token"

/**
 * @swagger
 * /api/companies/{id}/deposit:
 *   post:
 *     summary: إيداع مبلغ في محفظة الشركة
 *     tags: [Companies]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1000
 *     responses:
 *       200:
 *         description: تم الإيداع بنجاح
 *       400:
 *         description: المبلغ غير صحيح
 *       403:
 *         description: غير مصرح
 *       404:
 *         description: الشركة غير موجودة
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request)
    if (!user) return unauthorizedResponse()

    // التحقق من الصلاحيات
    if (user.role !== 'HR_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح. فقط مدير الموارد البشرية أو المدير العام' },
        { status: 403 }
      )
    }

    const { id } = await params
    const { amount } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'المبلغ مطلوب ويجب أن يكون أكبر من صفر' },
        { status: 400 }
      )
    }

    // التحقق من وجود الشركة
    const company = await prisma.company.findUnique({
      where: { id }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'الشركة غير موجودة' },
        { status: 404 }
      )
    }

    // إيداع المبلغ
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: { balance: { increment: amount } }
    })

    return NextResponse.json({
      message: 'تم الإيداع بنجاح',
      company: {
        id: updatedCompany.id,
        companyName: updatedCompany.companyName,
        newBalance: updatedCompany.balance
      }
    })

  } catch (error) {
    console.error('❌ Error depositing:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الإيداع' },
      { status: 500 }
    )
  }
}