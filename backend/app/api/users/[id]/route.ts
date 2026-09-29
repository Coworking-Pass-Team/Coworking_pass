import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse, invalidateBanCache } from "@/lib/auth/verify-token";
import { Role } from "@prisma/client";
import { blacklistUser, removeFromBlacklist } from "@/lib/auth/token-blacklist";
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: عرض بيانات مستخدم (الملف الشخصي)
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
 *         description: بيانات المستخدم
 *       404:
 *         description: User not found.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getTokenFromRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(targetUser);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: تعديل الملف الشخصي أو حظر/رفع حظر مستخدم (Super Admin)
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
 *               name:
 *                 type: string
 *               isBanned:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: تم التعديل بنجاح
 *       403:
 *         description: غير مصرح بتغيير isBanned (Super Admin فقط)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getTokenFromRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await request.json();
    const isAdmin = user.role === "SUPER_ADMIN";

    // Only the account owner or a super admin may modify a profile
    if (!isAdmin && user.userId !== id) {
      return NextResponse.json({ error: "You are not allowed to modify this account." }, { status: 403 });
    }

    // Whitelist updatable fields to prevent mass assignment (role, emailVerified, etc.)
    const data: { name?: string; isBanned?: boolean; role?: Role } = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();

    if (body.isBanned !== undefined || body.role !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: "This action requires administrator privileges." },
          { status: 403 }
        );
      }
      if (typeof body.isBanned === "boolean") {
        if (body.isBanned && id === user.userId) {
          return NextResponse.json({ error: "You cannot block your own account." }, { status: 400 });
        }
        data.isBanned = body.isBanned;
      }
      if (body.role !== undefined) {
        if (!Object.values(Role).includes(body.role)) {
          return NextResponse.json({ error: "Invalid role." }, { status: 400 });
        }
        data.role = body.role as Role;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
      },
    });

    // Apply session changes only after the database write succeeded
    if (data.isBanned === true) {
      blacklistUser(id);
    } else if (data.isBanned === false) {
      removeFromBlacklist(id);
    }
    invalidateBanCache(id);

    return NextResponse.json({ message: "User profile updated successfully.", user: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "User not found or an error occurred." },
      { status: 404 }
    );
  }
}

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: حذف حساب المستخدم وبياناته (حق الحذف - PDPL)
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
 *         description: تم حذف الحساب بنجاح
 *       404:
 *         description: User not found.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getTokenFromRequest(request);
  if (!user) return unauthorizedResponse();

  try {
    const { id } = await params;

    // Only the account owner or a super admin may delete an account
    if (user.role !== "SUPER_ADMIN" && user.userId !== id) {
      return NextResponse.json({ error: "You are not allowed to delete this account." }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "Account and associated data deleted successfully." });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "User not found or an error occurred." },
      { status: 404 }
    );
  }
}