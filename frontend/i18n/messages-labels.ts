import { registerMessages } from './messages-registry';

/** Arabic labels for module-level constants (status badges, categories, priorities, rule types...). */
registerMessages({
  // support tickets
  'Complaint': 'شكوى', 'Refund Request': 'طلب استرداد', 'General Inquiry': 'استفسار عام',
  'Open': 'مفتوحة', 'In Progress': 'قيد المعالجة', 'Resolved': 'تم الحل', 'Closed': 'مغلقة',
  'Urgent': 'عاجلة', 'High': 'عالية', 'Medium': 'متوسطة', 'Low': 'منخفضة',
  'All Statuses': 'جميع الحالات', 'All Priorities': 'جميع الأولويات', 'All Categories': 'جميع الفئات',
  'Total Tickets': 'إجمالي التذاكر', 'Active Complaints': 'الشكاوى النشطة', 'Refund Requests': 'طلبات الاسترداد', 'Resolved Tickets': 'التذاكر المحلولة',
  // loyalty proposals
  'All Proposals': 'جميع المقترحات', 'Pending Review': 'قيد المراجعة', 'Approved': 'موافق عليه', 'Rejected': 'مرفوض',
  'Earning Rules (Points Accumulation)': 'قواعد الكسب (تجميع النقاط)', 'Redemption Rules (Discounts)': 'قواعد الاستبدال (الخصومات)',
  'Points Earning': 'كسب النقاط', 'Points Redemption': 'استبدال النقاط', 'Earning Rule': 'قاعدة كسب', 'Redemption Rule': 'قاعدة استبدال',
  'All Rule Types': 'جميع أنواع القواعد', 'Pending Approval': 'بانتظار الموافقة', 'Approved & Active': 'موافق عليه ونشط',
  // generic
  'All': 'الكل', 'Active': 'نشط', 'Inactive': 'غير نشط', 'Pending': 'قيد الانتظار', 'Cancelled': 'ملغى', 'Completed': 'مكتمل',
  'Success': 'ناجحة', 'Failed': 'فاشلة', 'Paid': 'مدفوعة', 'Refunded': 'مُستردة', 'Confirmed': 'مؤكد', 'Expired': 'منتهٍ',
  'N/A': 'غير متاح', 'None': 'لا يوجد',
});
