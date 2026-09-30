import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { canManageWorkspace, forbiddenResponse } from "@/lib/ownership";


/**
 * @swagger
 * /api/workspace-sections/{id}:
 *   put:
 *     summary: تعديل قسم
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
 *               capacity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: تم تعديل القسم
 */
// PUT /api/workspace-sections/[id] — تعديل قسم
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.workspaceSection.findUnique({ where: { id }, select: { workspaceId: true } });
    if (!existing) return NextResponse.json({ error: "Section not found." }, { status: 404 });
    if (!(await canManageWorkspace(user, existing.workspaceId))) {
      return forbiddenResponse("Only the owning partner or an administrator can modify this room.");
    }

    // Whitelist editable fields: the workspace link and id can never be reassigned
    const data: Record<string, unknown> = {};
    for (const key of ["type", "name", "capacity", "dailyRate", "monthlyRate", "yearlyRate", "hourlyRate", "subType"]) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    const section = await prisma.workspaceSection.update({
      where: { id },
      data,
    });

    return NextResponse.json({ message: "Section updated successfully.", section });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Section not found or an error occurred." },
      { status: 404 }
    );
  }
}

// DELETE /api/workspace-sections/[id] — حذف قسم
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    const { id } = await params;
    const existing = await prisma.workspaceSection.findUnique({ where: { id }, select: { workspaceId: true } });
    if (!existing) return NextResponse.json({ error: "Section not found." }, { status: 404 });
    if (!(await canManageWorkspace(user, existing.workspaceId))) {
      return forbiddenResponse("Only the owning partner or an administrator can delete this room.");
    }
    await prisma.workspaceSection.delete({ where: { id } });
    return NextResponse.json({ message: "Section deleted successfully." });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Section not found or an error occurred." },
      { status: 404 }
    );
  }
}