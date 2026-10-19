import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

// GET /api/partners — List all partners
export async function GET(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);

    // Super admins see every partner in full; a partner sees only their own records; everyone else gets
    // the public profile (no tax number, contact email or revenue share) of approved partners.
    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json(await prisma.partner.findMany({ orderBy: { createdAt: "desc" } }));
    }
    if (user.role === "PARTNER_ADMIN") {
      const me = await prisma.user.findUnique({ where: { id: user.userId }, select: { email: true } });
      const own = me?.email
        ? await prisma.partner.findMany({
            where: { contactEmail: { equals: me.email, mode: "insensitive" } },
            orderBy: { createdAt: "desc" },
          })
        : [];
      return NextResponse.json(own);
    }
    const publicPartners = await prisma.partner.findMany({
      where: { status: "APPROVED" },
      select: { id: true, brandName: true, status: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(publicPartners);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}


/**
 * @swagger
 * /api/partners:
 *   post:
 *     summary: إضافة شريك جديد
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [brandName, contactEmail, taxNumber, revenueSharePercentage]
 *             properties:
 *               brandName:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               taxNumber:
 *                 type: string
 *               revenueSharePercentage:
 *                 type: number
 *     responses:
 *       201:
 *         description: تم إنشاء الشريك بنجاح
 */
// POST /api/partners — إضافة شريك جديد
export async function POST(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    const { brandName, contactEmail, taxNumber, revenueSharePercentage } =
      await request.json();

    if (!brandName || !contactEmail || !taxNumber || revenueSharePercentage === undefined) {
      return NextResponse.json(
        { error: "Required fields: brandName, contactEmail, taxNumber, revenueSharePercentage" },
        { status: 400 }
      );
    }

    // Only super admins and venue partners may create partner records. A partner can only register
    // themselves (their own email) at the platform's standard revenue share, and starts unapproved.
    if (user.role !== "SUPER_ADMIN" && user.role !== "PARTNER_ADMIN") {
      return NextResponse.json({ error: "You are not allowed to create partners." }, { status: 403 });
    }
    let ownerEmail: string = contactEmail;
    let share: number = revenueSharePercentage;
    if (user.role === "PARTNER_ADMIN") {
      const me = await prisma.user.findUnique({ where: { id: user.userId }, select: { email: true } });
      if (!me?.email) return NextResponse.json({ error: "User not found." }, { status: 404 });
      ownerEmail = me.email;
      share = 15;
    }

    // One partner record per email: repeated requests (the app re-checks on every visit) return the existing one
    const existing = await prisma.partner.findFirst({
      where: { contactEmail: { equals: ownerEmail, mode: "insensitive" } },
    });
    if (existing) {
      if (user.role === "PARTNER_ADMIN") {
        return NextResponse.json({ message: "Partner already registered.", partner: existing }, { status: 200 });
      }
      return NextResponse.json({ error: "A partner with this email already exists.", partner: existing }, { status: 409 });
    }

    const partner = await prisma.partner.create({
      data: { brandName, contactEmail: ownerEmail, taxNumber, revenueSharePercentage: share },
    });

    return NextResponse.json(
      { message: "Partner created successfully.", partner },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}