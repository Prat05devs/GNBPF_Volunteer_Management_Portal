import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth-server";
import { cookies } from "next/headers";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/attendance", label: "Attendance" },
  { href: "/tasks", label: "Tasks" },
  { href: "/submissions", label: "Submissions" },
];

async function logoutAction() {
  "use server";
  cookies().delete("auth_token");
  redirect("/login");
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-10">
            <Link href="/dashboard" className="text-lg font-semibold">
              GNBPF Volunteer Portal
            </Link>
            <nav className="hidden gap-6 text-sm font-medium md:flex">
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
            </div>
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <form action={logoutAction}>
              <Button variant="outline" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}

