import { NextResponse } from 'next/server';

export interface HourlyBookingItem {
  id: string;
  userId: string;
  sectionId: string;
  packageId: string;
  startDate: string;
  endDate: string;
  hoursUsed: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
  section?: {
    id?: string;
    name?: string;
    type?: string;
  };
  package?: {
    id?: string;
    packageName?: string;
    hoursAmount?: number;
    price?: number;
  };
}

const DEFAULT_HOURLY_BOOKINGS: HourlyBookingItem[] = [
  {
    id: 'hb_001',
    userId: 'usr_b2c',
    sectionId: 'sec_room_1',
    packageId: 'pkg_10h',
    startDate: '2026-09-05T09:00:00.000Z',
    endDate: '2026-09-05T19:00:00.000Z',
    hoursUsed: 2,
    status: 'ACTIVE',
    user: {
      name: 'Sarah Al-Otaibi',
      email: 'sarah@example.com',
    },
    section: {
      name: 'Executive Meeting Room A',
      type: 'MEETING_ROOM',
    },
    package: {
      packageName: '10-Hour Executive Package',
      hoursAmount: 10,
      price: 500,
    },
  },
];

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

    const newBooking: HourlyBookingItem = {
      id: `hb_${Date.now()}`,
      userId: String(userId),
      sectionId: String(sectionId),
      packageId: String(packageId),
      startDate: isNaN(startObj.getTime()) ? startDate : startObj.toISOString(),
      endDate: isNaN(endObj.getTime()) ? endDate : endObj.toISOString(),
      hoursUsed: 0,
      status: status === 'ACTIVE' || status === 'EXPIRED' || status === 'CANCELLED' ? status : 'ACTIVE',
      user: {
        id: String(userId),
        name: body.userName || 'Member User',
        email: body.userEmail || 'user@example.com',
      },
      section: {
        id: String(sectionId),
        name: body.sectionName || 'Meeting Room 1',
        type: body.sectionType || 'MEETING_ROOM',
      },
      package: {
        id: String(packageId),
        packageName: body.packageName || 'Hourly Pack',
        hoursAmount: Number(body.hoursAmount || 10),
        price: Number(body.price || 400),
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
