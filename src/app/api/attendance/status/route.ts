import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/rbac";

export const GET = withAuth(async (_request, user) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentAttendance = await prisma.attendance.findFirst({
    where: {
      userId: user.userId,
      date: today,
      checkOutTime: null,
    },
  });

  return NextResponse.json({
    isCheckedIn: Boolean(currentAttendance),
    attendance: currentAttendance
      ? {
          id: currentAttendance.id,
          userId: currentAttendance.userId,
          checkInTime: currentAttendance.checkInTime.toISOString(),
          checkOutTime: currentAttendance.checkOutTime
            ? currentAttendance.checkOutTime.toISOString()
            : null,
          durationMinutes: currentAttendance.durationMinutes,
          date: currentAttendance.date.toISOString(),
          notes: currentAttendance.notes,
        }
      : null,
  });
});

