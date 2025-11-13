import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/rbac";

export const GET = withAuth(async (_request, user) => {
  const userData = await prisma.user.findUnique({
    where: { id: user.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    user: userData
      ? {
          ...userData,
          createdAt: userData.createdAt.toISOString(),
        }
      : null,
  });
});

