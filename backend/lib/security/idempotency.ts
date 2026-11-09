import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, unauthorizedResponse } from "@/lib/auth/verify-token";
import { financialBody, InputError, inputResponse } from "./input";

class RollbackResponse { constructor(public response: NextResponse) {} }
/** The result and all mutations commit together. A lost HTTP response can safely be retried. */
export function idempotent(scope: string, handler: (request: NextRequest, db: Prisma.TransactionClient) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const user = await getTokenFromRequest(request);
      if (!user) return unauthorizedResponse(request);
      const key = request.headers.get("Idempotency-Key");
      if (!key || !/^[A-Za-z0-9_-]{16,128}$/.test(key)) throw new InputError("A 16–128 character Idempotency-Key is required.");
      const body = await financialBody(request);
      const json = JSON.stringify(body);
      const requestHash = createHash("sha256").update(json).digest("hex");
      const id = createHash("sha256").update(`${user.userId}:${scope}:${key}`).digest("hex");
      return await prisma.$transaction(async db => {
        await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${id}, 0))`;
        const previous = await db.idempotencyRecord.findUnique({ where: { id } });
        if (previous) {
          if (previous.requestHash !== requestHash) throw new InputError("Idempotency-Key was already used with a different payload.", 409);
          return NextResponse.json(previous.body, { status: previous.status });
        }
        const copy = new NextRequest(request.url, { method: request.method, headers: request.headers, body: json });
        const response = await handler(copy, db);
        if (response.status >= 400) throw new RollbackResponse(response);
        const responseBody = await response.clone().json();
        await db.idempotencyRecord.create({ data: { id, requestHash, status: response.status, body: responseBody } });
        return response;
      }, { maxWait: 10_000, timeout: 30_000 });
    } catch (error) {
      if (error instanceof RollbackResponse) return error.response;
      return inputResponse(error) ?? NextResponse.json({ error: "Transaction failed." }, { status: 500 });
    }
  };
}
