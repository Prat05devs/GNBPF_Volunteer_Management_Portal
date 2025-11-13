import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-xl border bg-card p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-foreground">GNBPF Volunteer Portal</h1>
          <p className="text-sm text-muted-foreground">Stay accountable and manage your work efficiently.</p>
        </div>
        {children}
      </div>
    </div>
  );
}

