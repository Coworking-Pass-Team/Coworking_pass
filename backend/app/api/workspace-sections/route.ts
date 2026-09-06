import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["DESK", "MEETING_ROOM", "THEATER"];

// GET /api/workspace-sections — عرض كل الأقسام
export async function GET() {
  try {
    const sections = await prisma.workspaceSection.findMany({
      include: { workspace: true },
    });
    return NextResponse.json(sections);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}

// POST /api/workspace-sections — إضافة قسم جديد لمساحة عمل
export async function POST(request: Request) {
  try {
    const { workspaceId, type, name, capacity, dailyRate, monthlyRate, yearlyRate } =
      await request.json();

    if (!workspaceId || !type || !name || !capacity) {
      return NextResponse.json(
        { error: "الحقول المطلوبة: workspaceId, type, name, capacity" },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `type يجب أن يكون: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const workspaceExists = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspaceExists) {
      return NextResponse.json({ error: "المساحة (workspaceId) غير موجودة" }, { status: 404 });
    }

    const section = await prisma.workspaceSection.create({
      data: { workspaceId, type, name, capacity, dailyRate, monthlyRate, yearlyRate },
    });

    return NextResponse.json(
      { message: "تم إنشاء القسم بنجاح", section },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}