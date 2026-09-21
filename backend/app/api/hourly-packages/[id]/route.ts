import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";



/**
 * @swagger
 * /api/hourly-packages/{id}:
 *   put:
 *     summary: تعديل باقة
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
 *             properties:
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: تم تعديل الباقة
 */
// PUT /api/hourly-packages/[id] — تعديل باقة
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.hourlyPackage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Package not found." }, { status: 404 });
    }

    const effectivePeriod = data.periodType || existing.periodType;
    const effectiveHours = data.hoursAmount !== undefined ? Number(data.hoursAmount) : existing.hoursAmount;

    if (effectivePeriod === 'PER_DAY' && effectiveHours > 4) {
      return NextResponse.json({ error: "Daily hours cannot exceed 4 hours." }, { status: 400 });
    }

    if (effectivePeriod === 'PER_MONTH' && effectiveHours > 12) {
      return NextResponse.json({ error: "Monthly hours cannot exceed 12 hours." }, { status: 400 });
    }

    const hourlyPackage = await prisma.hourlyPackage.update({
      where: { id },
      data,
    });

    return NextResponse.json({ message: "Hourly package updated successfully.", hourlyPackage });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Hourly package not found or an error occurred." },
      { status: 404 }
    );
  }
}

// DELETE /api/hourly-packages/[id] — حذف باقة
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { id } = await params;
    await prisma.hourlyPackage.delete({ where: { id } });
    return NextResponse.json({ message: "Hourly package deleted successfully." });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Hourly package not found or an error occurred." },
      { status: 404 }
    );
  }
}