"use client";

import { format } from "date-fns";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime: string;
  checkOutTime: string | null;
  durationMinutes: number | null;
  notes: string | null;
}

interface AttendanceStats {
  totalHours: number;
  monthHours: number;
  totalDays: number;
}

interface AttendanceClientProps {
  initialStatus: {
    isCheckedIn: boolean;
    attendanceId?: string;
    checkInTime?: string;
    notes?: string | null;
  };
  initialStats: AttendanceStats;
  recentRecords: AttendanceRecord[];
}

export function AttendanceClient({ initialStatus, initialStats, recentRecords }: AttendanceClientProps) {
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState("");
  const [records, setRecords] = useState(recentRecords);
  const [stats, setStats] = useState(initialStats);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCheckIn = () => {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to check in");
        return;
      }

      const data = await response.json();
      setStatus({
        isCheckedIn: true,
        attendanceId: data.attendance.id,
        checkInTime: data.attendance.checkInTime,
        notes: data.attendance.notes,
      });
      setNotes("");
      refreshRecords();
    });
  };

  const handleCheckOut = () => {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to check out");
        return;
      }

      const data = await response.json();
      setStatus({
        isCheckedIn: false,
      });
      setNotes("");
      refreshRecords();
    });
  };

  const refreshRecords = async () => {
    const res = await fetch("/api/attendance/status");
    if (res.ok) {
      const statusData = await res.json();
      setStatus({
        isCheckedIn: statusData.isCheckedIn,
        attendanceId: statusData.attendance?.id,
        checkInTime: statusData.attendance?.checkInTime,
        notes: statusData.attendance?.notes,
      });
    }

    const recentRes = await fetch("/api/attendance/history");
    if (recentRes.ok) {
      const recentData = await recentRes.json();
      setRecords(recentData.records);
    }

    const statsRes = await fetch("/api/attendance/stats");
    if (statsRes.ok) {
      const data = await statsRes.json();
      setStats(data);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
            <CardDescription>Track your work hours and notes for accountability.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant={status.isCheckedIn ? "default" : "secondary"}>
              {status.isCheckedIn ? "Currently Checked In" : "Not Checked In"}
            </Badge>
            {status.isCheckedIn && status.checkInTime && (
              <p className="text-sm text-muted-foreground">
                Checked in at {format(new Date(status.checkInTime), "hh:mm a")}
              </p>
            )}
            <Textarea
              placeholder="Add notes about your shift (optional)"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <div className="flex items-center gap-3">
              <Button onClick={handleCheckIn} disabled={status.isCheckedIn || pending}>
                Check In
              </Button>
              <Button onClick={handleCheckOut} variant="outline" disabled={!status.isCheckedIn || pending}>
                Check Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>Your last 10 attendance entries.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                      No attendance records yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), "PPP")}</TableCell>
                      <TableCell>
                        {record.durationMinutes ? `${Math.round(record.durationMinutes / 60)}h` : "In progress"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{record.notes ?? "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
            <CardDescription>Totals based on your check-ins.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SummaryItem label="Total Hours" value={`${stats.totalHours}h`} />
            <SummaryItem label="Hours This Month" value={`${stats.monthHours}h`} />
            <SummaryItem label="Total Days Attended" value={stats.totalDays} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-base font-semibold text-foreground">{value}</span>
    </div>
  );
}

