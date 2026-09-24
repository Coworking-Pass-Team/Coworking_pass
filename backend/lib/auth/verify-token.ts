import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { isBlacklisted } from "./token-blacklist";

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

    // رفض التوكن لو صاحبه محظور أو سجّل خروج (Blacklist)
    if (isBlacklisted(decoded.userId)) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized access. Please log in first." },
    { status: 401 }
  );
}