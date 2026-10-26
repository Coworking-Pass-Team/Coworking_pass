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
    'Failed to reschedule the booking.': 'تعذّرت إعادة جدولة الحجز.',
    'The booking could not be rescheduled': 'تعذّرت إعادة جدولة الحجز',
    'To change the date or room of a booking, use the reschedule action.': 'لتغيير تاريخ الحجز أو قاعته، استخدم إجراء إعادة الجدولة.',
    'Only cancelling is allowed here.': 'الإلغاء فقط مسموح هنا.',
    'This booking is already closed.': 'هذا الحجز مغلق بالفعل.',
    'status must be ACTIVE, EXPIRED or CANCELLED.': 'يجب أن تكون الحالة نشطة أو منتهية أو ملغاة.',
    // ---- Company wallet for team members
    // ---- Allocating company funds to team members
    'Enter an amount greater than zero.': 'أدخل مبلغًا أكبر من صفر.',
    'There are no team members to allocate funds to.': 'لا يوجد أعضاء في الفريق لتوزيع الأموال عليهم.',
    'The amount is too small to share between all members.': 'المبلغ صغير جدًا بحيث لا يمكن تقسيمه بين جميع الأعضاء.',
    'Choose at least one team member.': 'اختر عضوًا واحدًا على الأقل من الفريق.',
    'Every amount must be greater than zero.': 'يجب أن يكون كل مبلغ أكبر من صفر.',
    'You can only allocate funds to active members of your own team.': 'يمكنك توزيع الأموال على الأعضاء النشطين في فريقك فقط.',
    'A member can only appear once in an allocation.': 'لا يمكن أن يظهر العضو أكثر من مرة في توزيع واحد.',
    'mode must be EQUAL or SPECIFIC.': 'يجب أن يكون النمط تقسيمًا بالتساوي أو مبالغ محددة.',
    'A valid requestId is required.': 'معرّف الطلب مطلوب وصالح.',
    "Only the company's HR admin can allocate funds to team members.": 'يستطيع مسؤول الموارد البشرية في الشركة فقط توزيع الأموال على أعضاء الفريق.',
    'Failed to allocate funds.': 'تعذّر توزيع الأموال.',
    'Failed to load allocations.': 'تعذّر تحميل عمليات التوزيع.',
    'Funds added to your wallet': 'أُضيف رصيد إلى محفظتك',
    // ---- One-time codes and password reset
    'Too many incorrect attempts. Please request a new code.': 'محاولات خاطئة كثيرة. يرجى طلب رمز جديد.',
    'Incorrect verification code.': 'رمز التحقق غير صحيح.',
    'Invalid or expired verification code.': 'رمز التحقق غير صالح أو منتهي الصلاحية.',
    'If an account exists for this email, a reset code has been sent to it.': 'إذا كان هناك حساب بهذا البريد، فقد أُرسل إليه رمز إعادة التعيين.',
    'A valid email address is required.': 'يلزم إدخال بريد إلكتروني صالح.',
    'Password must be at least 8 characters long.': 'يجب ألا تقل كلمة المرور عن 8 أحرف.',
    'Password is too long.': 'كلمة المرور طويلة جدًا.',
    'Password updated. Please sign in with your new password.': 'تم تحديث كلمة المرور. يرجى تسجيل الدخول بكلمة المرور الجديدة.',
    'Code accepted.': 'تم قبول الرمز.',
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
    [/^At most (\d+) members can be paid in one go\.$/, 'يمكن الدفع لـ $1 من الأعضاء كحد أقصى في المرة الواحدة.'],
    [/^(.+) added SAR (.+) to your wallet\.$/, 'أضافت $1 مبلغ $2 ر.س إلى محفظتك.'],
    [/^Allocated by (.+)$/, 'مخصَّص من $1'],
    [/^Allocated to (.+)$/, 'مخصَّص لـ $1'],
    // ---- Wallet history descriptions
    [/^Price difference: (.+)$/, 'فرق السعر: $1'],
    [/^Price difference refunded: (.+)$/, 'استرداد فرق السعر: $1'],
    [/^Team member booking payment for (.+)$/, 'دفع عضو الفريق لحجز في $1'],
  ]
);
