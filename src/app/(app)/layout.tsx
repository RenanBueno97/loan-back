import Sidebar from "@/components/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg sm:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-10 sm:py-10">
        {children}
      </main>
    </div>
  );
}
