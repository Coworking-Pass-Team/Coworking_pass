import { NextResponse } from 'next/server';
import { seedStandardWorkspaces, deduplicateWorkspaces } from '@/lib/seed-data';
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";

export async function GET(request: Request) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "SUPER_ADMIN") return unauthorizedResponse();

  try {
    await deduplicateWorkspaces();
    const workspaces = await seedStandardWorkspaces();
    return NextResponse.json({
      success: true,
      message: 'All workspaces, sections, and packages seeded successfully in database.',
      count: workspaces.length,
      workspaces: workspaces.map((w: any) => ({
        id: w.id,
        name: w.name,
        city: w.city,
        sectionsCount: w.sections?.length || 0,
        sections: w.sections?.map((s: any) => ({ id: s.id, type: s.type, name: s.name })) || []
      }))
    });
  } catch (error: any) {
    console.error('Error seeding workspaces:', error);
    return NextResponse.json({ success: false, error: 'Failed to seed database.' }, { status: 500 });
  }
}