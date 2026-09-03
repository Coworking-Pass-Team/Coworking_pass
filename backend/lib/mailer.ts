import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOtpEmail(to: string, code: string) {
  await transporter.sendMail({
    from: `"Coworking Pass" <${process.env.EMAIL_USER}>`,
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