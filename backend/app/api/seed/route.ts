import { NextResponse } from 'next/server';
import { seedStandardWorkspaces, deduplicateWorkspaces } from '@/lib/seed-data';

export async function GET() {
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
    return NextResponse.json({ success: false, error: error?.message || 'Failed to seed database.' }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
