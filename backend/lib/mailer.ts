import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(to: string, code: string) {
  await resend.emails.send({
    from: "Coworking Pass <onboarding@resend.dev>",
    to,
    subject: "رمز التحقق - Coworking Pass",
    html: `<div dir="rtl" style="font-family: Arial, sans-serif;">
      <h2>رمز التحقق الخاص بك</h2>
      <p>استخدم الرمز التالي لإكمال العملية:</p>
      <h1 style="letter-spacing: 4px;">${code}</h1>
      <p>هذا الرمز صالح لمدة 10 دقائق.</p>
    </div>`,
  });
}