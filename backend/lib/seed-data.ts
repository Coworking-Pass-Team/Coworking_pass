import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ensureDatabaseSchema } from '@/lib/db-schema-sync';

export interface StandardSpaceSeed {
  name: string;
  nameAr?: string;
  city: string;
  category: 'office' | 'hall' | 'theater';
  type: string;
  dailyRate: number;
  monthlyRate: number;
  yearlyRate: number;
  totalCapacity: number;
  latitude: number;
  longitude: number;
  images: string[];
  amenities: string[];
}


const CITY_AR: Record<string, string> = {
  Riyadh: 'الرياض',
  Jeddah: 'جدة',
  Dammam: 'الدمام',
  'Al Khobar': 'الخبر',
  Mecca: 'مكة المكرمة',
  Madinah: 'المدينة المنورة',
};

/** Standard bilingual descriptions per category and type; authored text, not machine-translated at runtime. */
export function standardDescriptions(s: Pick<StandardSpaceSeed, 'category' | 'type' | 'city'>): { description: string; descriptionAr: string } {
  const cityAr = CITY_AR[s.city] ?? s.city;
  if (s.category === 'theater') {
    return {
      description: `A fully equipped theater in ${s.city} with tiered seating, professional stage lighting and cinema-grade audio-visual systems, ideal for conferences, screenings and live performances. Bookable by the hour.`,
      descriptionAr: `مسرح مجهز بالكامل في ${cityAr} بمقاعد متدرجة وإضاءة مسرحية احترافية وأنظمة سمعية وبصرية بجودة سينمائية، مثالي للمؤتمرات والعروض السينمائية والفعاليات الحية. متاح للحجز بالساعة.`,
    };
  }
  if (s.category === 'hall') {
    return {
      description: `A flexible hall in ${s.city} for meetings, training sessions, workshops and corporate events, with modern presentation equipment, high-speed Wi-Fi and hospitality support. Bookable by the hour.`,
      descriptionAr: `قاعة مرنة في ${cityAr} للاجتماعات والدورات التدريبية وورش العمل والفعاليات المؤسسية، مجهزة بمعدات عرض حديثة وواي فاي عالي السرعة وخدمات ضيافة. متاحة للحجز بالساعة.`,
    };
  }
  if (s.type === 'hot-desk') {
    return {
      description: `A vibrant hot-desk coworking space in ${s.city} with ergonomic seating, fast Wi-Fi, coffee and meeting facilities. Book by the day, month or year.`,
      descriptionAr: `مساحة عمل مشترك نابضة بالحياة في ${cityAr} بمكاتب مشتركة ومقاعد مريحة وواي فاي سريع وقهوة ومرافق اجتماعات. متاحة للحجز باليوم أو الشهر أو السنة.`,
    };
  }
  return {
    description: `A professional coworking space in ${s.city} offering desks, meeting rooms and private work areas in a productive, well-connected environment. Book by the day, month or year.`,
    descriptionAr: `مساحة عمل مشترك احترافية في ${cityAr} توفر مكاتب وقاعات اجتماعات ومناطق عمل خاصة في بيئة منتجة ومتصلة جيداً. متاحة للحجز باليوم أو الشهر أو السنة.`,
  };
}

export const ALL_STANDARD_SPACES: StandardSpaceSeed[] = [
  {
    name: 'The Hub Riyadh',
    nameAr: 'ذا هب الرياض',
    city: 'Riyadh',
    category: 'office',
    type: 'mixed',
    dailyRate: 150,
    monthlyRate: 1800,
    yearlyRate: 18000,
    totalCapacity: 60,
    latitude: 24.6970,
    longitude: 46.6850,
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['High-Speed WiFi', 'Coffee & Tea', 'Printer', 'Phone Booths', 'Lounge Area', 'Parking']
  },
  {
    name: 'WorkBay Jeddah',
    nameAr: 'وورك باي جدة',
    city: 'Jeddah',
    category: 'office',
    type: 'hot-desk',
    dailyRate: 120,
    monthlyRate: 1500,
    yearlyRate: 14400,
    totalCapacity: 35,
    latitude: 21.5833,
    longitude: 39.1167,
    images: [
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['WiFi', 'Coffee Bar', 'Printer', 'Locker', 'Terrace']
  },
  {
    name: 'Desk Society',
    nameAr: 'ديسك سوسايتي',
    city: 'Riyadh',
    category: 'office',
    type: 'hot-desk',
    dailyRate: 180,
    monthlyRate: 2200,
    yearlyRate: 22000,
    totalCapacity: 50,
    latitude: 24.7645,
    longitude: 46.6341,
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['Gigabit WiFi', 'Specialty Coffee', 'Concierge', 'Lockers', 'Showers']
  },
  {
    name: 'The Collective Dammam',
    nameAr: 'ذا كوليكتيف الدمام',
    city: 'Dammam',
    category: 'office',
    type: 'mixed',
    dailyRate: 100,
    monthlyRate: 1200,
    yearlyRate: 12000,
    totalCapacity: 30,
    latitude: 26.4385,
    longitude: 50.1172,
    images: [
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['WiFi', 'Coffee', 'Printer', 'Meeting Rooms', 'Event Space']
  },
  {
    name: 'Oasis Coworking',
    nameAr: 'واحة للعمل المشترك',
    city: 'Al Khobar',
    category: 'office',
    type: 'private-office',
    dailyRate: 130,
    monthlyRate: 1600,
    yearlyRate: 16000,
    totalCapacity: 40,
    latitude: 26.4485,
    longitude: 50.1165,
    images: [
      'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['WiFi', 'Espresso Bar', 'Soundproof Rooms', 'Parking']
  },
  {
    name: 'Red Sea Hub',
    nameAr: 'ريد سي هب',
    city: 'Jeddah',
    category: 'office',
    type: 'mixed',
    dailyRate: 140,
    monthlyRate: 1700,
    yearlyRate: 17000,
    totalCapacity: 45,
    latitude: 21.5433,
    longitude: 39.1728,
    images: [
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['High-Speed WiFi', 'Coffee', 'Printing', 'Sea View Lounge']
  },
  {
    name: 'Khobar Tech Space',
    nameAr: 'مساحة الخبر التقنية',
    city: 'Al Khobar',
    category: 'office',
    type: 'hot-desk',
    dailyRate: 110,
    monthlyRate: 1350,
    yearlyRate: 13500,
    totalCapacity: 35,
    latitude: 26.2818,
    longitude: 50.2084,
    images: [
      'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['Fast WiFi', 'Coffee', 'Podcasts Room', 'Lockers']
  },
  {
    name: 'Malqa Workspace',
    nameAr: 'مساحة الملقا',
    city: 'Riyadh',
    category: 'office',
    type: 'private-office',
    dailyRate: 160,
    monthlyRate: 1950,
    yearlyRate: 19500,
    totalCapacity: 55,
    latitude: 24.8100,
    longitude: 46.6150,
    images: [
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['Fiber WiFi', 'Coffee Station', 'Dedicated Desks', 'Meeting Room']
  },
  {
    name: 'Al Majlis Grand Conference Hall',
    nameAr: 'قاعة المجلس الكبرى للمؤتمرات',
    city: 'Riyadh',
    category: 'hall',
    type: 'conference-hall',
    dailyRate: 1800,
    monthlyRate: 25000,
    yearlyRate: 250000,
    totalCapacity: 120,
    latitude: 24.7015,
    longitude: 46.6812,
    images: [
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['4K Projector & Screens', 'Wireless Microphones', 'Surround Sound', 'Podium', 'Catering Area']
  },
  {
    name: 'Horizon Interactive Training Hall',
    nameAr: 'قاعة هورايزن التدريبية التفاعلية',
    city: 'Jeddah',
    category: 'hall',
    type: 'training-hall',
    dailyRate: 1200,
    monthlyRate: 18000,
    yearlyRate: 180000,
    totalCapacity: 60,
    latitude: 21.5582,
    longitude: 39.1620,
    images: [
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['Interactive Smartboards', 'High-Speed Fiber WiFi', 'Whiteboards', 'Classroom Desks', 'Coffee Station']
  },
  {
    name: 'KAFD Grand Auditorium & Theater',
    nameAr: 'مسرح وقاعة كافد الكبرى',
    city: 'Riyadh',
    category: 'theater',
    type: 'theater',
    dailyRate: 5000,
    monthlyRate: 80000,
    yearlyRate: 800000,
    totalCapacity: 250,
    latitude: 24.7645,
    longitude: 46.6341,
    images: [
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['Tiered Auditorium Seating', '8K Laser Projection', 'Stage Lighting', 'Dolby Atmos Sound']
  },
  {
    name: 'Red Sea Executive Auditorium',
    nameAr: 'قاعة البحر الأحمر التنفيذية',
    city: 'Jeddah',
    category: 'theater',
    type: 'performance-theater',
    dailyRate: 4000,
    monthlyRate: 60000,
    yearlyRate: 600000,
    totalCapacity: 180,
    latitude: 21.5833,
    longitude: 39.1167,
    images: [
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['Cinema-Grade Projection', 'VIP Box', 'Recording Equipment', 'Stage Lighting']
  },
  {
    name: 'Al Andalus Multi-Purpose Hall',
    nameAr: 'قاعة الأندلس متعددة الأغراض',
    city: 'Jeddah',
    category: 'hall',
    type: 'multipurpose-hall',
    dailyRate: 1500,
    monthlyRate: 22000,
    yearlyRate: 220000,
    totalCapacity: 90,
    latitude: 21.5650,
    longitude: 39.1450,
    images: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['Modular Partitions', 'Stage & Lighting', 'Dual Projectors', 'Buffet Area']
  },
  {
    name: 'Diriyah Heritage Meeting Hall',
    nameAr: 'قاعة اجتماعات الدرعية التراثية',
    city: 'Riyadh',
    category: 'hall',
    type: 'meeting-hall',
    dailyRate: 1000,
    monthlyRate: 15000,
    yearlyRate: 150000,
    totalCapacity: 40,
    latitude: 24.7330,
    longitude: 46.5740,
    images: [
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['Traditional Majlis Seating', 'Modern Presentation Display', 'Arabic Hospitality Station']
  },
  {
    name: 'TechFrontier Workshop Hall',
    nameAr: 'قاعة ورش تك فرونتير',
    city: 'Dammam',
    category: 'hall',
    type: 'workshop-hall',
    dailyRate: 1100,
    monthlyRate: 16000,
    yearlyRate: 160000,
    totalCapacity: 50,
    latitude: 26.4200,
    longitude: 50.0900,
    images: [
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['Digital Whiteboards', 'Modular Desks', 'Fiber WiFi', 'Dual Projectors']
  },
  {
    name: 'Oasis Corporate Event Hall',
    nameAr: 'قاعة فعاليات الواحة للشركات',
    city: 'Riyadh',
    category: 'hall',
    type: 'event-hall',
    dailyRate: 2500,
    monthlyRate: 35000,
    yearlyRate: 350000,
    totalCapacity: 150,
    latitude: 24.7150,
    longitude: 46.6780,
    images: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['Large Stage', 'LED Wall', 'VIP Reception Area', 'Valet Parking']
  },
  {
    name: 'Al Khobar Lecture & Seminar Hall',
    nameAr: 'قاعة محاضرات وندوات الخبر',
    city: 'Al Khobar',
    category: 'hall',
    type: 'lecture-hall',
    dailyRate: 1300,
    monthlyRate: 19000,
    yearlyRate: 190000,
    totalCapacity: 80,
    latitude: 26.2750,
    longitude: 50.2100,
    images: [
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['Tiered Lecture Seating', 'Dual Projectors', 'Recording Studio', 'Microphone System']
  },
  {
    name: 'Dhahran Techno-Valley Theater',
    nameAr: 'مسرح وادي الظهران التقني',
    city: 'Dammam',
    category: 'theater',
    type: 'conference-theater',
    dailyRate: 4500,
    monthlyRate: 70000,
    yearlyRate: 700000,
    totalCapacity: 200,
    latitude: 26.3050,
    longitude: 50.1450,
    images: [
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['Auditorium Seating', 'Live Streaming Deck', 'Simultaneous Translation', 'Stage Lighting']
  },
  {
    name: 'Makkah Grand Cultural Theater',
    nameAr: 'مسرح مكة الثقافي الكبير',
    city: 'Mecca',
    category: 'theater',
    type: 'theater',
    dailyRate: 6000,
    monthlyRate: 90000,
    yearlyRate: 900000,
    totalCapacity: 300,
    latitude: 21.4225,
    longitude: 39.8262,
    images: [
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['Grand Stage', 'Full Orchestra Pit', 'Acoustic Wall Paneling', 'VIP Lounges']
  },
  {
    name: 'The Hive Shared Studio',
    nameAr: 'ذا هايف ستوديو مشترك',
    city: 'Riyadh',
    category: 'office',
    type: 'shared-desk',
    dailyRate: 90,
    monthlyRate: 1100,
    yearlyRate: 11000,
    totalCapacity: 25,
    latitude: 24.6900,
    longitude: 46.6800,
    images: [
      'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['High-Speed WiFi', 'Coffee', 'Locker Access', 'Quiet Zone']
  },
  {
    name: 'Madinah Tech Hub',
    nameAr: 'مركز المدينة التقني',
    city: 'Madinah',
    category: 'office',
    type: 'mixed',
    dailyRate: 110,
    monthlyRate: 1400,
    yearlyRate: 13200,
    totalCapacity: 40,
    latitude: 24.4672,
    longitude: 39.6111,
    images: [
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['Fiber WiFi', 'Coffee', '3D Printer', 'Hackspace', 'Server Room', 'Prayer Room']
  },
  {
    name: 'Creative Colony',
    nameAr: 'كرييتف كولوني',
    city: 'Jeddah',
    category: 'office',
    type: 'hot-desk',
    dailyRate: 140,
    monthlyRate: 1700,
    yearlyRate: 16800,
    totalCapacity: 20,
    latitude: 21.5433,
    longitude: 39.1728,
    images: [
      'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=1200&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['WiFi', 'Artisan Coffee', 'Photo Studio', 'Podcast Room', 'Event Space', 'Art Gallery']
  },
  {
    name: 'Gateway Business Center',
    nameAr: 'مركز جيت واي للأعمال',
    city: 'Riyadh',
    category: 'office',
    type: 'private-office',
    dailyRate: 200,
    monthlyRate: 2500,
    yearlyRate: 25000,
    totalCapacity: 20,
    latitude: 24.6800,
    longitude: 46.6230,
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['Gigabit WiFi', 'Gourmet Coffee', 'Secretarial Services', 'Mail Handling', 'Valet Parking', 'Executive Lounge', 'Boardroom']
  },
  {
    name: 'Red Sea Cultural Performance Theater',
    nameAr: 'مسرح البحر الأحمر للفنون الأدائية',
    city: 'Jeddah',
    category: 'theater',
    type: 'performance-theater',
    dailyRate: 2600,
    monthlyRate: 38000,
    yearlyRate: 380000,
    totalCapacity: 150,
    latitude: 21.5510,
    longitude: 39.1550,
    images: [
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['Cinema Screen', 'Stage Setup', 'Wireless Audio System', 'Red Carpet Foyer', 'WiFi', 'Parking', 'Refreshment Lounge']
  },
  {
    name: 'Al Faisaliah Executive Meeting Hall',
    nameAr: 'قاعة اجتماعات الفيصلية التنفيذية',
    city: 'Riyadh',
    category: 'hall',
    type: 'meeting-hall',
    dailyRate: 1000,
    monthlyRate: 15000,
    yearlyRate: 150000,
    totalCapacity: 45,
    latitude: 24.6900,
    longitude: 46.6845,
    images: [
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['4K Smart Display', 'Video Conferencing', 'High-Speed WiFi', 'Executive Seating', 'Coffee & Refreshments', 'Parking', 'Whiteboard']
  },
  {
    name: 'Silicon Oasis Tech Workshop Hall',
    nameAr: 'قاعة ورش واحة السيليكون التقنية',
    city: 'Al Khobar',
    category: 'hall',
    type: 'workshop-hall',
    dailyRate: 1100,
    monthlyRate: 16000,
    yearlyRate: 160000,
    totalCapacity: 55,
    latitude: 26.3050,
    longitude: 50.1450,
    images: [
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['Digital Whiteboards', 'Modular Desks', 'Fiber WiFi', 'Dual Projectors', 'Power at Every Seat', 'Coffee Lounge', 'Breakout Booths']
  },
  {
    name: 'Dammam Tech Summit Conference Theater',
    nameAr: 'مسرح مؤتمر قمة الدمام التقنية',
    city: 'Dammam',
    category: 'theater',
    type: 'conference-theater',
    dailyRate: 3200,
    monthlyRate: 45000,
    yearlyRate: 450000,
    totalCapacity: 300,
    latitude: 26.4560,
    longitude: 50.1280,
    images: [
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['4K Laser Projection', 'Line-Array Surround Audio', 'Live Stream Broadcast Suite', 'Stage Lighting', 'Translation Booths', 'VIP Backstage Suites', 'High-Speed WiFi']
  },
  {
    name: 'Makkah Cultural Arts Performance Theater',
    nameAr: 'مسرح مكة للفنون الثقافية',
    city: 'Mecca',
    category: 'theater',
    type: 'performance-theater',
    dailyRate: 2700,
    monthlyRate: 39000,
    yearlyRate: 390000,
    totalCapacity: 200,
    latitude: 21.3891,
    longitude: 39.8150,
    images: [
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['Acoustic Shell', 'Theatrical Stage Lighting', 'Cinema Screen', 'Wireless Microphones', 'Prayer Room', 'VIP Foyer', 'Dedicated Parking']
  },
  {
    name: 'The Hive Dedicated & Shared Desks',
    nameAr: 'ذا هايف مكاتب مخصصة ومشتركة',
    city: 'Riyadh',
    category: 'office',
    type: 'shared-desk',
    dailyRate: 130,
    monthlyRate: 1600,
    yearlyRate: 16000,
    totalCapacity: 40,
    latitude: 24.6900,
    longitude: 46.6845,
    images: [
      'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=1200&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&auto=format'
    ],
    amenities: ['High-Speed WiFi', 'Dedicated Lockers', 'Specialty Coffee', 'Phone Booths', 'Meeting Rooms', '24/7 Access', 'Printer']
  }
];

export async function seedStandardWorkspaces() {
  await ensureDatabaseSchema();
  // 1. Ensure Partner exists
  let partner = await prisma.partner.findFirst();
  if (!partner) {
    partner = await prisma.partner.create({
      data: {
        brandName: 'Coworking Partner Network',
        contactEmail: 'partner@coworkingpass.sa',
        taxNumber: '310000000000003',
        revenueSharePercentage: 15,
      },
    });
  }

  // 2. Iterate through each standard space and ensure it exists
  for (const s of ALL_STANDARD_SPACES) {
    let ws = await prisma.workspace.findFirst({
      where: { name: { equals: s.name, mode: 'insensitive' } },
      include: { sections: true },
    });

    if (!ws) {
      ws = await prisma.workspace.create({
        data: {
          partnerId: partner.id,
          name: s.name,
          nameAr: s.nameAr ?? null,
          ...standardDescriptions(s),
          city: s.city,
          locationMapUrl: `https://maps.google.com/?q=${s.latitude},${s.longitude}`,
          dailyRate: s.dailyRate,
          monthlyRate: s.monthlyRate,
          yearlyRate: s.yearlyRate,
          passVisitValue: 1,
          totalCapacity: s.totalCapacity,
          latitude: s.latitude,
          longitude: s.longitude,
          images: s.images,
        },
        include: { sections: true },
      });
    }

    // Backfill the Arabic name on existing rows without overriding provider edits
    const backfill: Record<string, string> = {};
    if (s.nameAr && !(ws as any).nameAr) backfill.nameAr = s.nameAr;
    const desc = standardDescriptions(s);
    if (!(ws as any).description) backfill.description = desc.description;
    if (!(ws as any).descriptionAr) backfill.descriptionAr = desc.descriptionAr;
    if (Object.keys(backfill).length > 0) {
      await prisma.workspace.update({ where: { id: ws.id }, data: backfill });
    }

    // 3. Ensure Sections exist based on space category
    if (s.category === 'theater') {
      let theaterSec = ws.sections.find((sec: any) => sec.type === 'THEATER');
      if (!theaterSec) {
        theaterSec = await prisma.workspaceSection.create({
          data: {
            workspaceId: ws.id,
            type: 'THEATER',
            name: `${s.name} - Auditorium`,
            capacity: s.totalCapacity,
            dailyRate: s.dailyRate,
            monthlyRate: s.monthlyRate,
            yearlyRate: s.yearlyRate,
          },
        });
      }

      const existingPkg = await prisma.hourlyPackage.findFirst({ where: { sectionId: theaterSec.id } });
      if (!existingPkg) {
        await prisma.hourlyPackage.createMany({
          data: [
            { sectionId: theaterSec.id, packageName: '1 Hour Theater Pass', hoursAmount: 1, periodType: 'PER_DAY', price: Math.round(s.dailyRate / 6) },
            { sectionId: theaterSec.id, packageName: '2 Hours Theater Pass', hoursAmount: 2, periodType: 'PER_DAY', price: Math.round(s.dailyRate * 0.4) },
            { sectionId: theaterSec.id, packageName: '4 Hours Theater Package', hoursAmount: 4, periodType: 'PER_DAY', price: Math.round(s.dailyRate * 0.7) },
          ],
        });
      }
    } else if (s.category === 'hall') {
      let hallSec = ws.sections.find((sec: any) => sec.type === 'MEETING_ROOM');
      if (!hallSec) {
        hallSec = await prisma.workspaceSection.create({
          data: {
            workspaceId: ws.id,
            type: 'MEETING_ROOM',
            name: `${s.name} - Hall`,
            capacity: s.totalCapacity,
            dailyRate: s.dailyRate,
            monthlyRate: s.monthlyRate,
            yearlyRate: s.yearlyRate,
          },
        });
      }

      const existingPkg = await prisma.hourlyPackage.findFirst({ where: { sectionId: hallSec.id } });
      if (!existingPkg) {
        await prisma.hourlyPackage.createMany({
          data: [
            { sectionId: hallSec.id, packageName: '1 Hour Hall Booking', hoursAmount: 1, periodType: 'PER_DAY', price: Math.round(s.dailyRate / 6) },
            { sectionId: hallSec.id, packageName: '2 Hours Per Day', hoursAmount: 2, periodType: 'PER_DAY', price: Math.round(s.dailyRate / 3.5) },
            { sectionId: hallSec.id, packageName: '8 Hours Per Month', hoursAmount: 8, periodType: 'PER_MONTH', price: Math.round(s.dailyRate * 1.1) },
          ],
        });
      }
    } else {
      // Office / Desk
      let deskSec = ws.sections.find((sec: any) => sec.type === 'DESK');
      if (!deskSec) {
        deskSec = await prisma.workspaceSection.create({
          data: {
            workspaceId: ws.id,
            type: 'DESK',
            name: `${s.name} - Open Desks Area`,
            capacity: s.totalCapacity,
            dailyRate: s.dailyRate,
            monthlyRate: s.monthlyRate,
            yearlyRate: s.yearlyRate,
          },
        });
      }

      if (s.type === 'mixed') {
        let mrSec = ws.sections.find((sec: any) => sec.type === 'MEETING_ROOM');
        if (!mrSec) {
          mrSec = await prisma.workspaceSection.create({
            data: {
              workspaceId: ws.id,
              type: 'MEETING_ROOM',
              name: `${s.name} - Meeting Room`,
              capacity: 10,
              dailyRate: 300,
            },
          });

          await prisma.hourlyPackage.createMany({
            data: [
              { sectionId: mrSec.id, packageName: '2 Hours Per Day', hoursAmount: 2, periodType: 'PER_DAY', price: 100 },
              { sectionId: mrSec.id, packageName: '8 Hours Per Month', hoursAmount: 8, periodType: 'PER_MONTH', price: 350 },
            ],
          });
        }
      }
    }

    // 4. Sync Amenities
    for (const amName of s.amenities) {
      let catalogItem = await prisma.amenityCatalog.findFirst({
        where: { name: { equals: amName, mode: 'insensitive' } },
      });
      if (!catalogItem) {
        catalogItem = await prisma.amenityCatalog.create({
          data: {
            name: amName,
            isDefault: true,
            status: 'APPROVED',
          },
        });
      }

      const linkExists = await prisma.workspaceAmenity.findFirst({
        where: { workspaceId: ws.id, amenityId: catalogItem.id },
      });
      if (!linkExists) {
        await prisma.workspaceAmenity.create({
          data: {
            workspaceId: ws.id,
            amenityId: catalogItem.id,
          },
        });
      }
    }
  }

  // 5. Ensure Default Loyalty Rules exist
  await seedLoyaltyRules();

  return await prisma.workspace.findMany({
    include: { partner: true, sections: { include: { hourlyPackages: true } }, amenities: { include: { amenity: true } } },
  });
}

export async function seedLoyaltyRules() {
  await ensureDatabaseSchema();
  // 1. Find or create an admin user for proposedBy / approvedBy
  let admin = await prisma.user.findFirst({
    where: { email: 'admin@coworkingpass.sa' },
  });

  if (!admin) {
    admin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });
  }

  if (!admin) {
    const passwordHash = await bcrypt.hash('password', 10);
    admin = await prisma.user.create({
      data: {
        name: 'Platform Super Admin',
        email: 'admin@coworkingpass.sa',
        passwordHash,
        role: 'SUPER_ADMIN',
        emailVerified: true,
      },
    });
  }

  // 2. Rule 1: كسب 10 نقاط لكل 100 ريال تُدفع
  const existingEarning = await prisma.loyaltyRule.findFirst({
    where: { ruleType: 'EARNING' },
  });

  if (!existingEarning) {
    await prisma.loyaltyRule.create({
      data: {
        ruleName: 'قاعدة الكسب الافتراضية (10 نقاط لكل 100 ريال)',
        ruleType: 'EARNING',
        pointsValue: 10,
        monetaryValue: 100,
        description: 'كسب 10 نقاط ولاء لكل 100 ريال يتم إنفاقها على الحجوزات',
        status: 'APPROVED',
        isActive: true,
        proposedBy: admin.id,
        approvedBy: admin.id,
      },
    });
  }

  // 3. Rule 2: استبدال 100 نقطة بخصم 25 ريال
  const existingRedemption = await prisma.loyaltyRule.findFirst({
    where: { ruleType: 'REDEMPTION' },
  });

  if (!existingRedemption) {
    await prisma.loyaltyRule.create({
      data: {
        ruleName: 'قاعدة الاستبدال الافتراضية (100 نقطة = 25 ريال)',
        ruleType: 'REDEMPTION',
        pointsValue: 100,
        monetaryValue: 25,
        description: 'استبدال كل 100 نقطة ولاء بخصم قدره 25 ريال عند الدفع',
        status: 'APPROVED',
        isActive: true,
        proposedBy: admin.id,
        approvedBy: admin.id,
      },
    });
  }

  return await prisma.loyaltyRule.findMany({
    include: {
      proposer: { select: { name: true, email: true } },
      approver: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deduplicateWorkspaces() {
  try {
    const allWorkspaces = await prisma.workspace.findMany({
      include: {
        sections: { include: { hourlyPackages: true } },
      },
    });

    const groupedByName = new Map<string, typeof allWorkspaces>();
    for (const w of allWorkspaces) {
      const key = w.name.trim().toLowerCase();
      if (!groupedByName.has(key)) {
        groupedByName.set(key, []);
      }
      groupedByName.get(key)!.push(w);
    }

    for (const [, workspacesList] of groupedByName.entries()) {
      if (workspacesList.length <= 1) continue;

      // احتفظ بالمساحة التي تحتوي على أكبر عدد من الأقسام
      workspacesList.sort((a: any, b: any) => b.sections.length - a.sections.length);
      const primaryWs = workspacesList[0];
      const duplicates = workspacesList.slice(1);

      const primarySection = primaryWs.sections[0];
      let primaryPkg: any = primarySection?.hourlyPackages?.[0];
      if (!primaryPkg && primarySection) {
        primaryPkg = await prisma.hourlyPackage.findFirst({ where: { sectionId: primarySection.id } });
      }

      for (const dup of duplicates) {
        try {
          if (primarySection) {
            await prisma.directBooking.updateMany({
              where: { workspaceId: dup.id },
              data: { workspaceId: primaryWs.id, sectionId: primarySection.id },
            });

            await prisma.qrCheckIn.updateMany({
              where: { workspaceId: dup.id },
              data: { workspaceId: primaryWs.id, sectionId: primarySection.id },
            });
          }

          for (const sec of dup.sections) {
            try {
              const secPackages = await prisma.hourlyPackage.findMany({ where: { sectionId: sec.id } });
              const secPkgIds = secPackages.map((p: any) => p.id);

              if (primarySection) {
                const updateData: any = { sectionId: primarySection.id };
                if (primaryPkg) updateData.packageId = primaryPkg.id;

                await prisma.hourlyBooking.updateMany({
                  where: {
                    OR: [
                      { sectionId: sec.id },
                      ...(secPkgIds.length > 0 ? [{ packageId: { in: secPkgIds } }] : []),
                    ],
                  },
                  data: updateData,
                });

                await prisma.directBooking.updateMany({
                  where: { sectionId: sec.id },
                  data: { sectionId: primarySection.id, workspaceId: primaryWs.id },
                });

                await prisma.qrCheckIn.updateMany({
                  where: { sectionId: sec.id },
                  data: { sectionId: primarySection.id, workspaceId: primaryWs.id },
                });
              } else {
                await prisma.hourlyBooking.deleteMany({
                  where: {
                    OR: [
                      { sectionId: sec.id },
                      ...(secPkgIds.length > 0 ? [{ packageId: { in: secPkgIds } }] : []),
                    ],
                  },
                });
                await prisma.directBooking.deleteMany({ where: { sectionId: sec.id } });
                await prisma.qrCheckIn.deleteMany({ where: { sectionId: sec.id } });
              }

              await prisma.hourlyPackage.deleteMany({
                where: { sectionId: sec.id },
              });

              await prisma.workspaceSection.delete({
                where: { id: sec.id },
              });
            } catch (secErr) {
              console.warn(`[deduplicate] error cleaning section ${sec.id}:`, secErr);
            }
          }

          await prisma.workspaceAmenity.deleteMany({
            where: { workspaceId: dup.id },
          });

          await prisma.workspace.delete({
            where: { id: dup.id },
          });
        } catch (dupErr) {
          console.warn(`[deduplicate] error cleaning duplicate workspace ${dup.id}:`, dupErr);
        }
      }
    }
  } catch (err) {
    console.warn('[deduplicateWorkspaces] error:', err);
  }
}
