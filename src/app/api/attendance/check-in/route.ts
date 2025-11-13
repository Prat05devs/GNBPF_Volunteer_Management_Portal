import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/rbac";
import { checkInSchema } from "@/lib/validations/attendance";

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const validated = checkInSchema.parse(body);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingCheckIn = await prisma.attendance.findFirst({
      where: {
        userId: user.userId,
        date: today,
        checkOutTime: null,
      },
    });

    if (existingCheckIn) {
      return NextResponse.json(
        { error: "Already checked in. Please check out first." },
        { status: 400 },
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: user.userId,
        checkInTime: new Date(),
        date: today,
        notes: validated.notes,
      },
    });

    return NextResponse.json({
      success: true,
      attendance: {
        ...attendance,
        checkInTime: attendance.checkInTime.toISOString(),
        checkOutTime: attendance.checkOutTime ? attendance.checkOutTime.toISOString() : null,
        date: attendance.date.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }
});

