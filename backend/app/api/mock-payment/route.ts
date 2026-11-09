import { NextRequest, NextResponse } from "next/server";
import { idempotent } from "@/lib/security/idempotency";
import { money } from "@/lib/security/input";

const simulate = idempotent("mock-payment", async request => {
  const body = await request.json();
  const amount = money(body.amount);
  // Simulation never creates real payments or ledger credits.
  return NextResponse.json({ status: "SUCCESS", sandbox: true, amount });
});
export async function POST(request: NextRequest) {
  // No secret or client header can turn simulation on in production.
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Not found." }, { status: 404 });
  return simulate(request);
}
