import { Resend } from "resend";

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Email sender configuration
export const EMAIL_FROM = process.env.EMAIL_FROM || "Herbarium Dyeworks <orders@herbarium-dyeworks.com>";

// Check if email is configured
export function isEmailConfigured(): boolean {
  return !!resendApiKey;
}
