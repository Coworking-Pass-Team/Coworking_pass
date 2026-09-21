import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder_build_key");

export async function sendOtpEmail(to: string, code: string) {
  try {
    await resend.emails.send({
      from: "Coworking Pass <onboarding@resend.dev>",
      to,
      subject: "رمز التحقق - Coworking Pass",
      html: `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #1b4332; margin-bottom: 8px;">رمز التحقق الخاص بك</h2>
        <p style="color: #4b5563; font-size: 14px;">استخدم الرمز التالي لإكمال العملية في منصة Coworking Pass:</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="letter-spacing: 6px; color: #111827; margin: 0; font-size: 32px;">${code}</h1>
        </div>
        <p style="color: #9ca3af; font-size: 12px;">هذا الرمز صالح لمدة 10 دقائق فقط. لا تشارك هذا الرمز مع أي شخص.</p>
      </div>`,
    });
  } catch (err) {
    console.error("❌ Error sending OTP email:", err);
  }
}

export async function sendPartnerApprovalEmail(to: string, brandName: string) {
  try {
    await resend.emails.send({
      from: "Coworking Pass <onboarding@resend.dev>",
      to,
      subject: `تهانينا! تم اعتماد حساب منشأة ${brandName} - Coworking Pass`,
      html: `<div dir="rtl" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1b4332; font-size: 24px; margin: 0; font-weight: 700;">Coworking Pass</h1>
          <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">بوابة شركاء ومزودي مساحات العمل</p>
        </div>

        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h2 style="color: #065f46; font-size: 18px; margin: 0 0 8px 0;">تهانينا! تم اعتماد حسابكم بنجاح 🎉</h2>
          <p style="color: #047857; font-size: 14px; margin: 0; line-height: 1.6;">
            يسرنا إبلاغكم بأنه تم التحقق من بيانات منشأتكم <strong>${brandName}</strong> والسجل التجاري المرفق، وتم اعتماد انضمامكم إلى شبكة شركاء Coworking Pass.
          </p>
        </div>

        <div style="margin-bottom: 28px;">
          <h3 style="color: #111827; font-size: 15px; margin-bottom: 12px;">ماذا يمكنك فعله الآن؟</h3>
          <ul style="color: #4b5563; font-size: 14px; line-height: 1.8; padding-right: 20px; margin: 0;">
            <li>تسجيل الدخول إلى لوحة تحكم مزود المساحات.</li>
            <li>إضافة مساحات وفروع العمل الخاصة بكم وقاعاتها ومرافقها.</li>
            <li>تحديد باقات الأسعار وبدء استقبال الحجوزات وزوار الباس فوراً.</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="https://coworking-pass.vercel.app/Auth" style="display: inline-block; background-color: #1b4332; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px;">
            تسجيل الدخول إلى حسابك الآن
          </a>
        </div>

        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          إذا كان لديكم أي استفسار، يمكنكم التواصل مع فريق دعم الشركاء عبر هذا البريد.<br/>
          فريق عمل Coworking Pass المملكة العربية السعودية
        </p>
      </div>`,
    });
  } catch (err) {
    console.error("❌ Error sending partner approval email:", err);
  }
}

export async function sendPartnerRejectionEmail(to: string, brandName: string, reason?: string) {
  try {
    await resend.emails.send({
      from: "Coworking Pass <onboarding@resend.dev>",
      to,
      subject: `تحديث بخصوص طلب انضمام منشأة ${brandName} - Coworking Pass`,
      html: `<div dir="rtl" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
        <h2 style="color: #991b1b; margin-top: 0;">تحديث بشأن طلب الانضمام</h2>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          شكراً لاهتمامكم بالانضمام إلى شبكة Coworking Pass. نود إبلاغكم بأنه بعد مراجعة بيانات المنشأة <strong>${brandName}</strong> والسجل التجاري، لم نتمكن من اعتماد الطلب في الوقت الحالي.
        </p>
        ${reason ? `<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin: 16px 0; color: #991b1b; font-size: 13px;"><strong>السبب:</strong> ${reason}</div>` : ''}
        <p style="color: #6b7280; font-size: 13px;">
          يمكنكم مراجعة البيانات والتواصل مع فريق الدعم لمزيد من المعلومات.
        </p>
      </div>`,
    });
  } catch (err) {
    console.error("❌ Error sending partner rejection email:", err);
  }
}