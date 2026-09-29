import { registerMessages } from './messages-registry';

/**
 * Arabic versions of fixed English system sentences (validation errors, toasts, API errors).
 * Exact-match entries first, then patterns for sentences that embed values ($1, $2 ... = capture groups).
 */

// ---------------------------------------------------------------- Auth & validation
registerMessages({
  'Email address is required.': 'البريد الإلكتروني مطلوب.',
  'Password is required.': 'كلمة المرور مطلوبة.',
  'Full name is required.': 'الاسم الكامل مطلوب.',
  'Enter a valid email address.': 'أدخل بريداً إلكترونياً صالحاً.',
  'Phone number is required.': 'رقم الجوال مطلوب.',
  'Please enter a valid international phone number.': 'يرجى إدخال رقم جوال دولي صالح.',
  'Password must be at least 6 characters.': 'يجب ألا تقل كلمة المرور عن 6 أحرف.',
  'Passwords do not match.': 'كلمتا المرور غير متطابقتين.',
  'You must agree to the Terms of Service and Privacy Policy.': 'يجب الموافقة على شروط الخدمة وسياسة الخصوصية.',
  'Organization name is required.': 'اسم المؤسسة مطلوب.',
  'Partner business name is required.': 'اسم النشاط التجاري للشريك مطلوب.',
  'Commercial Registration (CR) Number is required.': 'رقم السجل التجاري مطلوب.',
  'CR Number must be 10 digits starting with 1010 (e.g., 1010xxxxxx).': 'يجب أن يتكون رقم السجل التجاري من 10 أرقام تبدأ بـ 1010 (مثال: 1010xxxxxx).',
  'Invalid credentials.': 'بيانات الدخول غير صحيحة.',
  'Invalid email or password.': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'Invalid or expired verification code.': 'رمز التحقق غير صحيح أو منتهي الصلاحية.',
  'Invalid verification code.': 'رمز التحقق غير صحيح.',
  'Please verify your email address first.': 'يرجى التحقق من بريدك الإلكتروني أولاً.',
  'User not found.': 'المستخدم غير موجود.',
  'Network error': 'خطأ في الاتصال بالشبكة',
  'Internal server error.': 'حدث خطأ داخلي في الخادم.',
  'Unauthorized access. Please log in first.': 'وصول غير مصرح به. يرجى تسجيل الدخول أولاً.',
  'This account has been suspended. Please contact platform support.': 'تم تعليق هذا الحساب. يرجى التواصل مع دعم المنصة.',
  'This account has been suspended by the platform administration. Please contact platform support.': 'تم تعليق هذا الحساب من قِبل إدارة المنصة. يرجى التواصل مع دعم المنصة.',
  'Your account has been suspended. Please contact platform support.': 'تم تعليق حسابك. يرجى التواصل مع دعم المنصة.',
  'You have been logged out.': 'تم تسجيل خروجك.',
  'Your partner account is currently under review by platform administrators. You will receive an email once approved.': 'حساب الشريك الخاص بك قيد المراجعة من مسؤولي المنصة. ستصلك رسالة بريدية عند الموافقة.',
  'Your partner registration request has been declined. Please contact support.': 'تم رفض طلب تسجيلك كشريك. يرجى التواصل مع الدعم.',
  'your registered contact': 'وسيلة التواصل المسجلة لديك',
  'your account': 'حسابك',
});

// ---------------------------------------------------------------- Price / plan badges (shared price helper)
registerMessages({
  'Included in your Pass Quota': 'مشمول ضمن حصة باقتك',
  'Included in your Plan': 'مشمول في باقتك',
  'Included in Pass': 'مشمول في الباقة',
  'Included in your Pass': 'مشمول في باقتك',
  'Covered by Plan': 'مغطى بالباقة',
}, [
  [/^SAR ([\d.,]+)$/, '$1 ر.س'],
  [/^(\d+)h Free · SAR ([\d.,]+) to Pay$/, '$1 ساعة مجانية · $2 ر.س للدفع'],
  [/^1 Day Included in Pass · SAR ([\d.,]+) to Pay$/, 'يوم واحد مشمول في الباقة · $1 ر.س للدفع'],
  [/^(\d+) Seats? Included in Plan · SAR ([\d.,]+) to Pay$/, '$1 مقعد مشمول في الباقة · $2 ر.س للدفع'],
]);

// ---------------------------------------------------------------- Location
registerMessages({
  'Geolocation is not supported by your browser.': 'تحديد الموقع غير مدعوم في متصفحك.',
  'Location permission denied.': 'تم رفض إذن الموقع.',
  'Location services are unavailable.': 'خدمات الموقع غير متاحة.',
});

// ---------------------------------------------------------------- Membership plan names (stored as English)
registerMessages({
  'Day Pass': 'باقة اليوم',
  'Monthly Pass': 'الباقة الشهرية',
  'Annual Pass': 'الباقة السنوية',
  'Yearly Pass': 'الباقة السنوية',
  'Team Pass': 'باقة الفريق',
  'Business Pass': 'باقة الأعمال',
  'Custom Enterprise': 'باقة المؤسسات المخصصة',
  'Enterprise Pass': 'باقة المؤسسات',
  'All-Access Pass': 'باقة الدخول الشامل',
  'Corporate Plan': 'باقة الشركات',
  'Standard Member': 'عضو عادي',
});

// ---------------------------------------------------------------- Time ranges produced by shared helpers
registerMessages({}, [
  [/^(.+) – (.+) \((\d+) hours?\)$/, '$1 – $2 ($3 ساعة)'],
]);

// Month-over-month growth badges on the admin dashboard
registerMessages({}, [
  [/^(.+)% MoM$/, '$1% شهرياً'],
]);
