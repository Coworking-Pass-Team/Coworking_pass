import { NextResponse } from "next/server";
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
    const user = getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();

    let amenities = await prisma.amenityCatalog.findMany();
    if (amenities.length === 0) {
      for (const name of DEFAULT_AMENITIES) {
        try {
          await prisma.amenityCatalog.create({
            data: { name, isDefault: true, status: "APPROVED" }
          });
        } catch (_) {}
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
    const user = getTokenFromRequest(request);
if (!user) return unauthorizedResponse();
    const { name, icon, isDefault, requestedBy } = await request.json();

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

    return NextResponse.json(
      { message: "Amenity added successfully.", amenity },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}