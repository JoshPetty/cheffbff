import { DashboardSidebar } from "./DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        .dashboard-main {
          margin-left: 220px;
          min-height: 100vh;
        }
        @media (max-width: 768px) {
          .dashboard-main {
            margin-left: 0;
            padding-bottom: 66px;
          }
        }
      `}</style>
      <DashboardSidebar />
      <main className="dashboard-main">{children}</main>
    </>
  );
}
