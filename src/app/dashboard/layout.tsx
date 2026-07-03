import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      {/* Thallium Background Grid & Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]"></div>
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <Sidebar />
      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0 z-10">
        <div className="w-full h-full p-6 lg:p-12 max-w-[1400px] mx-auto overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
