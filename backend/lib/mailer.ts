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

function codeEmail(heading: string, intro: string, code: string): string {
  return `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #1b4332; margin-bottom: 8px;">${heading}</h2>
        <p style="color: #4b5563; font-size: 14px;">${intro}</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="letter-spacing: 6px; color: #111827; margin: 0; font-size: 32px;">${code}</h1>
        </div>
        <p style="color: #9ca3af; font-size: 12px;">This code is valid for 10 minutes. Do not share this code with anyone.</p>
      </div>`;
}

export function sendOtpEmail(to: string, code: string): Promise<boolean> {
  return send(
    to,
    "Verification Code - Coworking Pass",
    codeEmail("Your Verification Code", "Use the following one-time code to complete verification in Coworking Pass:", code)
  );
}

export function sendPasswordResetEmail(to: string, code: string): Promise<boolean> {
  return send(
    to,
    "Reset your password - Coworking Pass",
    codeEmail(
      "Reset Your Password",
      "We received a request to reset your Coworking Pass password. Enter this code to choose a new one. If you did not ask for this, you can ignore this email and your password stays the same:",
      code
    )
  );
}

export function sendPartnerApprovalEmail(to: string, brandName: string): Promise<boolean> {
  const brand = escapeHtml(brandName);
  return send(
    to,
    `Congratulations! ${brandName} has been approved - Coworking Pass`,
    `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1b4332; font-size: 24px; margin: 0; font-weight: 700;">Coworking Pass</h1>
          <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">Space Venue Partner Network</p>
        </div>

        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h2 style="color: #065f46; font-size: 18px; margin: 0 0 8px 0;">Congratulations! Your Account is Approved 🎉</h2>
          <p style="color: #047857; font-size: 14px; margin: 0; line-height: 1.6;">
            We are pleased to inform you that your venue credentials and Commercial Registration for <strong>${brand}</strong> have been verified and approved. You are now an active partner on the Coworking Pass network.
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
          <a href="${siteUrl()}" style="display: inline-block; background-color: #1b4332; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px;">
            Sign In to Your Dashboard
          </a>
        </div>

        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          If you have any questions, feel free to contact partner support.<br/>
          Coworking Pass Team &bull; Kingdom of Saudi Arabia
        </p>
      </div>`
  );
}

export function sendPartnerRejectionEmail(to: string, brandName: string, reason?: string): Promise<boolean> {
  const brand = escapeHtml(brandName);
  return send(
    to,
    `Update regarding your application for ${brandName} - Coworking Pass`,
    `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
        <h2 style="color: #991b1b; margin-top: 0;">Partner Application Status Update</h2>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          Thank you for your interest in joining Coworking Pass. After careful review of the registration information for <strong>${brand}</strong>, we are unable to approve your application at this time.
        </p>
        ${reason ? `<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin: 16px 0; color: #991b1b; font-size: 13px;"><strong>Reason:</strong> ${escapeHtml(reason)}</div>` : ""}
        <p style="color: #6b7280; font-size: 13px;">
          For further inquiries, please contact our support team at support@coworkingpass.sa.
        </p>
      </div>`
  );
}
