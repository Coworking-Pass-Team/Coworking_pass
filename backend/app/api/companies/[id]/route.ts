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
    const user = await getTokenFromRequest(request);
    if (!user) {
      return unauthorizedResponse(request);
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

    // Only a super admin, the company's HR admin, or one of its employees may read it
    if (user.role !== "SUPER_ADMIN") {
      const me = await prisma.user.findUnique({ where: { id: user.userId }, select: { companyId: true } });
      const isOwner = company.hrAdminId === user.userId;
      if (!isOwner && me?.companyId !== company.id) {
        return NextResponse.json({ error: "You are not allowed to view this company." }, { status: 403 });
      }
      // A team member sees which company they belong to and who runs it, never the company's money or their
      // colleagues' details: the company balance is the HR admin's, and what an employee can spend is what
      // the HR admin allocated to their own wallet
      if (!isOwner) {
        const { balance: _balance, totalPassesAllocated: _passes, ...visible } = company;
        void _balance;
        void _passes;
        return NextResponse.json({ ...visible, employees: company.employees.map((e) => ({ id: e.id })) });
      }
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
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Company not found." }, { status: 404 });
    }
    if (user.role !== "SUPER_ADMIN" && !(user.role === "HR_ADMIN" && existing.hrAdminId === user.userId)) {
      return NextResponse.json({ error: "You are not allowed to modify this company." }, { status: 403 });
    }

    // Whitelist fields; the wallet balance can only change via the deposit/withdraw endpoints
    const data: { companyName?: string; totalPassesAllocated?: number } = {};
    if (typeof body.companyName === "string" && body.companyName.trim()) data.companyName = body.companyName.trim();
    if (Number.isInteger(body.totalPassesAllocated) && body.totalPassesAllocated >= 0) {
      data.totalPassesAllocated = body.totalPassesAllocated;
    }

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
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only super admins can delete companies." }, { status: 403 });
    }
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