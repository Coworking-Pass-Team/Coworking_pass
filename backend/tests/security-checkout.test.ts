import { describe, expect, it, vi } from "vitest";
const debit = vi.hoisted(() => vi.fn());
vi.mock("@/lib/company/credit", () => ({ debitPersonalWallet: debit }));
import { settleCheckout } from "@/lib/security/checkout";

describe("atomic wallet settlement", () => {
  it("records only the validated server price and the wallet payment method", async () => {
    debit.mockResolvedValue({ ok: true });
    const db = {
      user: { findUnique: async () => ({ role: "B2C" }) },
      payment: { create: vi.fn(async ({ data }) => data) },
    };
    const result = await settleCheckout(db as any, "u", "booking", "DIRECT_BOOKING", 149.995, "workspace");
    expect(result).toMatchObject({ amount: 150, method: "WALLET", referenceId: "booking", status: "SUCCESS" });
    expect(debit).toHaveBeenLastCalledWith(db, expect.objectContaining({ amount: 150, referenceId: "booking" }));
  });
  it("throws on insufficient funds so the caller's transaction rolls back the booking", async () => {
    debit.mockResolvedValue({ ok: false, error: "Insufficient balance", status: 400 });
    const db = { user: { findUnique: async () => ({ role: "B2C" }) }, payment: { create: vi.fn() } };
    await expect(settleCheckout(db as any, "u", "b", "SUBSCRIPTION", 50)).rejects.toThrow("Insufficient balance");
    expect(db.payment.create).not.toHaveBeenCalled();
  });
  it("uses a conditional company balance decrement and refuses overdraw", async () => {
    const db = {
      user: { findUnique: async () => ({ role: "HR_ADMIN", hrAdminOf: { id: "company" } }) },
      company: { updateMany: vi.fn(async () => ({ count: 0 })) },
      payment: { create: vi.fn() },
    };
    await expect(settleCheckout(db as any, "u", "b", "SUBSCRIPTION", 50)).rejects.toThrow("Insufficient company");
    expect(db.company.updateMany).toHaveBeenCalledWith({ where: { id: "company", balance: { gte: 50 } }, data: { balance: { decrement: 50 } } });
    expect(db.payment.create).not.toHaveBeenCalled();
  });
  it("rejects negative amounts before accessing the database", async () => {
    await expect(settleCheckout({} as any, "u", "b", "SUBSCRIPTION", -50)).rejects.toThrow();
  });
});
