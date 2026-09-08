import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

const VALID_PERIOD_TYPES = ["PER_DAY", "PER_MONTH"];

// GET /api/hourly-packages — عرض كل باقات الساعات
export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const packages = await prisma.hourlyPackage.findMany({
      include: { section: true },
    });
    return NextResponse.json(packages);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}



/**
 * @swagger
 * /api/hourly-packages:
 *   post:
 *     summary: إضافة باقة ساعات جديدة
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sectionId, packageName, hoursAmount, periodType, price]
 *             properties:
 *               sectionId:
 *                 type: string
 *                 description: يجب أن يكون قسم نوعه MEETING_ROOM أو THEATER
 *               packageName:
 *                 type: string
 *               hoursAmount:
 *                 type: integer
 *               periodType:
 *                 type: string
 *                 enum: [PER_DAY, PER_MONTH]
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: تم إنشاء الباقة بنجاح
 *       400:
 *         description: القسم المرتبط نوعه DESK
 */
// POST /api/hourly-packages — إضافة باقة ساعات جديدة
export async function POST(request: Request) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { sectionId, packageName, hoursAmount, periodType, price } =
      await request.json();

    if (!sectionId || !packageName || !hoursAmount || !periodType || !price) {
      return NextResponse.json(
        { error: "الحقول المطلوبة: sectionId, packageName, hoursAmount, periodType, price" },
        { status: 400 }
      );
    }

    if (!VALID_PERIOD_TYPES.includes(periodType)) {
      return NextResponse.json(
        { error: `periodType يجب أن يكون: ${VALID_PERIOD_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const sectionExists = await prisma.workspaceSection.findUnique({ where: { id: sectionId } });
    if (!sectionExists) {
      return NextResponse.json({ error: "القسم (sectionId) غير موجود" }, { status: 404 });
    }

    if (!["MEETING_ROOM", "THEATER"].includes(sectionExists.type)) {
      return NextResponse.json(
        { error: "باقات الساعات تنطبق فقط على قاعات الاجتماعات أو المسارح" },
        { status: 400 }
      );
    }

    const hourlyPackage = await prisma.hourlyPackage.create({
      data: { sectionId, packageName, hoursAmount, periodType, price },
    });

    return NextResponse.json(
      { message: "تم إنشاء الباقة بنجاح", hourlyPackage },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}