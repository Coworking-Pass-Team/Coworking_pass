import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { calculateDistance } from "@/lib/haversine";

/**
 * @swagger
 * /api/workspaces/nearby:
 *   get:
 *     summary: عرض أقرب مساحات العمل لموقع المستخدم
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: قائمة المساحات مرتبة من الأقرب للأبعد
 *       400:
 *         description: lat أو lng مفقودة
 */
export async function GET(request: Request) {
  try {
    const user = getTokenFromRequest(request);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "الحقول المطلوبة: lat, lng" },
        { status: 400 }
      );
    }

    const userLat = Number(lat);
    const userLng = Number(lng);

    const workspaces = await prisma.workspace.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    const withDistance = workspaces
      .map((ws) => ({
        ...ws,
        distanceKm: calculateDistance(userLat, userLng, ws.latitude!, ws.longitude!),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return NextResponse.json(withDistance);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}