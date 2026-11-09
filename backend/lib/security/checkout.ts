import type { Prisma, PaymentFor } from "@prisma/client";
import { debitPersonalWallet } from "@/lib/company/credit";
import { findCompanyForUser } from "@/lib/wallet";
import { InputError, money } from "./input";

/** Called in the booking transaction: insufficient funds roll back the booking and its payment. */
export async function settleCheckout(tx: Prisma.TransactionClient, userId: string, referenceId: string, paymentFor: PaymentFor, price: number, workspaceId?: string) {
  const amount = money(price);
  const companyId = await findCompanyForUser(tx, userId);
  if (companyId) {
    const debited = await tx.company.updateMany({ where: { id: companyId, balance: { gte: amount } }, data: { balance: { decrement: amount } } });
    if (!debited.count) throw new InputError("Insufficient company wallet balance.");
    const company = await tx.company.findUniqueOrThrow({ where: { id: companyId } });
    await tx.companyWalletTransaction.create({ data: { companyId, userId, amount, type: "WITHDRAW", referenceId, balanceAfter: company.balance } });
  } else {
    const result = await debitPersonalWallet(tx, { userId, amount, purpose: "PAYMENT", description: "Checkout", referenceId });
    if (!result.ok) throw new InputError(result.error, result.status);
  }
  return tx.payment.create({ data: { userId, workspaceId, referenceId, paymentFor, amount, method: "WALLET", status: "SUCCESS" } });
}
