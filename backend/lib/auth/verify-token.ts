import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

interface TokenPayload {
  userId: string;
  role: string;
}

export function getTokenFromRequest(request: Request): TokenPayload | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "غير مصرح لك بالدخول. يرجى تسجيل الدخول أولاً" },
    { status: 401 }
  );
}