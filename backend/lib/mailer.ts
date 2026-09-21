import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder_build_key");

export async function sendOtpEmail(to: string, code: string) {
  try {
    await resend.emails.send({
      from: "Coworking Pass <onboarding@resend.dev>",
      to,
      subject: "Verification Code - Coworking Pass",
      html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #1b4332; margin-bottom: 8px;">Your Verification Code</h2>
        <p style="color: #4b5563; font-size: 14px;">Use the following one-time code to complete verification in Coworking Pass:</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="letter-spacing: 6px; color: #111827; margin: 0; font-size: 32px;">${code}</h1>
        </div>
        <p style="color: #9ca3af; font-size: 12px;">This code is valid for 10 minutes. Do not share this code with anyone.</p>
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
      subject: `Congratulations! ${brandName} has been approved - Coworking Pass`,
      html: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1b4332; font-size: 24px; margin: 0; font-weight: 700;">Coworking Pass</h1>
          <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">Space Venue Partner Network</p>
        </div>

        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h2 style="color: #065f46; font-size: 18px; margin: 0 0 8px 0;">Congratulations! Your Account is Approved 🎉</h2>
          <p style="color: #047857; font-size: 14px; margin: 0; line-height: 1.6;">
            We are pleased to inform you that your venue credentials and Commercial Registration for <strong>${brandName}</strong> have been verified and approved. You are now an active partner on the Coworking Pass network.
          </p>
        </div>

        <div style="margin-bottom: 28px;">
          <h3 style="color: #111827; font-size: 15px; margin-bottom: 12px;">What can you do now?</h3>
          <ul style="color: #4b5563; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
            <li>Log in to your Space Partner Dashboard.</li>
            <li>List your coworking spaces, private offices, meeting rooms, and facilities.</li>
            <li>Configure hourly and day pass rates to start receiving reservations immediately.</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="https://coworking-pass.vercel.app/Auth" style="display: inline-block; background-color: #1b4332; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px;">
            Sign In to Your Dashboard
          </a>
        </div>

        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          If you have any questions, feel free to contact partner support.<br/>
          Coworking Pass Team &bull; Kingdom of Saudi Arabia
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
      subject: `Update regarding your application for ${brandName} - Coworking Pass`,
      html: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
        <h2 style="color: #991b1b; margin-top: 0;">Partner Application Status Update</h2>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          Thank you for your interest in joining Coworking Pass. After careful review of the registration information for <strong>${brandName}</strong>, we are unable to approve your application at this time.
        </p>
        ${reason ? `<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin: 16px 0; color: #991b1b; font-size: 13px;"><strong>Reason:</strong> ${reason}</div>` : ''}
        <p style="color: #6b7280; font-size: 13px;">
          For further inquiries, please contact our support team at support@coworkingpass.sa.
        </p>
      </div>`,
    });
  } catch (err) {
    console.error("❌ Error sending partner rejection email:", err);
  }
}