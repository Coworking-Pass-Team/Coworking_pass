import { prisma } from '../lib/prisma'

async function testCron() {
  console.log('🧪 اختبار Cron Job يدوياً...')

  // 1. جلب الحجوزات المنتهية
  const expiredBookings = await prisma.directBooking.findMany({
    where: {
      status: 'CONFIRMED',
      bookingDate: { lt: new Date() }
    }
  })

  console.log(`📋 عدد الحجوزات المنتهية: ${expiredBookings.length}`)

  for (const booking of expiredBookings) {
    console.log(`⏳ معالجة الحجز: ${booking.id}`)

    // 2. جلب أول شخص في قائمة الانتظار
    const nextInWaitlist = await prisma.directBooking.findFirst({
      where: {
        workspaceId: booking.workspaceId,
        sectionId: booking.sectionId,
        status: 'WAITLISTED'
      },
      orderBy: { createdAt: 'asc' }
    })

    if (nextInWaitlist) {
      // 3. ترقية المستخدم
      const promoted = await prisma.directBooking.update({
        where: { id: nextInWaitlist.id },
        data: {
          status: 'CONFIRMED',
          bookingDate: new Date()
        }
      })

      console.log(`✅ تم ترقية المستخدم ${promoted.userId}`)
    } else {
      console.log(`ℹ️ لا يوجد منتظرين لهذه المساحة`)
    }
  }

  console.log('✅ انتهى الاختبار')
}

testCron()
  .catch(console.error)
  .finally(() => prisma.$disconnect())