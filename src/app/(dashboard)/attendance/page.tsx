import { AttendanceClient } from "@/components/attendance/attendance-client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-server";

export default async function AttendancePage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayAttendance, stats, records] = await Promise.all([
    prisma.attendance.findFirst({
      where: {
        userId: user.id,
        date: today,
        checkOutTime: null,
      },
    }),
    prisma.attendance.aggregate({
      where: {
        userId: user.id,
        checkOutTime: { not: null },
      },
      _sum: {
        durationMinutes: true,
      },
    }),
    prisma.attendance.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 10,
    }),
  ]);

  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  const monthAgg = await prisma.attendance.aggregate({
    where: {
      userId: user.id,
      date: { gte: firstDayOfMonth },
      checkOutTime: { not: null },
    },
    _sum: {
      durationMinutes: true,
    },
  });

  const totalDays = await prisma.attendance.count({
    where: {
      userId: user.id,
      checkOutTime: { not: null },
    },
  });

  return (
    <AttendanceClient
      initialStatus={{
        isCheckedIn: Boolean(todayAttendance),
        attendanceId: todayAttendance?.id,
        checkInTime: todayAttendance?.checkInTime.toISOString(),
        notes: todayAttendance?.notes,
      }}
      initialStats={{
        totalHours: Math.round((stats._sum.durationMinutes ?? 0) / 60),
        monthHours: Math.round((monthAgg._sum.durationMinutes ?? 0) / 60),
        totalDays,
      }}
      recentRecords={records.map((record) => ({
        id: record.id,
        date: record.date.toISOString(),
        checkInTime: record.checkInTime.toISOString(),
        checkOutTime: record.checkOutTime ? record.checkOutTime.toISOString() : null,
        durationMinutes: record.durationMinutes,
        notes: record.notes,
      }))}
    />
  );
}

