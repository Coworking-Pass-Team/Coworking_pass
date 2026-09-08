import nodemailer from "nodemailer";

export async function sendOtpEmail(to: string, code: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`\n========================================`);
    console.log(`[OTP VERIFICATION EMAIL]`);
    console.log(`Recipient: ${to}`);
    console.log(`OTP Code: ${code}`);
    console.log(`Validity: 10 minutes`);
    console.log(`========================================\n`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Coworking Pass" <${process.env.EMAIL_USER}>`,
      to,
      subject: "رمز التحقق - Coworking Pass",
      html: `<div dir="rtl" style="font-family: Arial, sans-serif;">
        <h2>رمز التحقق الخاص بك</h2>
        <p>استخدم الرمز التالي لإكمال العملية:</p>
        <h1 style="letter-spacing: 4px; color: #2D3536;">${code}</h1>
        <p>هذا الرمز صالح لمدة 10 دقائق.</p>
      </div>`,
    });
  } catch (error) {
    console.warn("[MAILER WARNING] Failed to send email via SMTP, logging OTP code instead:", error);
    console.log(`\n========================================`);
    console.log(`[FALLBACK OTP CODE FOR ${to}]: ${code}`);
    console.log(`========================================\n`);
  }
}