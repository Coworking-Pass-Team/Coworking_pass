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
    const user = getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();


    const companies = await prisma.company.findMany({
      include: { hrAdmin: true, employees: true },
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
     const user = getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();


    const { companyName, hrAdminId, totalPassesAllocated } = await request.json();

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
          ...(totalPassesAllocated !== undefined ? { totalPassesAllocated } : {}),
        },
      });
    } else {
      company = await prisma.company.create({
        data: {
          companyName: companyName.trim(),
          hrAdminId,
          totalPassesAllocated: totalPassesAllocated ?? 0,
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