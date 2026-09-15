import { NextRequest, NextResponse } from 'next/server';

export interface FrontendDirectBooking {
  id: string;
  userId: string;
  workspaceId: string;
  sectionId: string;
  durationType: 'DAILY' | 'MONTHLY' | 'YEARLY';
  bookingDate: string;
  status: 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  workspace: {
    id: string;
    partnerId: string;
    name: string;
    city: string;
    locationMapUrl?: string;
    dailyRate?: number;
    monthlyRate?: number;
    yearlyRate?: number;
    passVisitValue: number;
    totalCapacity: number;
  };
  section: {
    id: string;
    workspaceId: string;
    type: 'DESK' | 'MEETING_ROOM' | 'THEATER';
    name: string;
    capacity: number;
    dailyRate?: number;
    monthlyRate?: number;
    yearlyRate?: number;
  };
}

// In-memory mock database for fallback
declare global {
  // eslint-disable-next-line no-var
  var __mockDirectBookings: FrontendDirectBooking[] | undefined;
}

if (!globalThis.__mockDirectBookings) {
  globalThis.__mockDirectBookings = [
    {
      id: 'db-001',
      userId: 'usr-1',
      workspaceId: 'ws-olaya',
      sectionId: 'sec-desk-01',
      durationType: 'DAILY',
      bookingDate: new Date(Date.now() + 86400000).toISOString(),
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      user: {
        id: 'usr-1',
        name: 'Sara Al-Ahmad',
        email: 'sara@example.com',
        role: 'B2C',
      },
      workspace: {
        id: 'ws-olaya',
        partnerId: 'partner-1',
        name: 'The Hub - Al Olaya',
        city: 'Riyadh',
        passVisitValue: 1,
        totalCapacity: 50,
      },
      section: {
        id: 'sec-desk-01',
        workspaceId: 'ws-olaya',
        type: 'DESK',
        name: 'Hot Desk Area A',
        capacity: 20,
        dailyRate: 65,
      },
    },
    {
      id: 'db-002',
      userId: 'usr-2',
      workspaceId: 'ws-malqa',
      sectionId: 'sec-meet-02',
      durationType: 'MONTHLY',
      bookingDate: new Date(Date.now() + 172800000).toISOString(),
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      user: {
        id: 'usr-2',
        name: 'Acme Corp Admin',
        email: 'hr@acme.sa',
        role: 'HR_ADMIN',
      },
      workspace: {
        id: 'ws-malqa',
        partnerId: 'partner-2',
        name: 'Oasis Coworking - Al Malqa',
        city: 'Riyadh',
        passVisitValue: 1,
        totalCapacity: 80,
      },
      section: {
        id: 'sec-meet-02',
        workspaceId: 'ws-malqa',
        type: 'MEETING_ROOM',
        name: 'Boardroom VIP',
        capacity: 12,
        monthlyRate: 3500,
      },
    },
  ];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const workspaceId = searchParams.get('workspaceId');
    const sectionId = searchParams.get('sectionId');
    const status = searchParams.get('status');

    let list = [...(globalThis.__mockDirectBookings || [])];

    if (userId) list = list.filter((b) => b.userId === userId);
    if (workspaceId) list = list.filter((b) => b.workspaceId === workspaceId);
    if (sectionId) list = list.filter((b) => b.sectionId === sectionId);
    if (status) list = list.filter((b) => b.status === status);

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error in direct-bookings fallback route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, workspaceId, sectionId, durationType, bookingDate, status = 'CONFIRMED' } = body;

    if (!userId || !workspaceId || !sectionId || !durationType || !bookingDate) {
      return NextResponse.json(
        { error: 'All fields are required: userId, workspaceId, sectionId, durationType, bookingDate' },
        { status: 400 }
      );
    }

    const newBooking: FrontendDirectBooking = {
      id: `db-${Date.now()}`,
      userId,
      workspaceId,
      sectionId,
      durationType: durationType.toUpperCase(),
      bookingDate: new Date(bookingDate).toISOString(),
      status: status || 'CONFIRMED',
      createdAt: new Date().toISOString(),
      user: {
        id: userId,
        name: 'Member User',
        email: 'user@example.com',
        role: 'B2C',
      },
      workspace: {
        id: workspaceId,
        partnerId: 'partner-1',
        name: 'Workspace Space',
        city: 'Riyadh',
        passVisitValue: 1,
        totalCapacity: 40,
      },
      section: {
        id: sectionId,
        workspaceId,
        type: 'DESK',
        name: 'Dedicated Section',
        capacity: 10,
      },
    };

    globalThis.__mockDirectBookings = [newBooking, ...(globalThis.__mockDirectBookings || [])];

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error('Error creating direct-booking fallback:', error);
    return NextResponse.json({ error: 'Failed to create direct booking' }, { status: 500 });
  }
}
