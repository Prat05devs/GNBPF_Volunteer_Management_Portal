import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  // Admin Dashboard
  if (user.role === "ADMIN") {
    const [totalVolunteers, totalTasks, allVolunteers, recentAttendance] = await Promise.all([
      prisma.user.count({
        where: { role: "VOLUNTEER" },
      }),
      prisma.task.count(),
      prisma.user.findMany({
        where: { role: "VOLUNTEER" },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true,
          attendances: {
            where: { checkOutTime: { not: null } },
            select: { durationMinutes: true },
          },
          assignedTasks: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.attendance.findMany({
        where: { checkOutTime: { not: null } },
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { date: "desc" },
        take: 10,
      }),
    ]);

    const volunteersWithStats = allVolunteers.map((vol) => {
      const totalMinutes = vol.attendances.reduce((sum, att) => sum + (att.durationMinutes ?? 0), 0);
      const totalHours = Math.round(totalMinutes / 60);
      const activeTasks = vol.assignedTasks.filter((t) => t.status !== "COMPLETED").length;
      const completedTasks = vol.assignedTasks.filter((t) => t.status === "COMPLETED").length;
      
      return {
        ...vol,
        totalHours,
        activeTasks,
        completedTasks,
        totalTasks: vol.assignedTasks.length,
      };
    });

    const totalHoursAll = volunteersWithStats.reduce((sum, vol) => sum + vol.totalHours, 0);
    const totalActiveTasks = volunteersWithStats.reduce((sum, vol) => sum + vol.activeTasks, 0);

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">Manage volunteers and track overall progress.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Total Volunteers</CardDescription>
              <CardTitle className="text-3xl font-bold">{totalVolunteers}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Total Hours Logged</CardDescription>
              <CardTitle className="text-3xl font-bold">{totalHoursAll}h</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Active Tasks</CardDescription>
              <CardTitle className="text-3xl font-bold">{totalActiveTasks}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Total Tasks</CardDescription>
              <CardTitle className="text-3xl font-bold">{totalTasks}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Volunteer List</CardTitle>
            <CardDescription>Overview of all volunteers, their tasks, and hours worked.</CardDescription>
          </CardHeader>
          <CardContent>
            {volunteersWithStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No volunteers registered yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Volunteer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Active Tasks</TableHead>
                    <TableHead>Completed Tasks</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {volunteersWithStats.map((volunteer) => (
                    <TableRow key={volunteer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {volunteer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{volunteer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{volunteer.email}</TableCell>
                      <TableCell>
                        <span className="font-semibold">{volunteer.totalHours}h</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{volunteer.activeTasks}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{volunteer.completedTasks}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(volunteer.createdAt, "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>Latest check-ins across all volunteers.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAttendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance records yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Volunteer</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Total Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAttendance.map((attendance) => (
                    <TableRow key={attendance.id}>
                      <TableCell className="font-medium">{format(attendance.date, "MMM d, yyyy")}</TableCell>
                      <TableCell>{attendance.user.name}</TableCell>
                      <TableCell>{format(attendance.checkInTime, "hh:mm a")}</TableCell>
                      <TableCell>
                        {attendance.checkOutTime ? format(attendance.checkOutTime, "hh:mm a") : "--"}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {attendance.durationMinutes ? `${Math.round(attendance.durationMinutes / 60)}h` : "--"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Volunteer Dashboard (existing code)

  const [attendanceAgg, monthAgg, totalDays, pendingTasks, activeTasks, recentSubmissions] = await Promise.all([
    prisma.attendance.aggregate({
      where: { userId: user.id, checkOutTime: { not: null } },
      _sum: { durationMinutes: true },
    }),
    prisma.attendance.aggregate({
      where: {
        userId: user.id,
        checkOutTime: { not: null },
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { durationMinutes: true },
    }),
    prisma.attendance.count({
      where: { userId: user.id, checkOutTime: { not: null } },
    }),
    prisma.task.count({
      where: { assignedTo: user.id, status: "PENDING" },
    }),
    prisma.task.count({
      where: { assignedTo: user.id, status: { in: ["PENDING", "IN_PROGRESS"] } },
    }),
    prisma.submission.findMany({
      where: { userId: user.id },
      include: {
        task: { select: { title: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
  ]);

  const totalHours = Math.round((attendanceAgg._sum.durationMinutes ?? 0) / 60);
  const monthHours = Math.round((monthAgg._sum.durationMinutes ?? 0) / 60);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Welcome back, {user.name.split(" ")[0]}!</h2>
        <p className="text-muted-foreground">Here&apos;s a quick snapshot of your impact.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Hours Logged</CardDescription>
            <CardTitle className="text-3xl font-bold">{totalHours}h</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Hours This Month</CardDescription>
            <CardTitle className="text-3xl font-bold">{monthHours}h</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Attendance Days</CardDescription>
            <CardTitle className="text-3xl font-bold">{totalDays}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active Tasks</CardDescription>
            <CardTitle className="text-3xl font-bold">{activeTasks}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Tasks</CardTitle>
            <CardDescription>You have {pendingTasks} tasks that need attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Stay on track by updating your task status as you make progress. Completed tasks will appear in your
              submission history.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Your latest work awaiting review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet. Submit your first task update!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{submission.task.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{submission.reviewStatus}</Badge>
                      </TableCell>
                      <TableCell>{format(submission.submittedAt, "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

