import { registerMessages } from './messages-registry';

/**
 * Arabic versions of the server messages added with company spending, team bookings, rescheduling and
 * the support-ticket conversation. Patterns use $1, $2 ... for the captured values.
 */
registerMessages(
  {
    // ---- Rescheduling
    'Booking not found.': 'الحجز غير موجود.',
    'You are not allowed to reschedule this booking.': 'غير مسموح لك بإعادة جدولة هذا الحجز.',
    'Only a session that has not started yet can be rescheduled.': 'يمكن إعادة جدولة الجلسة التي لم تبدأ بعد فقط.',
    'Only a confirmed booking that has not started yet can be rescheduled.': 'يمكن إعادة جدولة الحجز المؤكد الذي لم يبدأ بعد فقط.',
    'This booking was already rescheduled once. You can cancel it (inside the cancellation window) and book again.':
      'سبق أن أُعيدت جدولة هذا الحجز مرة واحدة. يمكنك إلغاؤه (ضمن مهلة الإلغاء) ثم الحجز من جديد.',
    'startDate and startTime are required.': 'تاريخ البدء ووقت البدء مطلوبان.',
    'bookingDate is required.': 'تاريخ الحجز مطلوب.',
    'The new date or time is not valid.': 'التاريخ أو الوقت الجديد غير صالح.',
    'The new date is not valid.': 'التاريخ الجديد غير صالح.',
    'This is the same session. Choose a different time or room.': 'هذه هي الجلسة نفسها. اختر وقتًا أو قاعة مختلفة.',
    'This is the same date. Choose a different date or room.': 'هذا هو التاريخ نفسه. اختر تاريخًا أو قاعة مختلفة.',
    'The room must belong to the same venue and be the same type of room.': 'يجب أن تكون القاعة في المكان نفسه ومن النوع نفسه.',
    'This booking was just changed. Please reload and try again.': 'تم تغيير هذا الحجز للتو. يرجى إعادة تحميل الصفحة والمحاولة مجددًا.',
    'The company wallet does not have enough balance for the price difference.': 'رصيد محفظة الشركة لا يكفي لفرق السعر.',
    'Your wallet does not have enough balance for the price difference. Top it up and try again.': 'رصيد محفظتك لا يكفي لفرق السعر. اشحنها وحاول مجددًا.',
    'The price difference is more than your remaining monthly company allowance.': 'فرق السعر أكبر من المتبقي من مخصصك الشهري من الشركة.',
    'Failed to reschedule the booking.': 'تعذّرت إعادة جدولة الحجز.',
    'The booking could not be rescheduled': 'تعذّرت إعادة جدولة الحجز',
    'To change the date or room of a booking, use the reschedule action.': 'لتغيير تاريخ الحجز أو قاعته، استخدم إجراء إعادة الجدولة.',
    'Only cancelling is allowed here.': 'الإلغاء فقط مسموح هنا.',
    'This booking is already closed.': 'هذا الحجز مغلق بالفعل.',
    'status must be ACTIVE, EXPIRED or CANCELLED.': 'يجب أن تكون الحالة نشطة أو منتهية أو ملغاة.',
    // ---- Company wallet for team members
    'Only members of this company can pay from the company wallet.': 'يمكن لأعضاء هذه الشركة فقط الدفع من محفظة الشركة.',
    'Only members of this company can use the company wallet.': 'يمكن لأعضاء هذه الشركة فقط استخدام محفظة الشركة.',
    'Your company has not allowed team members to pay from the company wallet.': 'لم تسمح شركتك لأعضاء الفريق بالدفع من محفظة الشركة.',
    'This is more than your remaining monthly company allowance.': 'هذا المبلغ أكبر من المتبقي من مخصصك الشهري من الشركة.',
    'Failed to pay from the company wallet.': 'تعذّر الدفع من محفظة الشركة.',
    'Failed to pay from the company wallet': 'تعذّر الدفع من محفظة الشركة',
    'Set a monthly limit per team member before allowing them to pay from the company wallet.':
      'حدّد سقفًا شهريًا لكل عضو في الفريق قبل السماح لهم بالدفع من محفظة الشركة.',
    'Payment taken from the company wallet.': 'تم الدفع من محفظة الشركة.',
    'Returned to the company wallet.': 'أُعيد المبلغ إلى محفظة الشركة.',
    'No company-wallet payment with this reference was found.': 'لم يُعثر على دفعة من محفظة الشركة بهذا المرجع.',
    'Failed to return the payment to the company wallet.': 'تعذّرت إعادة المبلغ إلى محفظة الشركة.',
    // ---- Support conversation
    'You can only close your own open ticket.': 'يمكنك إغلاق تذكرتك المفتوحة فقط.',
    'Your message could not be sent.': 'تعذّر إرسال رسالتك.',
    'Please write a message first.': 'يرجى كتابة رسالة أولًا.',
    'The ticket could not be closed.': 'تعذّر إغلاق التذكرة.',
    // ---- Notification titles
    'Booked for you by your company': 'حجزته لك شركتك',
    'Booking Rescheduled': 'تمت إعادة جدولة الحجز',
    'New reply on a support ticket': 'رد جديد على تذكرة دعم',
    'Support replied to your ticket': 'ردّ الدعم على تذكرتك',
  },
  [
    // ---- Rescheduling
    [/^Rescheduling is not allowed\. Must reschedule at least (\d+) hours before the session starts\.$/, 'لا يمكن إعادة الجدولة. يجب إعادة الجدولة قبل $1 ساعة على الأقل من بدء الجلسة.'],
    [/^Rescheduling is not allowed\. Must reschedule at least (\d+) hours before the booking starts\.$/, 'لا يمكن إعادة الجدولة. يجب إعادة الجدولة قبل $1 ساعة على الأقل من بدء الحجز.'],
    [/^The new session must start at least (\d+) hours from now\.$/, 'يجب أن تبدأ الجلسة الجديدة بعد $1 ساعة على الأقل من الآن.'],
    [/^The new date must start at least (\d+) hours from now\.$/, 'يجب أن يكون التاريخ الجديد بعد $1 ساعة على الأقل من الآن.'],
    [/^The new session can be at most (\d+) days after the original date\.$/, 'يمكن أن تكون الجلسة الجديدة بعد التاريخ الأصلي بـ $1 يومًا كحد أقصى.'],
    [/^The new date can be at most (\d+) days after the original date\.$/, 'يمكن أن يكون التاريخ الجديد بعد التاريخ الأصلي بـ $1 يومًا كحد أقصى.'],
    [/^(.+) is already booked for the selected time\. Please choose another session or room\.$/, '$1 محجوزة بالفعل في الوقت المحدد. يرجى اختيار جلسة أو قاعة أخرى.'],
    [/^Not enough availability\. Only (\d+) seat\(s\) left for the selected time\.$/, 'لا توجد أماكن كافية. المتبقي $1 مقعد فقط في الوقت المحدد.'],
    [/^Not enough availability\. Only (\d+) seat\(s\) left for the selected period\.$/, 'لا توجد أماكن كافية. المتبقي $1 مقعد فقط في الفترة المحددة.'],
    [/^(.+) has only (\d+) seat\(s\) left for the selected period\.$/, 'لم يتبقَّ في $1 سوى $2 مقعد في الفترة المحددة.'],
    // ---- Notification messages
    [/^Your company booked (.+?)(?: \((.+?)\))? for you: (.+)\. You can see it under your bookings\.$/, 'حجزت لك شركتك $1: $3. يمكنك رؤيته ضمن حجوزاتك.'],
    [/^Your booking at (.+?)(?: \((.+?)\))? moved from (.+) to (.+)\.$/, 'تم نقل حجزك في $1 من $3 إلى $4.'],
    [/^A booking at (.+?)(?: \((.+?)\))? moved from (.+) to (.+)\.$/, 'تم نقل أحد الحجوزات في $1 من $3 إلى $4.'],
    [/^A company booking at (.+?)(?: \((.+?)\))? moved from (.+) to (.+)\.$/, 'تم نقل أحد حجوزات الشركة في $1 من $3 إلى $4.'],
    // ---- Wallet history descriptions
    [/^Price difference: (.+)$/, 'فرق السعر: $1'],
    [/^Price difference refunded: (.+)$/, 'استرداد فرق السعر: $1'],
    [/^Team member booking payment for (.+)$/, 'دفع عضو الفريق لحجز في $1'],
  ]
);
