/** Never spread a partner record into a public response. */
export function publicPartner(partner: { id: string; brandName: string } | null) {
  return partner ? { id: partner.id, brandName: partner.brandName } : null;
}
