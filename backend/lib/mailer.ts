import { Resend } from "resend";

/** The Resend test sender; it only delivers to the address that owns the Resend account. */
const DEFAULT_FROM = "Coworking Pass <onboarding@resend.dev>";

/** Sender shown on every email: set RESEND_FROM_EMAIL once a domain is verified in Resend. */
export function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;
}

/** True once a real Resend key is configured (the build-time placeholder does not count). */
export function isEmailConfigured(): boolean {
  const key = process.env.RESEND_API_KEY?.trim();
  return !!key && /^re_/.test(key) && !/placeholder/i.test(key);
}

/** Public address of the site, used for links inside emails. */
function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || "https://coworking-pass-sa.vercel.app").replace(/\/+$/, "");
}

/** Emails are written in the recipient's saved language (`User.locale`); Arabic is the site's default. */
export type EmailLocale = "ar" | "en";

/** The language a request asked for ("ar" or "en"), or null when it sent none or something else. */
export function parseLocale(raw: unknown): EmailLocale | null {
  return raw === "ar" || raw === "en" ? raw : null;
}

export const toEmailLocale = (raw: unknown): EmailLocale => parseLocale(raw) ?? "ar";

let client: Resend | null = null;

/**
 * Sends one email. Returns true only when Resend accepted it. Without a key nothing is sent and the call is
 * logged, so local runs never fail because of email; a Resend error is logged and reported as false.
 */
async function send(to: string, subject: string, html: string): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.log(`[Email] Resend is not configured, so "${subject}" to ${to} was not sent.`);
    return false;
  }
  try {
    client ??= new Resend(process.env.RESEND_API_KEY);
    const { error } = await client.emails.send({ from: getFromAddress(), to, subject, html });
    if (error) {
      console.error(`[Email] Resend refused "${subject}" to ${to}:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Email] Sending "${subject}" to ${to} failed:`, err);
    return false;
  }
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Outer frame with the text direction, language and a font that renders Arabic well in mail clients. */
function frame(locale: EmailLocale, maxWidth: number, inner: string): string {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const font = locale === "ar" ? "Tahoma, 'Segoe UI', Arial, sans-serif" : "'Segoe UI', Arial, sans-serif";
  return `<div dir="${dir}" lang="${locale}" style="font-family: ${font}; text-align: ${dir === "rtl" ? "right" : "left"}; max-width: ${maxWidth}px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 14px; background-color: #ffffff; color: #1f2937;">${inner}</div>`;
}

const CODE_COPY = {
  ar: {
    otpSubject: "رمز التحقق - كوورك باس",
    otpHeading: "رمز التحقق الخاص بك",
    otpIntro: "استخدم الرمز التالي لمرة واحدة لإكمال التحقق في كوورك باس:",
    resetSubject: "إعادة تعيين كلمة المرور - كوورك باس",
    resetHeading: "إعادة تعيين كلمة المرور",
    resetIntro: "تلقّينا طلبًا لإعادة تعيين كلمة مرور حسابك في كوورك باس. أدخل هذا الرمز لاختيار كلمة مرور جديدة. إذا لم تطلب ذلك فتجاهل هذه الرسالة وستبقى كلمة مرورك كما هي:",
    validity: "هذا الرمز صالح لمدة 10 دقائق. لا تشارك هذا الرمز مع أي شخص.",
  },
  en: {
    otpSubject: "Verification Code - Coworking Pass",
    otpHeading: "Your Verification Code",
    otpIntro: "Use the following one-time code to complete verification in Coworking Pass:",
    resetSubject: "Reset your password - Coworking Pass",
    resetHeading: "Reset Your Password",
    resetIntro: "We received a request to reset your Coworking Pass password. Enter this code to choose a new one. If you did not ask for this, you can ignore this email and your password stays the same:",
    validity: "This code is valid for 10 minutes. Do not share this code with anyone.",
  },
} as const;

function codeEmail(locale: EmailLocale, heading: string, intro: string, code: string): string {
  return frame(
    locale,
    500,
    `<h2 style="color: #1b4332; margin: 0 0 8px 0;">${heading}</h2>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">${intro}</p>
        <div dir="ltr" style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="letter-spacing: 6px; color: #111827; margin: 0; font-size: 32px;">${code}</h1>
        </div>
        <p style="color: #9ca3af; font-size: 12px;">${CODE_COPY[locale].validity}</p>`
  );
}

/** Subject and HTML of a one-time code email (sign-up / sign-in, or password reset). Nothing is sent. */
export function renderCodeEmail(kind: "otp" | "reset", code: string, locale: EmailLocale): { subject: string; html: string } {
  const copy = CODE_COPY[locale];
  return kind === "otp"
    ? { subject: copy.otpSubject, html: codeEmail(locale, copy.otpHeading, copy.otpIntro, code) }
    : { subject: copy.resetSubject, html: codeEmail(locale, copy.resetHeading, copy.resetIntro, code) };
}

export function sendOtpEmail(to: string, code: string, locale: EmailLocale = "ar"): Promise<boolean> {
  const { subject, html } = renderCodeEmail("otp", code, locale);
  return send(to, subject, html);
}

export function sendPasswordResetEmail(to: string, code: string, locale: EmailLocale = "ar"): Promise<boolean> {
  const { subject, html } = renderCodeEmail("reset", code, locale);
  return send(to, subject, html);
}

const PARTNER_COPY = {
  ar: {
    approvedSubject: (brand: string) => `تهانينا! تم اعتماد ${brand} - كوورك باس`,
    network: "شبكة شركاء المساحات",
    approvedHeading: "تهانينا! تم اعتماد حسابك 🎉",
    approvedBody: (brand: string) => `يسعدنا إبلاغك بأنه تم التحقق من بيانات مساحتك وسجلها التجاري لـ <strong>${brand}</strong> واعتمادها. أصبحت الآن شريكًا فعّالًا في شبكة كوورك باس.`,
    nextHeading: "ما الذي يمكنك فعله الآن؟",
    next: [
      "سجّل الدخول إلى لوحة تحكم شريك المساحات.",
      "أضف مساحات العمل والمكاتب الخاصة وقاعات الاجتماعات والمرافق.",
      "اضبط أسعار الساعة واليوم لتبدأ باستقبال الحجوزات فورًا.",
    ],
    cta: "الدخول إلى لوحة التحكم",
    footer: "إذا كانت لديك أي أسئلة فتواصل مع دعم الشركاء.<br/>فريق كوورك باس &bull; المملكة العربية السعودية",
    rejectedSubject: (brand: string) => `تحديث بخصوص طلب ${brand} - كوورك باس`,
    rejectedHeading: "تحديث حالة طلب الشراكة",
    rejectedBody: (brand: string) => `شكرًا لاهتمامك بالانضمام إلى كوورك باس. بعد مراجعة بيانات التسجيل الخاصة بـ <strong>${brand}</strong> بعناية، لا يمكننا اعتماد طلبك في الوقت الحالي.`,
    reason: "السبب:",
    contact: "للاستفسار يرجى التواصل مع فريق الدعم على support@coworkingpass.sa.",
  },
  en: {
    approvedSubject: (brand: string) => `Congratulations! ${brand} has been approved - Coworking Pass`,
    network: "Space Venue Partner Network",
    approvedHeading: "Congratulations! Your Account is Approved 🎉",
    approvedBody: (brand: string) => `We are pleased to inform you that your venue credentials and Commercial Registration for <strong>${brand}</strong> have been verified and approved. You are now an active partner on the Coworking Pass network.`,
    nextHeading: "What can you do now?",
    next: [
      "Log in to your Space Partner Dashboard.",
      "List your coworking spaces, private offices, meeting rooms, and facilities.",
      "Configure hourly and day pass rates to start receiving reservations immediately.",
    ],
    cta: "Sign In to Your Dashboard",
    footer: "If you have any questions, feel free to contact partner support.<br/>Coworking Pass Team &bull; Kingdom of Saudi Arabia",
    rejectedSubject: (brand: string) => `Update regarding your application for ${brand} - Coworking Pass`,
    rejectedHeading: "Partner Application Status Update",
    rejectedBody: (brand: string) => `Thank you for your interest in joining Coworking Pass. After careful review of the registration information for <strong>${brand}</strong>, we are unable to approve your application at this time.`,
    reason: "Reason:",
    contact: "For further inquiries, please contact our support team at support@coworkingpass.sa.",
  },
} as const;

export function sendPartnerApprovalEmail(to: string, brandName: string, locale: EmailLocale = "ar"): Promise<boolean> {
  const copy = PARTNER_COPY[locale];
  const brand = escapeHtml(brandName);
  const listSide = locale === "ar" ? "padding-right: 20px;" : "padding-left: 20px;";
  return send(
    to,
    copy.approvedSubject(brandName),
    frame(
      locale,
      600,
      `<div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1b4332; font-size: 24px; margin: 0; font-weight: 700;">${locale === "ar" ? "كوورك باس" : "Coworking Pass"}</h1>
          <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">${copy.network}</p>
        </div>

        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h2 style="color: #065f46; font-size: 18px; margin: 0 0 8px 0;">${copy.approvedHeading}</h2>
          <p style="color: #047857; font-size: 14px; margin: 0; line-height: 1.7;">${copy.approvedBody(brand)}</p>
        </div>

        <div style="margin-bottom: 28px;">
          <h3 style="color: #111827; font-size: 15px; margin-bottom: 12px;">${copy.nextHeading}</h3>
          <ul style="color: #4b5563; font-size: 14px; line-height: 1.8; ${listSide} margin: 0;">
            ${copy.next.map((item) => `<li>${item}</li>`).join("\n            ")}
          </ul>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${siteUrl()}" style="display: inline-block; background-color: #1b4332; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px;">${copy.cta}</a>
        </div>

        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">${copy.footer}</p>`
    )
  );
}

export function sendPartnerRejectionEmail(to: string, brandName: string, reason?: string, locale: EmailLocale = "ar"): Promise<boolean> {
  const copy = PARTNER_COPY[locale];
  const brand = escapeHtml(brandName);
  return send(
    to,
    copy.rejectedSubject(brandName),
    frame(
      locale,
      600,
      `<h2 style="color: #991b1b; margin-top: 0;">${copy.rejectedHeading}</h2>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.7;">${copy.rejectedBody(brand)}</p>
        ${reason ? `<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin: 16px 0; color: #991b1b; font-size: 13px;"><strong>${copy.reason}</strong> ${escapeHtml(reason)}</div>` : ""}
        <p style="color: #6b7280; font-size: 13px;">${copy.contact}</p>`
    )
  );
}

