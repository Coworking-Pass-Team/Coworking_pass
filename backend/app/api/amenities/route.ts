import { NextResponse } from "next/server";
import { requireRoles } from '@/lib/ownership';
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

const DEFAULT_AMENITIES = [
  'High-Speed Wi-Fi',
  'Coffee Bar',
  'Meeting Rooms',
  'Printer',
  'Parking',
  'Prayer Room',
  'Lounge',
  'Showers',
  'Kitchen',
  'Reception',
  'Event Space',
  '4K Projector',
  'Sound System',
  'Interactive Smartboard',
  'Auditorium Seating',
  'Private Desks',
  '24/7 Access',
];

// GET /api/amenities — عرض كل المرافق
export async function GET(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
    if (!user) return unauthorizedResponse(request);

    let amenities = await prisma.amenityCatalog.findMany();
    if (amenities.length === 0) {
      for (const name of DEFAULT_AMENITIES) {
        try {
          await prisma.amenityCatalog.create({
            data: { name, isDefault: true, status: "APPROVED" }
          });
        } catch {}
      }
      amenities = await prisma.amenityCatalog.findMany();
    }
    return NextResponse.json(amenities);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}


/**
 * @swagger
 * /api/amenities:
 *   post:
 *     summary: اقتراح مرفق جديد
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *                 description: true = يوافق تلقائياً، false = يحتاج موافقة
 *               requestedBy:
 *                 type: string
 *                 description: مطلوب فقط لو isDefault = false
 *     responses:
 *       201:
 *         description: تم إضافة المرفق بنجاح
 */
// POST /api/amenities — اقتراح مرفق جديد
export async function POST(request: Request) {
  try {
    const user = await getTokenFromRequest(request);
if (!user) return unauthorizedResponse(request);
    const roleDenied = requireRoles(user, ['SUPER_ADMIN', 'PARTNER_ADMIN']);
    if (roleDenied) return roleDenied;

    const { name, icon, isDefault, requestedBy: sentRequester, spaceName } = await request.json();
    // A partner's request is always filed under their own account, whatever the browser sends
    const requestedBy = user.role === 'SUPER_ADMIN' ? sentRequester : user.userId;

    if (!name) {
      return NextResponse.json({ error: "Field 'name' is required." }, { status: 400 });
    }

    // لو مرفق افتراضي من الإدارة، يوافق عليه تلقائياً
    // لو مقترح من شريك، يبقى بانتظار الموافقة
    const status = isDefault ? "APPROVED" : "PENDING_APPROVAL";

    if (!isDefault && !requestedBy) {
      return NextResponse.json(
        { error: "requestedBy is required when suggesting a custom amenity." },
        { status: 400 }
      );
    }

    const amenity = await prisma.amenityCatalog.create({
      data: {
        name,
        icon,
        isDefault: isDefault ?? false,
        status,
        requestedBy: isDefault ? null : requestedBy,
      },
    });

    // Tell every Super Admin about a custom request (best effort; never blocks the request)
    if (!isDefault) {
      try {
        const [requester, admins] = await Promise.all([
          prisma.user.findUnique({ where: { id: requestedBy }, select: { name: true } }),
          prisma.user.findMany({ where: { role: "SUPER_ADMIN", NOT: { id: user.userId } }, select: { id: true } }),
        ]);
        const who = requester?.name || "A partner";
        const where = typeof spaceName === "string" && spaceName.trim() ? ` for ${spaceName.trim().slice(0, 120)}` : "";
        if (admins.length > 0) {
          await prisma.notification.createMany({
            data: admins.map((a) => ({
              userId: a.id,
              type: "AMENITY_REQUEST_STATUS" as const,
              title: "New Custom Amenity Request",
              message: `${who} requested custom amenity "${String(name).slice(0, 120)}"${where}.`,
              channel: "IN_APP" as const,
              sentAt: new Date(),
            })),
          });
        }
      } catch (notifyError) {
        console.warn("Amenity request notification failed:", notifyError);
      }
    }

    return NextResponse.json(
      { message: "Amenity added successfully.", amenity },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}