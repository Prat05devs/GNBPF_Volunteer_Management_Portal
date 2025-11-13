import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/rbac";

export const GET = withAuth(async (_request, user) => {
  const records = await prisma.attendance.findMany({
    where: { userId: user.userId },
    orderBy: { date: "desc" },
    take: 10,
  });

  return NextResponse.json({
    records: records.map((record) => ({
      id: record.id,
      date: record.date.toISOString(),
      checkInTime: record.checkInTime.toISOString(),
      checkOutTime: record.checkOutTime ? record.checkOutTime.toISOString() : null,
      durationMinutes: record.durationMinutes,
      notes: record.notes,
    })),
  });
});

