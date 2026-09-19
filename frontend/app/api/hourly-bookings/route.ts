import { NextResponse } from 'next/server';

export interface HourlyBookingItem {
  id: string;
  userId: string;
  workspaceId?: string;
  sectionId: string;
  packageId: string;
  startDate: string;
  endDate: string;
  hoursUsed: number;
  durationHours?: number;
  durationDetails?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
  workspace?: {
    id?: string;
    name?: string;
    city?: string;
  };
  section?: {
    id?: string;
    name?: string;
    type?: string;
    workspace?: {
      id?: string;
      name?: string;
      city?: string;
    };
  };
  package?: {
    id?: string;
    packageName?: string;
    hoursAmount?: number;
    price?: number;
  };
}

const DEFAULT_HOURLY_BOOKINGS: HourlyBookingItem[] = [];

const globalHourlyBookings = global as unknown as {
  __cp_hourly_bookings?: HourlyBookingItem[];
};

if (!globalHourlyBookings.__cp_hourly_bookings) {
  globalHourlyBookings.__cp_hourly_bookings = [...DEFAULT_HOURLY_BOOKINGS];
}

export async function GET(request: Request) {
  try {
    const list = globalHourlyBookings.__cp_hourly_bookings || [];
    return NextResponse.json(list);
  } catch (error) {
    console.error('[Hourly Bookings GET Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid JSON body. Required: userId, sectionId, packageId, startDate, endDate' },
        { status: 400 }
      );
    }

    const userId = body.userId || body.user_id;
    const sectionId = body.sectionId || body.section_id;
    const packageId = body.packageId || body.package_id;
    const startDate = body.startDate || body.start_date;
    const endDate = body.endDate || body.end_date;
    const status = body.status || 'ACTIVE';

    if (!userId || !sectionId || !packageId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'All fields (userId, sectionId, packageId, startDate, endDate) are required.' },
        { status: 400 }
      );
    }

    const startObj = new Date(startDate);
    const endObj = new Date(endDate);

    const durationHours = Math.min(4, Math.max(1, Number(body.durationHours || 1)));
    const durationDetails = body.durationDetails || `${durationHours} ${durationHours === 1 ? 'Hour' : 'Hours'}`;

    const newBooking: HourlyBookingItem = {
      id: `hb_${Date.now()}`,
      userId: String(userId),
      workspaceId: body.workspaceId ? String(body.workspaceId) : undefined,
      sectionId: String(sectionId),
      packageId: String(packageId),
      startDate: isNaN(startObj.getTime()) ? startDate : startObj.toISOString(),
      endDate: isNaN(endObj.getTime()) ? endDate : endObj.toISOString(),
      hoursUsed: durationHours,
      durationHours,
      durationDetails,
      status: status === 'ACTIVE' || status === 'EXPIRED' || status === 'CANCELLED' ? status : 'ACTIVE',
      user: {
        id: String(userId),
        name: body.userName || 'Member User',
        email: body.userEmail || 'user@example.com',
      },
      workspace: {
        id: body.workspaceId || 'ws-default',
        name: body.spaceName || 'Coworking Space',
        city: body.city || 'Riyadh',
      },
      section: {
        id: String(sectionId),
        name: body.sectionName || `${body.spaceName || 'Space'} - Meeting Room`,
        type: body.sectionType || 'MEETING_ROOM',
        workspace: {
          id: body.workspaceId || 'ws-default',
          name: body.spaceName || 'Coworking Space',
          city: body.city || 'Riyadh',
        },
      },
      package: {
        id: String(packageId),
        packageName: body.packageName || `${durationHours} Hour Package`,
        hoursAmount: durationHours,
        price: Number(body.price || 50 * durationHours),
      },
    };

    if (!globalHourlyBookings.__cp_hourly_bookings || !Array.isArray(globalHourlyBookings.__cp_hourly_bookings)) {
      globalHourlyBookings.__cp_hourly_bookings = [...DEFAULT_HOURLY_BOOKINGS];
    }

    globalHourlyBookings.__cp_hourly_bookings.unshift(newBooking);

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error: any) {
    console.error('[Hourly Bookings POST Error]:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create hourly booking' }, { status: 400 });
  }
}
