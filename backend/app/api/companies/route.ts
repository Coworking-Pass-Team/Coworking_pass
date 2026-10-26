import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";


/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: عرض كل الشركات
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: نجح
 *       401:
 *         description: غير مصرح
 */

// GET /api/companies — عرض كل الشركات
export async function GET(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);


    // Super admins see every company; everyone else only their own (as HR admin or employee).
    // Users are returned without credentials or other private columns.
    let where: Record<string, unknown> = {};
    if (user.role !== "SUPER_ADMIN") {
      const me = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { companyId: true, hrAdminOf: { select: { id: true } } },
      });
      const ownId = me?.hrAdminOf?.id ?? me?.companyId ?? null;
      where = { id: ownId ?? "__none__" };
    }

    const safeUser = { id: true, name: true, email: true, role: true, companyId: true, isBanned: true } as const;
    const companies = await prisma.company.findMany({
      where,
      include: { hrAdmin: { select: safeUser }, employees: { select: safeUser } },
    });
    return NextResponse.json(companies);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: إنشاء شركة جديدة
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *               hrAdminId:
 *                 type: string
 *               totalPassesAllocated:
 *                 type: integer
 *     responses:
 *       201:
 *         description: تم الإنشاء بنجاح
 *       401:
 *         description: غير مصرح
 */

// POST /api/companies — إضافة شركة جديدة
export async function POST(request: Request) {
  try {
     const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);


    const { companyName, hrAdminId, totalPassesAllocated } = await request.json();

    // Only a super admin, or the HR admin the company belongs to, may create or change it
    if (user.role !== "SUPER_ADMIN" && !(user.role === "HR_ADMIN" && hrAdminId === user.userId)) {
      return NextResponse.json({ error: "You are not allowed to manage this company." }, { status: 403 });
    }
    // Pass allocations are granted by the platform: ignore the field for anyone but a super admin
    const allocation: number | undefined = user.role === "SUPER_ADMIN" ? totalPassesAllocated : undefined;

    if (!companyName || !hrAdminId) {
      return NextResponse.json(
        { error: "Required fields: companyName, hrAdminId" },
        { status: 400 }
      );
    }

    const userExists = await prisma.user.findUnique({ where: { id: hrAdminId } });
    if (!userExists) {
      return NextResponse.json({ error: "User (hrAdminId) not found." }, { status: 404 });
    }

    if (userExists.role !== "HR_ADMIN") {
      return NextResponse.json(
        { error: "This user role is not HR_ADMIN." },
        { status: 400 }
      );
    }

    const existingCompany = await prisma.company.findUnique({
      where: { hrAdminId },
    });

    let company;
    if (existingCompany) {
      company = await prisma.company.update({
        where: { hrAdminId },
        data: {
          companyName: companyName.trim(),
          ...(allocation !== undefined ? { totalPassesAllocated: allocation } : {}),
        },
      });
    } else {
      company = await prisma.company.create({
        data: {
          companyName: companyName.trim(),
          hrAdminId,
          totalPassesAllocated: allocation ?? 0,
        },
      });
    }

    if (!userExists.companyId) {
      await prisma.user.update({
        where: { id: hrAdminId },
        data: { companyId: company.id },
      }).catch(() => {});
    }

    return NextResponse.json(
      { message: existingCompany ? "Company updated successfully." : "Company created successfully.", company },
      { status: existingCompany ? 200 : 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}