import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/rbac";
import { checkOutSchema } from "@/lib/validations/attendance";

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const validated = checkOutSchema.parse(body);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: user.userId,
        date: today,
        checkOutTime: null,
      },
    });

    if (!attendance) {
      return NextResponse.json({ error: "No active check-in found" }, { status: 400 });
    }

    const checkOutTime = new Date();
    const durationMinutes = Math.floor(
      (checkOutTime.getTime() - attendance.checkInTime.getTime()) / 60000,
    );

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime,
        durationMinutes,
        notes: validated.notes ?? attendance.notes,
      },
    });

    return NextResponse.json({
      success: true,
      attendance: {
        ...updated,
        checkInTime: updated.checkInTime.toISOString(),
        checkOutTime: updated.checkOutTime ? updated.checkOutTime.toISOString() : null,
        date: updated.date.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Check-out error:", error);
    return NextResponse.json({ error: "Failed to check out" }, { status: 500 });
  }
});

