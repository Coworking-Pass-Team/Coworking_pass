import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";


/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: جلب بيانات شركة ومحفظتها المشتركة
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: نجح
 *       404:
 *         description: الشركة غير موجودة
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
    if (!user && process.env.NODE_ENV === 'production') {
      return unauthorizedResponse();
    }

    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        hrAdmin: {
          select: { id: true, name: true, email: true, role: true },
        },
        employees: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("❌ Error fetching company:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/companies/{id}:
 *   put:
 *     summary: تعديل شركة
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
 *               totalPassesAllocated:
 *                 type: integer
 *     responses:
 *       200:
 *         description: تم تعديل الشركة
 */
// PUT /api/companies/[id] — تعديل شركة
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { id } = await params;
    const data = await request.json();

    const company = await prisma.company.update({
      where: { id },
      data,
    });

    return NextResponse.json({ message: "Company updated successfully.", company });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Company not found or an error occurred." },
      { status: 404 }
    );
  }
}

// DELETE /api/companies/[id] — حذف شركة
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { id } = await params;

    await prisma.company.delete({ where: { id } });

    return NextResponse.json({ message: "Company deleted successfully." });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Company not found or an error occurred." },
      { status: 404 }
    );
  }
}