// src/app/dashboard/layout.tsx
import Sidebar from "@/components/dashboard/Sidebar"; // Vamos criar este componente a seguir

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-100 dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
}