import { ViewTransition } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-bg">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 px-10 py-8 pl-[116px]">
          <ViewTransition name="dash-content" enter="dash-content" exit="dash-content" default="none">
            {children}
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}
