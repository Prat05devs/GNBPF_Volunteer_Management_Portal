import { type NextRequest, NextResponse } from "next/server";
import { JWTPayload, verifyToken } from "@/lib/auth";

export type Role = "ADMIN" | "VOLUNTEER";

export const authenticate = async (
  request: NextRequest,
): Promise<{ user: JWTPayload | null; error: string | null }> => {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return { user: null, error: "No authentication token found" };
  }

  const user = verifyToken(token);

  if (!user) {
    return { user: null, error: "Invalid or expired token" };
  }

  return { user, error: null };
};

type Handler = (
  req: NextRequest,
  user: JWTPayload,
  ctx?: { params: Record<string, string> },
) => Promise<NextResponse>;

export const withAuth = (
  handler: Handler,
  allowedRoles?: Role[],
) => {
  return async (request: NextRequest, context: { params: Record<string, string> } = { params: {} }) => {
    const { user, error } = await authenticate(request);

    if (error || !user) {
      return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    return handler(request, user, context);
  };
};

