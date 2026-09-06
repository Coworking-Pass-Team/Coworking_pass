import { prisma } from '@/lib/prisma'
import cron from 'node-cron'

// تشغيل كل ساعة
cron.schedule('0 * * * *', async () => {
  console.log('🔄 [CRON] فحص الحجوزات المنتهية...')

  try {
    // 1. جلب الحجوزات المنتهية (CONFIRMED وانتهت)
    const expiredBookings = await prisma.directBooking.findMany({
      where: {
        status: 'CONFIRMED',
        bookingDate: { lt: new Date() }
      }
    })

    for (const booking of expiredBookings) {
      console.log(`⏳ معالجة الحجز: ${booking.id}`)

      // 2. جلب أول شخص في قائمة الانتظار لهذه المساحة
      const nextInWaitlist = await prisma.directBooking.findFirst({
        where: {
          workspaceId: booking.workspaceId,
          sectionId: booking.sectionId,
          status: 'WAITLISTED'
        },
        orderBy: { createdAt: 'asc' }
      })

      if (nextInWaitlist) {
        // 3. ترقية المستخدم من WAITLISTED إلى CONFIRMED
        const promoted = await prisma.directBooking.update({
          where: { id: nextInWaitlist.id },
          data: {
            status: 'CONFIRMED',
            bookingDate: new Date()
          }
        })

        console.log(`✅ تم ترقية المستخدم ${promoted.userId} من قائمة الانتظار`)
      }
    }

    console.log('✅ [CRON] انتهى فحص الحجوزات المنتهية')
  } catch (error) {
    console.error('❌ [CRON] خطأ:', error)
  }
})

console.log('⏰ Cron Job للحجز التلقائي شغال')