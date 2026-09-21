import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

const VALID_TYPES = ["DESK", "MEETING_ROOM", "THEATER"];

// GET /api/workspace-sections — عرض كل الأقسام (public - لا يحتاج توثيق)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const type = searchParams.get('type');

    const whereClause: any = {};
    if (workspaceId) whereClause.workspaceId = workspaceId;
    if (type && VALID_TYPES.includes(type)) whereClause.type = type;

    const sections = await prisma.workspaceSection.findMany({
      where: whereClause,
      include: { workspace: true, hourlyPackages: true },
    });
    return NextResponse.json(sections);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}


/**
 * @swagger
 * /api/workspace-sections:
 *   post:
 *     summary: إضافة قسم جديد لمساحة عمل
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [workspaceId, type, name, capacity]
 *             properties:
 *               workspaceId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [DESK, MEETING_ROOM, THEATER]
 *               name:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               dailyRate:
 *                 type: number
 *               monthlyRate:
 *                 type: number
 *               yearlyRate:
 *                 type: number
 *     responses:
 *       201:
 *         description: تم إنشاء القسم بنجاح
 */
// POST /api/workspace-sections — إضافة قسم جديد لمساحة عمل
export async function POST(request: Request) {
  try {
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { workspaceId, type, name, capacity, dailyRate, monthlyRate, yearlyRate } =
      await request.json();

    if (!workspaceId || !type || !name || !capacity) {
      return NextResponse.json(
        { error: "Required fields: workspaceId, type, name, capacity" },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const workspaceExists = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspaceExists) {
      return NextResponse.json({ error: "Workspace (workspaceId) not found." }, { status: 404 });
    }

    const section = await prisma.workspaceSection.create({
      data: { workspaceId, type, name, capacity, dailyRate, monthlyRate, yearlyRate },
    });

    return NextResponse.json(
      { message: "Section created successfully.", section },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}