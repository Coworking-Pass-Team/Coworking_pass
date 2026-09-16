import { NextResponse } from 'next/server';
import { seedStandardWorkspaces } from '@/lib/seed-data';

export async function GET() {
  try {
    const workspaces = await seedStandardWorkspaces();
    return NextResponse.json({
      success: true,
      message: 'تمت تغذية جميع المساحات والأقسام والباقات بنجاح في قاعدة البيانات',
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
    return NextResponse.json({ success: false, error: error?.message || 'حدث خطأ أثناء التغذية' }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
