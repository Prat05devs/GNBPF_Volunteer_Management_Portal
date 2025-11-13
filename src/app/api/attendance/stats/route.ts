import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/rbac";

export const GET = withAuth(async (_request, user) => {
  const allTimeResult = await prisma.attendance.aggregate({
    where: {
      userId: user.userId,
      checkOutTime: { not: null },
    },
    _sum: {
      durationMinutes: true,
    },
  });

  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  const monthResult = await prisma.attendance.aggregate({
    where: {
      userId: user.userId,
      date: { gte: firstDayOfMonth },
      checkOutTime: { not: null },
    },
    _sum: {
      durationMinutes: true,
    },
  });

  const totalDays = await prisma.attendance.count({
    where: {
      userId: user.userId,
      checkOutTime: { not: null },
    },
  });

  return NextResponse.json({
    totalHours: Math.round((allTimeResult._sum.durationMinutes ?? 0) / 60),
    monthHours: Math.round((monthResult._sum.durationMinutes ?? 0) / 60),
    totalDays,
  });
});

